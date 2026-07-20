import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDb from '@/lib/db'
import User from '@/models/user.model'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Booking from '@/models/booking.model'
import {
  etaMinutesFromKm,
  estimateTripFare,
  haversineKm,
} from '@/lib/geo'
import type { NearbyPartner, VehicleType } from '@/types/nearby'

const VEHICLE_TYPES: VehicleType[] = ['bike', 'car', 'loading', 'truck', 'auto']
const DEFAULT_RADIUS_KM = 5

function hasValidLocation(coords: unknown): coords is [number, number] {
  if (!Array.isArray(coords) || coords.length < 2) return false
  const lng = Number(coords[0])
  const lat = Number(coords[1])
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false
  // Default schema value — partner has not shared GPS yet
  if (lat === 0 && lng === 0) return false
  return true
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const lat = parseFloat(searchParams.get('lat') ?? '')
    const lng = parseFloat(searchParams.get('lng') ?? '')
    const type = searchParams.get('type') as VehicleType | 'all' | null
    const tripKm = parseFloat(searchParams.get('tripKm') ?? '0')
    const radiusKm = parseFloat(
      searchParams.get('radiusKm') ?? String(DEFAULT_RADIUS_KM)
    )

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: 'lat and lng query params are required' },
        { status: 400 }
      )
    }

    if (!type || (type !== 'all' && !VEHICLE_TYPES.includes(type))) {
      return NextResponse.json(
        { error: 'Valid vehicle type is required (or use "all")' },
        { status: 400 }
      )
    }

    await connectDb()

    const maxRadiusKm = Math.min(Math.max(radiusKm, 0.5), 50)

    // Discoverable = verified partner, not rejected, real GPS (not default [0,0]), isOnline = true
    const rows = await User.aggregate([
      {
        $match: {
          role: 'partner',
          isPartnerVerified: true,
          partnerStatus: { $nin: ['rejected', 'none'] },
          isOnline: true,
          'location.coordinates.0': { $exists: true },
          'location.coordinates.1': { $exists: true },
        },
      },
      {
        $lookup: {
          from: 'vehicles',
          localField: '_id',
          foreignField: 'owner',
          as: 'vehicles',
        },
      },
      { $unwind: '$vehicles' },
      {
        $match: {
          ...(type !== 'all' ? { 'vehicles.type': type } : {}),
          'vehicles.status': 'approved',
          'vehicles.isActive': true,
        },
      },
      // Exclude partners who are currently on an active ride
      {
        $lookup: {
          from: 'bookings',
          let: { partnerId: '$_id', vehicleId: '$vehicles._id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$partner', '$$partnerId'] },
                    { $in: ['$status', ['confirmed', 'started']] },
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: 'activeBookings',
        },
      },
      {
        $match: {
          activeBookings: { $eq: [] },
        },
      },
      {
        $project: {
          partnerId: '$_id',
          partnerName: '$name',
          isOnline: 1,
          coordinates: '$location.coordinates',
          vehicle: '$vehicles',
        },
      },
    ])

    const results: NearbyPartner[] = rows
      .map((row) => {
        const coords = row.coordinates
        if (!hasValidLocation(coords)) return null

        const partnerLng = coords[0]
        const partnerLat = coords[1]
        const distanceKm =
          Math.round(haversineKm(lat, lng, partnerLat, partnerLng) * 10) / 10

        if (distanceKm > maxRadiusKm) return null

        const vehicle = row.vehicle
        const tripDistance =
          Number.isFinite(tripKm) && tripKm > 0 ? tripKm : distanceKm

        return {
          partnerId: String(row.partnerId),
          partnerName: row.partnerName as string,
          lat: partnerLat,
          lng: partnerLng,
          distanceKm,
          etaMin: etaMinutesFromKm(distanceKm),
          estimatedFare: estimateTripFare(
            vehicle.baseFare ?? 0,
            vehicle.perKmFare ?? 0,
            tripDistance
          ),
          isOnline: Boolean(row.isOnline),
          vehicle: {
            id: String(vehicle._id),
            type: vehicle.type,
            vehicleModel: vehicle.vehicleModel,
            number: vehicle.number,
            imageUrl: vehicle.imageUrl ?? null,
            baseFare: vehicle.baseFare ?? 0,
            perKmFare: vehicle.perKmFare ?? 0,
            waitingFare: vehicle.waitingFare ?? 0,
          },
        } satisfies NearbyPartner
      })
      .filter((p): p is NearbyPartner => p !== null)
      .sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
        return a.distanceKm - b.distanceKm
      })

    return NextResponse.json({
      partners: results,
      count: results.length,
      radiusKm: maxRadiusKm,
    })
  } catch (error) {
    console.error('nearby vehicles error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nearby vehicles' },
      { status: 500 }
    )
  }
}
