'use client'

import React, { Suspense, useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Bike,
  Car,
  Clock,
  Layers,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Route,
  Scooter,
  Truck,
  Users,
} from 'lucide-react'
import { forwardGeocode, reverseGeocode } from '@/lib/photon'
import { fetchDrivingRoute } from '@/lib/routing'
import type { RidePoint, RouteStats } from '@/components/SearchMap'
import NearbyPartnerCard from '@/components/NearbyPartnerCard'
import type { NearbyPartner } from '@/types/nearby'

const SearchMap = dynamic(() => import('@/components/SearchMap'), {
  ssr: false,
  loading: () => (
    <div className='flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-white/10 bg-zinc-200'>
      <span className='text-sm font-medium text-zinc-600'>Loading map…</span>
    </div>
  ),
})

const VEHICLE_META: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  all: { label: 'All Vehicles', icon: Layers },
  bike: { label: 'Ride Bike', icon: Bike },
  car: { label: 'Ride Car', icon: Car },
  auto: { label: 'Ride Auto', icon: Scooter },
  loading: { label: 'Ride Loader', icon: Package },
  truck: { label: 'NexRide Cargo', icon: Truck },
}

const VEHICLE_FILTERS = ['all', 'bike', 'car', 'auto', 'loading', 'truck'] as const
type VehicleFilter = (typeof VEHICLE_FILTERS)[number]

function parseCoord(value: string | null): number | null {
  if (!value) return null
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : null
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const vehicle = searchParams.get('vehicle') || 'car'
  const phone = searchParams.get('phone') || ''
  const pickupLabelParam = searchParams.get('pickup') || ''
  const dropoffLabelParam = searchParams.get('dropoff') || ''

  const [initError, setInitError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [routeLoading, setRouteLoading] = useState(false)

  const [pickup, setPickup] = useState<RidePoint | null>(null)
  const [dropoff, setDropoff] = useState<RidePoint | null>(null)
  const [route, setRoute] = useState<RouteStats | null>(null)
  const [nearbyPartners, setNearbyPartners] = useState<NearbyPartner[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<VehicleFilter>(vehicle as VehicleFilter || 'all')

  const loadRoute = useCallback(
    async (pick: RidePoint, drop: RidePoint) => {
      setRouteLoading(true)
      try {
        const result = await fetchDrivingRoute(pick, drop)
        setRoute(result)
        return result
      } finally {
        setRouteLoading(false)
      }
    },
    []
  )

  const fetchNearby = useCallback(
    async (pick: RidePoint, tripKm?: number, typeOverride?: VehicleFilter) => {
      setNearbyLoading(true)
      const typeParam = typeOverride ?? filterType
      try {
        const params = new URLSearchParams({
          lat: String(pick.lat),
          lng: String(pick.lng),
          type: typeParam,
          radiusKm: '5',
        })
        if (tripKm != null && tripKm > 0) {
          params.set('tripKm', String(tripKm))
        }
        const res = await fetch(`/api/vehicles/nearby?${params}`)
        if (!res.ok) throw new Error('Failed to load nearby partners')
        const data = await res.json()
        const list: NearbyPartner[] = data.partners ?? []
        setNearbyPartners(list)
        setSelectedPartnerId((prev) =>
          prev && list.some((p) => p.partnerId === prev)
            ? prev
            : list[0]?.partnerId ?? null
        )
      } catch {
        setNearbyPartners([])
        setSelectedPartnerId(null)
      } finally {
        setNearbyLoading(false)
      }
    },
    [filterType]
  )

  useEffect(() => {
    let cancelled = false

    async function init() {
      setInitializing(true)
      setInitError(null)

      try {
        let pickLat = parseCoord(searchParams.get('pickupLat'))
        let pickLng = parseCoord(searchParams.get('pickupLng'))
        let dropLat = parseCoord(searchParams.get('dropoffLat'))
        let dropLng = parseCoord(searchParams.get('dropoffLng'))

        let pickLabel = pickupLabelParam
        let dropLabel = dropoffLabelParam

        if (pickLat == null || pickLng == null) {
          if (!pickupLabelParam) throw new Error('Missing pickup location')
          const geocoded = await forwardGeocode(pickupLabelParam)
          if (!geocoded) throw new Error('Could not locate pickup address')
          pickLat = geocoded.lat
          pickLng = geocoded.lng
          pickLabel = geocoded.label
        }

        if (dropLat == null || dropLng == null) {
          if (!dropoffLabelParam) throw new Error('Missing dropoff location')
          const geocoded = await forwardGeocode(dropoffLabelParam)
          if (!geocoded) throw new Error('Could not locate dropoff address')
          dropLat = geocoded.lat
          dropLng = geocoded.lng
          dropLabel = geocoded.label
        }

        const pick: RidePoint = {
          lat: pickLat,
          lng: pickLng,
          label: pickLabel || `${pickLat.toFixed(5)}, ${pickLng.toFixed(5)}`,
        }
        const drop: RidePoint = {
          lat: dropLat,
          lng: dropLng,
          label: dropLabel || `${dropLat.toFixed(5)}, ${dropLng.toFixed(5)}`,
        }

        if (cancelled) return
        setPickup(pick)
        setDropoff(drop)
        const routeResult = await loadRoute(pick, drop)
        await fetchNearby(pick, routeResult?.distanceKm, vehicle as VehicleFilter)
      } catch (e) {
        if (!cancelled) {
          setInitError(
            e instanceof Error ? e.message : 'Failed to load ride details'
          )
        }
      } finally {
        if (!cancelled) setInitializing(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
    // Initial load only — drag updates sync URL without re-init
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncUrl = useCallback(
    (pick: RidePoint, drop: RidePoint) => {
      const q = new URLSearchParams({
        vehicle,
        phone,
        pickup: pick.label,
        dropoff: drop.label,
        pickupLat: String(pick.lat),
        pickupLng: String(pick.lng),
        dropoffLat: String(drop.lat),
        dropoffLng: String(drop.lng),
      })
      router.replace(`/user/search?${q.toString()}`, { scroll: false })
    },
    [router, vehicle, phone]
  )

  const handlePickupMoved = useCallback(
    async (point: RidePoint) => {
      if (!dropoff) return
      setPickup(point)
      setRouteLoading(true)
      try {
        const label = await reverseGeocode(point.lat, point.lng)
        const updated = { ...point, label }
        setPickup(updated)
        syncUrl(updated, dropoff)
        const routeResult = await loadRoute(updated, dropoff)
        await fetchNearby(updated, routeResult?.distanceKm)
      } catch {
        const routeResult = await loadRoute(point, dropoff)
        await fetchNearby(point, routeResult?.distanceKm)
      }
    },
    [dropoff, loadRoute, syncUrl, fetchNearby]
  )

  const handleDropoffMoved = useCallback(
    async (point: RidePoint) => {
      if (!pickup) return
      setDropoff(point)
      setRouteLoading(true)
      try {
        const label = await reverseGeocode(point.lat, point.lng)
        const updated = { ...point, label }
        setDropoff(updated)
        syncUrl(pickup, updated)
        const routeResult = await loadRoute(pickup, updated)
        if (pickup) await fetchNearby(pickup, routeResult?.distanceKm)
      } catch {
        await loadRoute(pickup, point)
      }
    },
    [pickup, loadRoute, syncUrl, fetchNearby]
  )

  // Re-fetch nearby partners when the vehicle type filter changes
  useEffect(() => {
    if (pickup && route) {
      fetchNearby(pickup, route.distanceKm, filterType)
    }
  }, [filterType])

  useEffect(() => {
    if (!pickup) return
    const interval = setInterval(() => {
      fetchNearby(pickup, route?.distanceKm)
    }, 20000)
    return () => clearInterval(interval)
  }, [pickup, route?.distanceKm, fetchNearby])

  const handlePartnerSelect = useCallback(
    (partner: NearbyPartner) => {
      if (!pickup || !dropoff) return
      const params = new URLSearchParams({
        pickup: pickup.label,
        pickupLat: String(pickup.lat),
        pickupLng: String(pickup.lng),
        dropoff: dropoff.label,
        dropoffLat: String(dropoff.lat),
        dropoffLng: String(dropoff.lng),
        vehicle: partner.vehicle.type,
        phone: phone,
        partnerId: partner.partnerId,
        partnerName: partner.partnerName,
        vehicleModel: partner.vehicle.vehicleModel,
        vehicleNumber: partner.vehicle.number,
        estimatedFare: String(partner.estimatedFare),
        distanceKm: String(route?.distanceKm || partner.distanceKm || 0),
        durationMin: String(route?.durationMin || partner.etaMin || 0),
      })
      router.push(`/user/checkout?${params.toString()}`)
    },
    [pickup, dropoff, phone, route, router]
  )

  const VehicleIcon = VEHICLE_META[vehicle]?.icon ?? Car
  const vehicleLabel = VEHICLE_META[vehicle]?.label ?? vehicle

  if (initializing) {
    return (
      <PageShell>
        <div className='flex flex-1 flex-col items-center justify-center gap-3 py-20'>
          <span className='h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white' />
          <p className='text-sm text-zinc-400'>Preparing your route…</p>
        </div>
      </PageShell>
    )
  }

  if (initError || !pickup || !dropoff) {
    return (
      <PageShell>
        <div className='flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center'>
          <p className='text-sm text-red-400'>
            {initError || 'Invalid ride parameters'}
          </p>
          <button
            type='button'
            onClick={() => router.push('/user/book')}
            className='rounded-xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/15'
          >
            Back to booking
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <header className='flex shrink-0 flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => router.push('/user/book')}
            className='flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white'
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className='flex items-center gap-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black'>
                <Navigation size={15} strokeWidth={2.5} />
              </div>
              <h1 className='text-base font-black tracking-tight sm:text-lg'>
                Route preview
              </h1>
            </div>
            <p className='mt-0.5 text-[11px] text-zinc-500'>
              Confirm pickup, dropoff, and estimated trip
            </p>
          </div>
        </div>
      </header>

      {/* Vehicle type filter bar */}
      <div className='shrink-0 border-b border-white/[0.06] px-5 py-2.5 sm:px-7'>
        <div className='no-scrollbar flex gap-2 overflow-x-auto'>
          {VEHICLE_FILTERS.map((type) => {
            const meta = VEHICLE_META[type]
            const Icon = meta?.icon ?? Car
            const isActive = filterType === type
            return (
              <button
                key={type}
                type='button'
                onClick={() => setFilterType(type)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'border-white/25 bg-white/12 text-white shadow-[0_0_16px_-2px_rgba(255,255,255,0.12)]'
                    : 'border-white/[0.08] bg-white/[0.03] text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-emerald-400' : ''} />
                {meta?.label ?? type}
              </button>
            )
          })}
        </div>
      </div>

      <div className='flex flex-col-reverse lg:flex-row flex-1 min-h-0 overflow-hidden relative'>
        {/* Left/Bottom Details Sidebar */}
        <div className='w-full lg:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-r border-white/[0.06] flex flex-col h-[55dvh] lg:h-full overflow-hidden bg-black/40 backdrop-blur-md'>
          <div className='no-scrollbar flex-1 overflow-y-auto p-5 sm:p-6 space-y-6'>
            <section className='space-y-3.5'>
              <div className='flex items-center justify-between gap-3'>
                <div>
                  <h2 className='flex items-center gap-2 text-sm font-black text-white'>
                    <Users size={16} className='text-emerald-400' />
                    Available nearby
                  </h2>
                  <p className='mt-0.5 text-[11px] text-zinc-500'>
                    Verified partners with GPS within 5 km of pickup
                  </p>
                </div>
                <button
                  type='button'
                  disabled={nearbyLoading}
                  onClick={() => fetchNearby(pickup, route?.distanceKm)}
                  className='flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/10 disabled:opacity-50'
                >
                  <RefreshCw
                    size={12}
                    className={nearbyLoading ? 'animate-spin' : ''}
                  />
                  Refresh
                </button>
              </div>

              {nearbyLoading && nearbyPartners.length === 0 ? (
                <div className='flex items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] py-10'>
                  <span className='h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white' />
                  <span className='text-sm text-zinc-400'>
                    Scanning for nearby rides…
                  </span>
                </div>
              ) : nearbyPartners.length === 0 ? (
                <div className='rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center'>
                  <p className='text-sm font-semibold text-zinc-300'>
                    No partners online nearby
                  </p>
                  <p className='mt-1 text-[11.5px] leading-relaxed text-zinc-500'>
                    Partner must be verified, have an approved vehicle matching your
                    ride type, real GPS (not 0,0), and be within 5 km. Open the
                    partner account in the browser with location allowed so the app
                    can send live coordinates.
                  </p>
                </div>
              ) : (
                <div className='flex flex-col gap-3.5 pr-1'>
                  {nearbyPartners.map((partner) => (
                    <NearbyPartnerCard
                      key={partner.partnerId}
                      partner={partner}
                      selected={selectedPartnerId === partner.partnerId}
                      onSelect={() => handlePartnerSelect(partner)}
                    />
                  ))}
                </div>
              )}
            </section>

            <motion.section
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className='space-y-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4'
            >
              <h2 className='text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500'>
                Ride summary
              </h2>

              <div className='grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1'>
                <SummaryRow
                  icon={<VehicleIcon size={16} className='text-white' />}
                  label='Service'
                  value={vehicleLabel}
                />
                <SummaryRow
                  icon={<Phone size={16} className='text-emerald-400' />}
                  label='Contact'
                  value={phone || '—'}
                />
                <SummaryRow
                  icon={<Route size={16} className='text-emerald-400' />}
                  label='Distance'
                  value={
                    routeLoading
                      ? 'Updating…'
                      : route
                        ? `${route.distanceKm} km`
                        : '—'
                  }
                />
                <SummaryRow
                  icon={<Clock size={16} className='text-sky-400' />}
                  label='Est. ride time'
                  value={
                    routeLoading
                      ? 'Updating…'
                      : route
                        ? `${route.durationMin} min`
                        : '—'
                  }
                />
              </div>

              <div className='space-y-2.5 border-t border-white/[0.06] pt-3.5'>
                <LocationRow
                  color='bg-amber-500'
                  title='Pickup'
                  address={pickup.label}
                />
                <LocationRow
                  color='bg-sky-500'
                  title='Dropoff'
                  address={dropoff.label}
                />
              </div>

              <button
                type='button'
                onClick={() => router.push('/user/book')}
                className='mt-2.5 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white transition hover:bg-white/10'
              >
                Edit booking details
              </button>
            </motion.section>
          </div>
        </div>

        {/* Right/Top Map Section */}
        <div className='flex-1 h-[45dvh] lg:h-full relative p-3 lg:p-4 bg-zinc-950/20'>
          <SearchMap
            pickup={pickup}
            dropoff={dropoff}
            route={route}
            routeLoading={routeLoading}
            nearbyPartners={nearbyPartners}
            selectedPartnerId={selectedPartnerId}
            onPartnerSelect={handlePartnerSelect}
            onPickupMoved={handlePickupMoved}
            onDropoffMoved={handleDropoffMoved}
          />
        </div>
      </div>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black font-sans text-white'>
      <div
        className='absolute inset-0 scale-105 bg-cover bg-center blur-[6px]'
        style={{ backgroundImage: "url('/heroImage.jpg')" }}
      />
      <div className='absolute inset-0 bg-gradient-to-b from-black/80 via-black/85 to-black/95' />
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.08),transparent)]' />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className='relative z-10 mx-3 flex h-[calc(100dvh-2rem)] max-h-[920px] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/50 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:mx-5'
      >
        {children}
      </motion.div>
    </div>
  )
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className='flex items-center gap-3 rounded-xl border border-white/[0.06] bg-black/30 px-3 py-2.5'>
      <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10'>
        {icon}
      </div>
      <div className='min-w-0'>
        <p className='text-[9px] font-bold uppercase tracking-wider text-zinc-500'>
          {label}
        </p>
        <p className='truncate text-sm font-semibold text-white'>{value}</p>
      </div>
    </div>
  )
}

function LocationRow({
  color,
  title,
  address,
}: {
  color: string
  title: string
  address: string
}) {
  return (
    <div className='flex gap-3 rounded-xl border border-white/[0.06] bg-black/25 p-3'>
      <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
      <div className='min-w-0 flex-1'>
        <p className='flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-zinc-500'>
          <MapPin size={10} />
          {title}
        </p>
        <p className='mt-0.5 text-sm leading-snug text-white'>{address}</p>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className='fixed inset-0 flex items-center justify-center bg-black text-sm text-zinc-400'>
          Loading…
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}
