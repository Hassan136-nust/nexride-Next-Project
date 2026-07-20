import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Booking from '@/models/booking.model'
import { IBooking } from '@/models/booking.model'
import User from '@/models/user.model'

const OPEN_BOOKING_STATUSES = ['requested', 'awaiting_payment', 'confirmed', 'started'] as const

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDb()

        const body = await req.json()
        const {
            pickup,
            dropoff,
            vehicleType,
            estimatedFare,
            distanceKm,
            durationMin,
            partnerId,
            paymentMethod,
            passengerPhone,
            passengerName,
            vehicleModel,
            vehicleNumber,
        } = body

        if (!pickup || !dropoff || !vehicleType || !estimatedFare) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
        }

        const sessionUser = session.user as { id: string; role: string; name?: string | null; email?: string | null }
        const currentUser = await User.findById(sessionUser.id).select('name email').lean()
        const openBooking = await Booking.findOne({
            user: sessionUser.id,
            status: { $in: OPEN_BOOKING_STATUSES as any },
        }).select('_id status')
        if (openBooking) {
            return NextResponse.json(
                {
                    error: 'You already have an ongoing ride. Complete or cancel it before booking a new ride.',
                    bookingId: openBooking._id,
                    status: openBooking.status,
                },
                { status: 409 }
            )
        }

        const resolvedPassengerName =
            passengerName?.trim() ||
            currentUser?.name?.trim() ||
            sessionUser.name?.trim() ||
            sessionUser.email?.split('@')[0] ||
            'Passenger'
        const resolvedPassengerPhone = passengerPhone?.trim() || ''

        const isOnlinePayment = paymentMethod === 'card'

        // Platform fee = 5% of base fare (goes to admin)
        const PLATFORM_FEE_PERCENT = 0.05
        const baseFare = Number(estimatedFare) || 0
        const platformFee = Math.round(baseFare * PLATFORM_FEE_PERCENT)
        const totalFare = baseFare + platformFee   // what customer pays
        const partnerEarning = baseFare              // what partner receives

        // Card payments are deferred until ride completion.
        // Booking always starts as 'requested' regardless of payment method.
        const booking = await Booking.create({
            user: sessionUser.id,
            partner: partnerId || null,
            pickup: {
                label: pickup.label,
                coordinates: [pickup.lng, pickup.lat],
            },
            dropoff: {
                label: dropoff.label,
                coordinates: [dropoff.lng, dropoff.lat],
            },
            vehicleType,
            estimatedFare: baseFare,
            platformFee,
            partnerEarning,
            totalFare,
            distanceKm: distanceKm || 0,
            durationMin: durationMin || 0,
            status: 'requested',
            paymentStatus: isOnlinePayment ? 'pending' : 'cash',
            paymentMethod: paymentMethod || 'cash',
            passengerPhone: resolvedPassengerPhone,
            passengerName: resolvedPassengerName,
            vehicleModel: vehicleModel || '',
            vehicleNumber: vehicleNumber || '',
        })

        return NextResponse.json({
            success: true,
            message: isOnlinePayment
                ? 'Booking request created. You can pay online after your ride is completed.'
                : 'Booking request created successfully',
            booking,
        })
    } catch (error) {
        console.error('Booking request error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}


export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDb()

        const sessionUser = session.user as { id: string; role: string }
        const url = new URL(req.url)
        const statusFilter = url.searchParams.get('status') // Optional filter (e.g. requested, active)
        const openOnly = url.searchParams.get('open') === 'true'

        let query: any = {}

        if (sessionUser.role === 'partner') {
            // For partners, if they are fetching pending requested rides, they might want all requested rides of their type
            // OR specifically assigned to them. Let's allow fetching both:
            if (statusFilter === 'requested') {
                query = {
                    status: 'requested',
                    $or: [{ partner: sessionUser.id }, { partner: null }],
                }
            } else {
                query = { partner: sessionUser.id }
            }
        } else {
            // Customers retrieve their own bookings
            query = { user: sessionUser.id }
        }

        if (openOnly) {
            query.status = { $in: OPEN_BOOKING_STATUSES as any }
        } else if (statusFilter && statusFilter !== 'requested') {
            query.status = statusFilter
        }

        const bookings = await Booking.find(query)
            .populate('user', 'name email phone role')
            .populate('partner', 'name email phone role')
            .sort({ createdAt: -1 })

        return NextResponse.json({ success: true, bookings })
    } catch (error) {
        console.error('Fetch bookings error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
