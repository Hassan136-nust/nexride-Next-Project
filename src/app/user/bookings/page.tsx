'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
    AlertCircle,
    ArrowLeft,
    Bike,
    Calendar,
    Car,
    CheckCircle,
    Clock,
    Compass,
    CreditCard,
    HelpCircle,
    MessageCircle,
    Package,
    Radio,
    RefreshCw,
    Scooter,
    Truck,
    XCircle,
    Loader2,
} from 'lucide-react'
import ChatSidebar from '@/components/chat/ChatSidebar'

const PartnerRouteMap = dynamic(
    () => import('@/components/PartnerRouteMap'),
    { ssr: false, loading: () => <MapSkeleton /> }
)

function MapSkeleton() {
    return (
        <div className='flex h-full min-h-[190px] w-full items-center justify-center bg-zinc-950 text-xs font-semibold text-zinc-500'>
            <span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white' />
            Loading map...
        </div>
    )
}

const VEHICLE_ICONS: Record<string, React.ElementType> = {
    bike: Bike,
    car: Car,
    auto: Scooter,
    loading: Package,
    truck: Truck,
}

const STATUS_BADGES: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    requested: {
        label: 'Pending',
        className: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
        icon: HelpCircle,
    },
    awaiting_payment: {
        label: 'Awaiting Payment',
        className: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
        icon: CreditCard,
    },
    confirmed: {
        label: 'Driver Accepted',
        className: 'border-sky-500/20 bg-sky-500/10 text-sky-400',
        icon: Car,
    },
    started: {
        label: 'In Progress',
        className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        icon: Compass,
    },
    completed: {
        label: 'Completed',
        className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
        icon: CheckCircle,
    },
    cancelled: {
        label: 'Cancelled',
        className: 'border-red-500/20 bg-red-500/10 text-red-400',
        icon: XCircle,
    },
    rejected: {
        label: 'Rejected',
        className: 'border-zinc-700 bg-zinc-800 text-zinc-400',
        icon: XCircle,
    },
}

type BookingStatus =
    | 'requested'
    | 'awaiting_payment'
    | 'confirmed'
    | 'started'
    | 'completed'
    | 'cancelled'
    | 'rejected'
    | 'expired'

interface BookingLog {
    _id: string
    partner?: { _id?: string; name?: string; email?: string; phone?: string } | null
    pickup: { label: string; coordinates: [number, number] }
    dropoff: { label: string; coordinates: [number, number] }
    vehicleType: string
    estimatedFare: number
    platformFee: number
    partnerEarning: number
    totalFare: number
    distanceKm: number
    durationMin: number
    status: BookingStatus
    paymentStatus: string
    paymentMethod: string
    vehicleModel?: string
    vehicleNumber?: string
    stripeSessionId?: string
    createdAt: string
    updatedAt: string
}

const GROUPS = [
    { id: 'pending', label: 'Pending', statuses: ['requested', 'awaiting_payment'] },
    { id: 'active', label: 'Active', statuses: ['confirmed', 'started'] },
    { id: 'completed', label: 'Completed', statuses: ['completed', 'cancelled', 'rejected', 'expired'] },
] as const

function groupFor(status: BookingStatus): string {
    const found = GROUPS.find((group) => {
        return (group.statuses as unknown as string[]).includes(status)
    })
    return found?.id ?? 'completed'
}

export default function UserBookingsPage() {
    const router = useRouter()
    const { status: sessionStatus } = useSession()
    const [bookings, setBookings] = useState<BookingLog[]>([])
    const [activeGroup, setActiveGroup] = useState<(typeof GROUPS)[number]['id']>('pending')
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')

    const fetchBookings = useCallback(async (showSpinner = false) => {
        if (showSpinner) setLoading(true)
        setErrorMsg('')
        try {
            const res = await fetch('/api/bookings', { cache: 'no-store' })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.error || 'Failed to load bookings')
            setBookings(data.bookings || [])
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Failed to load bookings')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            void Promise.resolve().then(() => fetchBookings(true))
            const iv = setInterval(() => fetchBookings(false), 10000)
            return () => clearInterval(iv)
        }
        if (sessionStatus === 'unauthenticated') router.push('/signin')
    }, [fetchBookings, router, sessionStatus])

    const counts = useMemo(() => {
        return GROUPS.reduce<Record<string, number>>((acc, group) => {
            acc[group.id] = bookings.filter((booking) => groupFor(booking.status) === group.id).length
            return acc
        }, {})
    }, [bookings])

    const visibleBookings = bookings.filter((booking) => groupFor(booking.status) === activeGroup)

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
                        <h1 className='text-sm font-black tracking-tight sm:text-base lg:text-lg truncate'>My Bookings</h1>
                        <p className='mt-0.5 text-[10px] sm:text-[11px] text-zinc-500 hidden sm:block'>Live ride requests, active trips, and completed history</p>
                    </div>
                </div>
                <button
                    type='button'
                    onClick={() => fetchBookings(true)}
                    disabled={loading}
                    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 disabled:opacity-50'
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            <div className='shrink-0 border-b border-white/[0.06] px-4 py-3 sm:px-7'>
                <div className='grid grid-cols-3 gap-1.5 sm:gap-2 rounded-xl border border-white/[0.06] bg-black/40 p-1'>
                    {GROUPS.map((group) => (
                        <button
                            key={group.id}
                            type='button'
                            onClick={() => setActiveGroup(group.id)}
                            className={`rounded-lg px-1.5 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition ${activeGroup === group.id
                                ? 'bg-white text-black'
                                : 'text-zinc-500 hover:bg-white/[0.06] hover:text-white'
                                }`}
                        >
                            <span className='hidden sm:inline'>{group.label}</span>
                            <span className='sm:hidden'>{group.label.substring(0, 4)}</span>
                            {' '}
                            <span className='opacity-60'>({counts[group.id] || 0})</span>
                        </button>
                    ))}
                </div>
            </div>

            <main className='no-scrollbar flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6'>
                {errorMsg && (
                    <div className='mb-4 flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 sm:p-3 text-[11px] sm:text-xs font-semibold text-red-400'>
                        <AlertCircle size={14} />
                        <span className='truncate'>{errorMsg}</span>
                    </div>
                )}

                {loading && bookings.length === 0 ? (
                    <div className='flex flex-col items-center justify-center gap-3 py-12 sm:py-20'>
                        <span className='h-6 w-6 sm:h-7 sm:w-7 animate-spin rounded-full border-2 border-white/20 border-t-white' />
                        <p className='text-[11px] sm:text-xs font-medium text-zinc-500'>Loading bookings...</p>
                    </div>
                ) : visibleBookings.length === 0 ? (
                    <div className='mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.01] px-4 py-12 sm:px-5 sm:py-20 text-center'>
                        <div className='mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-400'>
                            <Calendar size={18} className='sm:w-5 sm:h-5' />
                        </div>
                        <p className='text-xs sm:text-sm font-bold text-zinc-200'>No {GROUPS.find((group) => group.id === activeGroup)?.label.toLowerCase()} bookings</p>
                        <p className='mt-1 text-[10px] leading-relaxed text-zinc-500'>This section updates automatically when your ride status changes.</p>
                    </div>
                ) : (
                    <div className='grid gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-2'>
                        {visibleBookings.map((booking) => (
                            <BookingCard
                                key={`${booking._id}-${booking.status}-${booking.updatedAt}`}
                                booking={booking}
                                onPaymentStarted={() => fetchBookings(false)}
                                onBookingUpdated={() => fetchBookings(true)}
                            />
                        ))}
                    </div>
                )}
            </main>
        </PageShell>
    )
}

function SearchingAnimation({ vehicleType, createdAt }: { vehicleType: string; createdAt: string }) {
    const VehicleIcon = VEHICLE_ICONS[vehicleType] || Car
    const [elapsed, setElapsed] = React.useState(0)

    React.useEffect(() => {
        const start = new Date(createdAt).getTime()
        const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)))
        tick()
        const iv = setInterval(tick, 1000)
        return () => clearInterval(iv)
    }, [createdAt])

    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60

    return (
        <div className='relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/80 to-black'>
            {/* Subtle road grid */}
            <div className='absolute inset-0 opacity-[0.04]'
                style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />

            {/* Radar pulse rings */}
            <div className='absolute inset-0 flex items-center justify-center'>
                {[0, 0.8, 1.6].map((delay, i) => (
                    <div
                        key={i}
                        className='absolute rounded-full border border-amber-500/30'
                        style={{
                            width: '220px',
                            height: '220px',
                            animation: `radar-pulse 2.4s ease-out ${delay}s infinite`,
                        }}
                    />
                ))}
            </div>

            {/* Inner glow circle */}
            <div
                className='absolute h-28 w-28 rounded-full bg-amber-500/5 border border-amber-500/10'
                style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
            />

            {/* Orbiting driver dots */}
            <div className='absolute flex items-center justify-center'>
                <div
                    className='absolute h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                    style={{ animation: 'orbit 6s linear infinite' }}
                />
                <div
                    className='absolute h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                    style={{ animation: 'orbit-reverse 8s linear infinite' }}
                />
                <div
                    className='absolute h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]'
                    style={{ animation: 'orbit 10s linear infinite', animationDelay: '-3s' }}
                />
            </div>

            {/* Floating nearby dots */}
            {[{ x: -70, y: -40, s: 6, d: 2 }, { x: 80, y: -25, s: 5, d: 3 }, { x: -55, y: 50, s: 4, d: 1.5 }, { x: 65, y: 45, s: 5, d: 2.5 }].map((dot, i) => (
                <div
                    key={i}
                    className='absolute rounded-full bg-white/20'
                    style={{
                        width: dot.s,
                        height: dot.s,
                        left: `calc(50% + ${dot.x}px)`,
                        top: `calc(50% + ${dot.y}px)`,
                        animation: `float-dot ${dot.d}s ease-in-out infinite`,
                    }}
                />
            ))}

            {/* Center vehicle icon */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className='relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                style={{ animation: 'car-bounce 2s ease-in-out infinite' }}
            >
                <VehicleIcon size={26} />
            </motion.div>

            {/* Status text */}
            <div className='relative z-10 mt-4 flex flex-col items-center gap-1.5'>
                <div className='flex items-center gap-1.5 text-xs font-black text-white'>
                    <Radio size={12} className='text-amber-400 animate-pulse' />
                    Searching for Driver
                    <span className='flex gap-0.5'>
                        {[0, 1, 2].map(i => (
                            <span
                                key={i}
                                className='inline-block h-1 w-1 rounded-full bg-amber-400'
                                style={{ animation: `dot-blink 1.4s ease-in-out ${i * 0.2}s infinite` }}
                            />
                        ))}
                    </span>
                </div>
                <p className='text-[10px] font-semibold text-zinc-500'>
                    Looking for nearby {vehicleType} partners...
                </p>
                <div className='mt-1 flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1'>
                    <Clock size={10} className='text-zinc-500' />
                    <span className='text-[10px] font-mono font-bold text-zinc-400 tabular-nums'>
                        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                    </span>
                    <span className='text-[9px] text-zinc-600'>waiting</span>
                </div>
            </div>
        </div>
    )
}

function BookingCard({ booking, onPaymentStarted, onBookingUpdated }: { booking: BookingLog; onPaymentStarted?: () => void; onBookingUpdated?: () => void }) {
    const VehicleIcon = VEHICLE_ICONS[booking.vehicleType] || Car
    const Badge = STATUS_BADGES[booking.status] || STATUS_BADGES.requested
    const BadgeIcon = Badge.icon
    const date = new Date(booking.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
    const driverName = booking.partner?.name || (booking.status === 'requested' ? 'Waiting for driver' : 'Driver')

    const [paying, setPaying] = React.useState(false)
    const [payError, setPayError] = React.useState('')
    const [cancelling, setCancelling] = React.useState(false)
    const [cancelError, setCancelError] = React.useState('')
    const [chatOpen, setChatOpen] = React.useState(false)

    // Ride can be cancelled by customer only if it's in these statuses
    const canCancel =
        booking.status === 'requested' ||
        booking.status === 'confirmed' ||
        booking.status === 'awaiting_payment'

    // Chat is available for active rides (confirmed/started)
    const canChat =
        booking.status === 'confirmed' ||
        booking.status === 'started'

    // Only consider truly paid if paymentStatus is 'paid' AND there's a valid Stripe session
    const isPaid =
        booking.status === 'completed' &&
        booking.paymentMethod === 'card' &&
        booking.paymentStatus === 'paid' &&
        Boolean(booking.stripeSessionId)

    // Show Pay Now for all completed card bookings that aren't genuinely paid
    const showPayButton =
        booking.status === 'completed' &&
        booking.paymentMethod === 'card' &&
        !isPaid

    const handleCancel = async () => {
        if (!window.confirm('Are you sure you want to cancel this ride?')) return
        setCancelling(true)
        setCancelError('')
        try {
            const res = await fetch(`/api/bookings/${booking._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to cancel ride')
            onBookingUpdated?.()
        } catch (err: unknown) {
            setCancelError(err instanceof Error ? err.message : 'Failed to cancel')
        } finally {
            setCancelling(false)
        }
    }

    const handlePay = async () => {
        setPaying(true)
        setPayError('')
        try {
            const res = await fetch('/api/payments/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: booking._id }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to create checkout session')
            if (data.checkoutUrl) {
                onPaymentStarted?.()
                window.location.href = data.checkoutUrl
            }
        } catch (err: unknown) {
            setPayError(err instanceof Error ? err.message : 'Payment failed')
        } finally {
            setPaying(false)
        }
    }

    return (
        <article className='relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/[0.08] bg-white/[0.02] transition hover:border-white/15'>
            {/* Show searching animation for pending rides, map for everything else */}
            {booking.status === 'requested' ? (
                <div className='h-[180px] sm:h-[220px] lg:h-[240px] border-b border-white/[0.06] bg-zinc-950'>
                    <SearchingAnimation vehicleType={booking.vehicleType} createdAt={booking.createdAt} />
                </div>
            ) : (
                <div className='h-[180px] sm:h-[200px] lg:h-[210px] border-b border-white/[0.06] bg-zinc-950'>
                    <PartnerRouteMap
                        key={`${booking._id}-${booking.status}-${booking.updatedAt}`}
                        pickupLat={booking.pickup.coordinates[1]}
                        pickupLng={booking.pickup.coordinates[0]}
                        dropoffLat={booking.dropoff.coordinates[1]}
                        dropoffLng={booking.dropoff.coordinates[0]}
                        distanceKm={Number(booking.distanceKm.toFixed(1))}
                        durationMin={Number(booking.durationMin.toFixed(0))}
                    />
                </div>
            )}

            <div className='space-y-3 sm:space-y-4 p-3 sm:p-4'>
                <div className='flex items-start justify-between gap-2 sm:gap-3'>
                    <div className='flex min-w-0 items-center gap-2 sm:gap-3'>
                        <div className='flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900 text-zinc-300'>
                            <VehicleIcon size={17} className='sm:w-[19px] sm:h-[19px]' />
                        </div>
                        <div className='min-w-0'>
                            <p className='truncate text-xs sm:text-sm font-black text-white'>{driverName}</p>
                            <p className='mt-0.5 text-[9px] sm:text-[10px] text-zinc-500'>{date}</p>
                        </div>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1 sm:gap-1.5 rounded-lg border px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${Badge.className}`}>
                        <BadgeIcon size={10} className='sm:w-[11px] sm:h-[11px]' />
                        <span className='hidden sm:inline'>{Badge.label}</span>
                        <span className='sm:hidden'>{Badge.label.split(' ')[0]}</span>
                    </span>
                </div>

                <div className='grid gap-2 sm:gap-3 text-xs'>
                    <RouteRow label='Pickup' color='bg-amber-500' value={booking.pickup.label} />
                    <RouteRow label='Dropoff' color='bg-sky-500' value={booking.dropoff.label} />
                </div>

                <div className='grid grid-cols-3 gap-1.5 sm:gap-2 border-t border-white/[0.05] pt-2.5 sm:pt-3 text-center'>
                    <Metric label='Fare' value={`Rs ${booking.totalFare || booking.estimatedFare}`} />
                    <Metric label='Distance' value={`${booking.distanceKm.toFixed(1)} km`} icon={<Compass size={10} className='sm:w-[11px] sm:h-[11px]' />} />
                    <Metric label='Time' value={`${booking.durationMin.toFixed(0)} min`} icon={<Clock size={10} className='sm:w-[11px] sm:h-[11px]' />} />
                </div>

                {/* Cancel Ride button for cancellable bookings */}
                {canCancel && (
                    <div className='border-t border-white/[0.05] pt-3 space-y-2'>
                        {cancelError && (
                            <p className='text-center text-[10px] font-semibold text-red-400'>{cancelError}</p>
                        )}
                        <button
                            type='button'
                            onClick={handleCancel}
                            disabled={cancelling}
                            className='w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-xs font-black uppercase tracking-wider text-red-400 hover:bg-red-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2'
                        >
                            {cancelling ? (
                                <>
                                    <Loader2 size={13} className='animate-spin' />
                                    Cancelling...
                                </>
                            ) : (
                                <>
                                    <XCircle size={13} />
                                    Cancel Ride
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Payment status & Pay Now button for completed card bookings */}
                {booking.paymentMethod === 'card' && booking.status === 'completed' && (
                    <div className='border-t border-white/[0.05] pt-3 space-y-2.5'>
                        {isPaid ? (
                            <div className='flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-400'>
                                <CheckCircle size={13} />
                                Paid via Stripe
                            </div>
                        ) : showPayButton ? (
                            <>
                                {payError && (
                                    <p className='text-center text-[10px] font-semibold text-red-400'>{payError}</p>
                                )}
                                <button
                                    type='button'
                                    onClick={handlePay}
                                    disabled={paying}
                                    className='w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg hover:from-sky-400 hover:to-indigo-500 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2'
                                >
                                    {paying ? (
                                        <>
                                            <Loader2 size={13} className='animate-spin' />
                                            Opening Stripe...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={13} />
                                            Pay Now — Rs {(booking.totalFare || booking.estimatedFare).toLocaleString()}
                                        </>
                                    )}
                                </button>
                            </>
                        ) : null}
                    </div>
                )}

                {/* Chat with Driver button for active rides */}
                {canChat && (
                    <div className='border-t border-white/[0.05] pt-3'>
                        <button
                            type='button'
                            onClick={() => setChatOpen(true)}
                            className='w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2'
                        >
                            <MessageCircle size={13} />
                            Chat with Driver
                        </button>
                    </div>
                )}
            </div>

            {/* Chat Sidebar Overlay — portal to escape Leaflet z-index */}
            {chatOpen && canChat && typeof document !== 'undefined' && createPortal(
                <div className='fixed inset-0 z-[9999] bg-black'>
                    <button
                        type='button'
                        onClick={() => setChatOpen(false)}
                        className='absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition'
                    >
                        <XCircle size={18} />
                    </button>
                    <ChatSidebar
                        bookingId={booking._id}
                        partnerName={booking.partner?.name || 'Driver'}
                        partnerEmail={booking.partner?.email}
                        userRole='user'
                        alwaysOpen={true}
                    />
                </div>,
                document.body
            )}
        </article>
    )
}

function RouteRow({ label, color, value }: { label: string; color: string; value: string }) {
    return (
        <div className='flex items-start gap-2.5'>
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color}`} />
            <div className='min-w-0'>
                <p className='text-[9px] font-black uppercase tracking-wider text-zinc-500'>{label}</p>
                <p className='mt-0.5 line-clamp-2 text-zinc-300'>{value}</p>
            </div>
        </div>
    )
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div className='min-w-0 rounded-xl border border-white/[0.05] bg-black/25 px-2 py-2'>
            <p className='flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wider text-zinc-500'>
                {icon}
                {label}
            </p>
            <p className='mt-1 truncate text-[11px] font-extrabold text-white'>{value}</p>
        </div>
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
                className='relative z-10 mx-2 sm:mx-3 lg:mx-5 flex h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-2rem)] max-h-[920px] w-full max-w-6xl flex-col overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/[0.08] bg-black/50 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl'
            >
                {children}
            </motion.div>
        </div>
    )
}
