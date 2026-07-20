'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import {
    ArrowLeft,
    Clock,
    Compass,
    Check,
    X,
    RefreshCw,
    AlertCircle,
    Phone,
    Car,
    Scooter,
    Bike,
    Package,
    Truck,
    User,
    Hash,
} from 'lucide-react'

const PartnerRouteMap = dynamic(
    () => import('@/components/PartnerRouteMap'),
    { ssr: false, loading: () => <MapSkeleton /> }
)

function MapSkeleton() {
    return (
        <div className='flex h-full w-full items-center justify-center rounded-2xl bg-zinc-950/80 border border-white/5 text-zinc-500 text-xs font-semibold gap-2'>
            <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white' />
            Loading route map…
        </div>
    )
}

const VEHICLE_LABELS: Record<string, React.ElementType> = {
    bike: Bike, car: Car, auto: Scooter, loading: Package, truck: Truck,
}

interface BookingRequest {
    _id: string
    user?: { name?: string; email?: string; phone?: string }
    pickup: { label: string; coordinates: [number, number] }
    dropoff: { label: string; coordinates: [number, number] }
    vehicleType: string
    estimatedFare: number
    platformFee: number
    partnerEarning: number
    totalFare: number
    distanceKm: number
    durationMin: number
    status: string
    passengerPhone: string
    passengerName: string
    vehicleModel: string
    vehicleNumber: string
    createdAt: string
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode
    label: string
    value?: string | null
}) {
    return (
        <div className='flex items-center justify-between gap-3 text-xs py-1.5 border-b border-white/[0.04] last:border-0'>
            <span className='flex items-center gap-2 text-zinc-500'>
                {icon}
                {label}
            </span>
            <span className='font-semibold text-white text-right max-w-[55%] truncate'>
                {value || <span className='text-zinc-600 italic'>—</span>}
            </span>
        </div>
    )
}

export default function PendingRequestsPage() {
    const router = useRouter()
    const { status: sessionStatus } = useSession()
    const [requests, setRequests] = useState<BookingRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [errorMsg, setErrorMsg] = useState('')

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const res = await fetch('/api/bookings?status=requested')
            if (!res.ok) throw new Error('Failed to fetch pending requests')
            const data = await res.json()
            const list: BookingRequest[] = data.bookings || []
            setRequests(list)
            setSelectedId((prev) =>
                list.some((r) => r._id === prev) ? prev : list[0]?._id ?? null
            )
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Failed to fetch pending requests')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            void Promise.resolve().then(fetchRequests)
            const iv = setInterval(fetchRequests, 15000)
            return () => clearInterval(iv)
        } else if (sessionStatus === 'unauthenticated') router.push('/signin')
    }, [fetchRequests, router, sessionStatus])

    const handleAction = async (id: string, action: 'confirmed' | 'rejected') => {
        setActionLoading(id)
        try {
            const res = await fetch(`/api/bookings/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: action }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.error || 'Failed to update booking')
            if (action === 'confirmed') router.push('/partner/active-ride')
            else fetchRequests()
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Failed to update booking')
        } finally {
            setActionLoading(null)
        }
    }

    const selected = requests.find((r) => r._id === selectedId)
    const getPassengerName = (request: BookingRequest) =>
        request.passengerName || request.user?.name || request.user?.email?.split('@')[0] || 'Passenger'
    const getPassengerPhone = (request: BookingRequest) =>
        request.passengerPhone || request.user?.phone || ''

    return (
        <PageShell>
            <header className='flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-7 sm:py-4'>
                <div className='flex items-center gap-3 min-w-0'>
                    <button
                        type='button'
                        onClick={() => router.push('/')}
                        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 active:scale-95'
                        aria-label='Back to home'
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div className='min-w-0'>
                        <h1 className='text-sm font-black tracking-tight sm:text-base truncate'>Pending Ride Requests</h1>
                        <p className='mt-0.5 text-[10px] sm:text-[11px] text-zinc-500 hidden sm:block'>Incoming passenger requests · auto-refreshes every 15 s</p>
                    </div>
                </div>
                <button type='button' onClick={fetchRequests} disabled={loading}
                    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 disabled:opacity-50'>
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            <div className='flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden'>
                {/* ── Left: Request cards ── */}
                <div className='w-full lg:w-[380px] xl:w-[420px] shrink-0 border-t lg:border-t-0 lg:border-r border-white/[0.06] flex flex-col h-[45dvh] lg:h-full overflow-hidden bg-black/40 backdrop-blur-md'>
                    <div className='flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 space-y-2.5 sm:space-y-3.5'>
                        {errorMsg && (
                            <div className='rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-400 flex items-center justify-center gap-2'>
                                <AlertCircle size={13} /> {errorMsg}
                            </div>
                        )}

                        {loading && requests.length === 0 ? (
                            <div className='flex flex-col items-center justify-center py-20 gap-3'>
                                <span className='h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white' />
                                <p className='text-xs text-zinc-500'>Scanning for passengers…</p>
                            </div>
                        ) : requests.length === 0 ? (
                            <div className='flex flex-col items-center justify-center py-12 sm:py-20 text-center border border-dashed border-white/10 rounded-xl sm:rounded-2xl px-4 sm:px-5 bg-white/[0.01]'>
                                <RefreshCw size={20} className='sm:w-[22px] sm:h-[22px] text-zinc-600 animate-pulse mb-3' />
                                <p className='text-xs sm:text-sm font-bold text-zinc-300'>No requests yet</p>
                                <p className='text-[9px] sm:text-[10px] text-zinc-500 mt-1'>Auto-refreshing every 15 s</p>
                            </div>
                        ) : (
                            requests.map((req) => {
                                const isSelected = req._id === selectedId
                                const Icon = VEHICLE_LABELS[req.vehicleType] || Car
                                return (
                                    <motion.div
                                        key={req._id}
                                        onClick={() => setSelectedId(req._id)}
                                        className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 transition-all duration-200 cursor-pointer space-y-2.5 sm:space-y-3 ${isSelected
                                                ? 'border-emerald-500/40 bg-zinc-900/60 shadow-lg'
                                                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'
                                            }`}
                                    >
                                        {/* Passenger name + fare */}
                                        <div className='flex items-center justify-between gap-2'>
                                            <div className='flex items-center gap-2.5 min-w-0'>
                                                <div className='h-8 w-8 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase'>
                                                    {getPassengerName(req).charAt(0)}
                                                </div>
                                                <div className='min-w-0'>
                                                    <p className='text-xs font-bold text-white truncate'>{getPassengerName(req)}</p>
                                                    <p className='text-[10px] text-zinc-500 truncate flex items-center gap-1 mt-0.5'>
                                                        <Phone size={9} className='shrink-0' />
                                                        {getPassengerPhone(req) || 'No phone'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className='flex flex-col items-end gap-0.5 shrink-0'>
                                                <div className='flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 text-[10px] font-black text-emerald-400'>
                                                    <Icon size={10} />
                                                    Rs {req.totalFare || req.estimatedFare}
                                                </div>
                                                <p className='text-[9px] text-zinc-600'>You earn: Rs {req.partnerEarning || req.estimatedFare}</p>
                                            </div>
                                        </div>

                                        {/* Vehicle info */}
                                        {(req.vehicleModel || req.vehicleNumber) && (
                                            <div className='rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2 flex items-center gap-3 text-[10px] text-zinc-400'>
                                                <Car size={12} className='text-zinc-500 shrink-0' />
                                                <span className='truncate'>{req.vehicleModel || 'Vehicle'}</span>
                                                {req.vehicleNumber && (
                                                    <span className='ml-auto font-bold text-white shrink-0'>{req.vehicleNumber}</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Stats */}
                                        <div className='flex items-center gap-4 text-[10px] text-zinc-400 border-t border-white/[0.04] pt-2.5'>
                                            <span className='flex items-center gap-1'><Compass size={11} className='text-zinc-500' />{req.distanceKm.toFixed(1)} km</span>
                                            <span className='flex items-center gap-1'><Clock size={11} className='text-zinc-500' />{req.durationMin.toFixed(0)} min</span>
                                        </div>

                                        {/* Actions */}
                                        <div className='flex gap-2 pt-1'>
                                            <button type='button' disabled={actionLoading !== null}
                                                onClick={(e) => { e.stopPropagation(); handleAction(req._id, 'confirmed') }}
                                                className='flex-1 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-black uppercase tracking-wide text-white transition disabled:opacity-50 flex items-center justify-center gap-1.5'>
                                                {actionLoading === req._id
                                                    ? <span className='h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white' />
                                                    : <><Check size={10} className='sm:w-[11px] sm:h-[11px]' /> <span className='hidden sm:inline'>Accept</span><span className='sm:hidden'>OK</span></>}
                                            </button>
                                            <button type='button' disabled={actionLoading !== null}
                                                onClick={(e) => { e.stopPropagation(); handleAction(req._id, 'rejected') }}
                                                className='rounded-lg sm:rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2 sm:py-2.5 px-3 sm:px-3.5 text-zinc-300 transition disabled:opacity-50 flex items-center justify-center'>
                                                <X size={12} className='sm:w-[13px] sm:h-[13px]' />
                                            </button>
                                        </div>
                                    </motion.div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* ── Right: Full Map + Route Details ── */}
                <div className='flex-1 h-[55dvh] lg:h-full flex flex-col overflow-hidden bg-zinc-950/20'>
                    {selected ? (
                        <>
                            {/* Map fills upper portion */}
                            <div className='flex-1 relative min-h-0'>
                                <PartnerRouteMap
                                    pickupLat={selected.pickup.coordinates[1]}
                                    pickupLng={selected.pickup.coordinates[0]}
                                    dropoffLat={selected.dropoff.coordinates[1]}
                                    dropoffLng={selected.dropoff.coordinates[0]}
                                />
                            </div>

                            {/* Info strip below map */}
                            <div className='shrink-0 bg-[#0B0B0B]/90 border-t border-white/[0.06] backdrop-blur-md p-3 sm:p-4 lg:p-5 space-y-2.5 sm:space-y-3'>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5'>
                                    {/* Route */}
                                    <div className='space-y-2'>
                                        <p className='text-[9px] font-black text-zinc-500 uppercase tracking-wider'>Route</p>
                                        <div className='space-y-1.5 pl-3 relative text-xs'>
                                            <div className='absolute left-0 top-1.5 h-full w-0.5 bg-zinc-800' />
                                            <div>
                                                <p className='text-[9px] font-black text-amber-500 uppercase'>Pickup</p>
                                                <p className='text-zinc-300 leading-snug'>{selected.pickup.label}</p>
                                            </div>
                                            <div>
                                                <p className='text-[9px] font-black text-sky-500 uppercase'>Dropoff</p>
                                                <p className='text-zinc-300 leading-snug'>{selected.dropoff.label}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Passenger & vehicle */}
                                    <div className='space-y-1.5 sm:border-l border-white/[0.05] sm:pl-5 border-t sm:border-t-0 pt-3 sm:pt-0'>
                                        <p className='text-[9px] font-black text-zinc-500 uppercase tracking-wider'>Details</p>
                                        <InfoRow icon={<User size={11} />} label='Passenger' value={getPassengerName(selected)} />
                                        <InfoRow icon={<Phone size={11} />} label='Phone' value={getPassengerPhone(selected)} />
                                        <InfoRow icon={<Car size={11} />} label='Vehicle' value={selected.vehicleModel} />
                                        <InfoRow icon={<Hash size={11} />} label='Plate' value={selected.vehicleNumber} />
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className='flex flex-1 flex-col items-center justify-center text-center p-6 gap-3'>
                            <Compass size={22} className='text-zinc-600' />
                            <p className='text-xs text-zinc-500 font-semibold'>Select a request to preview its route</p>
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    )
}

function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black font-sans text-white'>
            <div className='absolute inset-0 scale-105 bg-cover bg-center blur-[6px]' style={{ backgroundImage: "url('/heroImage.jpg')" }} />
            <div className='absolute inset-0 bg-gradient-to-b from-black/80 via-black/85 to-black/95' />
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.08),transparent)]' />
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className='relative z-10 mx-2 sm:mx-3 lg:mx-5 flex h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-2rem)] max-h-[920px] w-full max-w-5xl flex-col overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/[0.08] bg-black/50 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl'
            >
                {children}
            </motion.div>
        </div>
    )
}
