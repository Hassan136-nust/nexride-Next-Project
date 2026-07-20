'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import ChatSidebar from '@/components/chat/ChatSidebar'
import {
    ArrowLeft,
    Clock,
    Compass,
    Play,
    CheckCircle,
    RefreshCw,
    Phone,
    AlertCircle,
    AlertTriangle,
    Mail,
    Car,
    Scooter,
    Bike,
    Package,
    Truck,
    Hash,
    User,
    DollarSign,
    CreditCard,
    XCircle,
    Loader2,
    MessageCircle,
} from 'lucide-react'

const PartnerRouteMap = dynamic(
    () => import('@/components/PartnerRouteMap'),
    { ssr: false, loading: () => <MapSkeleton /> }
)

function MapSkeleton() {
    return (
        <div className='flex h-full w-full items-center justify-center bg-zinc-950/80 text-zinc-500 text-xs font-semibold gap-2'>
            <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white' />
            Loading map…
        </div>
    )
}

const VEHICLE_LABELS: Record<string, React.ElementType> = {
    bike: Bike, car: Car, auto: Scooter, loading: Package, truck: Truck,
}

interface ActiveBooking {
    _id: string
    user: { _id: string; name: string; email: string; phone?: string }
    pickup: { label: string; coordinates: [number, number] }
    dropoff: { label: string; coordinates: [number, number] }
    vehicleType: string
    estimatedFare: number
    platformFee: number
    partnerEarning: number
    totalFare: number
    distanceKm: number
    durationMin: number
    status: 'confirmed' | 'started'
    paymentStatus: string
    paymentMethod: string
    passengerPhone: string
    passengerName: string
    vehicleModel: string
    vehicleNumber: string
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
    return (
        <div className='flex items-center justify-between gap-3 text-xs py-1.5 border-b border-white/[0.04] last:border-0'>
            <span className='flex items-center gap-2 text-zinc-500'>{icon}{label}</span>
            <span className='font-semibold text-white text-right max-w-[55%] truncate'>
                {value || <span className='text-zinc-600 italic'>—</span>}
            </span>
        </div>
    )
}

export default function ActiveRidePage() {
    const router = useRouter()
    const { status: sessionStatus } = useSession()
    const [booking, setBooking] = useState<ActiveBooking | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [mobileChatOpen, setMobileChatOpen] = useState(false)

    const fetchActiveRide = async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            // Try confirmed first, then started
            for (const s of ['confirmed', 'started']) {
                const res = await fetch(`/api/bookings?status=${s}`)
                if (!res.ok) throw new Error()
                const data = await res.json()
                if (data.bookings?.length) {
                    setBooking(data.bookings[0])
                    setLoading(false)
                    return
                }
            }
            setBooking(null)
        } catch {
            setErrorMsg('Error loading active ride')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            fetchActiveRide()
        } else if (sessionStatus === 'unauthenticated') router.push('/signin')
    }, [sessionStatus])

    const handleStatus = async (next: 'started' | 'completed') => {
        if (!booking) return
        setActionLoading(true)
        try {
            const payload: any = { status: next }
            if (next === 'completed') {
                payload.paymentStatus = booking.paymentMethod === 'cash' ? 'cash' : 'pending'
            }
            const res = await fetch(`/api/bookings/${booking._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) throw new Error((await res.json()).error || 'Failed')
            if (next === 'completed') router.push('/partner/bookings')
            else fetchActiveRide()
        } catch (err: any) {
            setErrorMsg(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!booking) return
        if (!window.confirm('Are you sure you want to cancel this ride? The customer will be notified.')) return
        setActionLoading(true)
        setErrorMsg('')
        try {
            const res = await fetch(`/api/bookings/${booking._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to cancel ride')
            }
            router.push('/partner/bookings')
        } catch (err: any) {
            setErrorMsg(err.message)
        } finally {
            setActionLoading(false)
        }
    }

    const VIcon = booking ? VEHICLE_LABELS[booking.vehicleType] || Car : Car

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
                        <h1 className='text-sm font-black tracking-tight sm:text-base truncate'>Active Ride</h1>
                        <p className='mt-0.5 text-[10px] sm:text-[11px] text-zinc-500 hidden sm:block'>Manage your current trip in real-time</p>
                    </div>
                </div>
                <button type='button' onClick={fetchActiveRide} disabled={loading}
                    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 disabled:opacity-50'>
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            <div className='flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden'>
                {/* ── Left: Booking Details Panel ── */}
                <div className='w-full lg:w-[340px] xl:w-[360px] shrink-0 border-t lg:border-t-0 lg:border-r border-white/[0.06] flex flex-col h-[48dvh] lg:h-full overflow-hidden bg-black/40 backdrop-blur-md'>
                    <div className='flex-1 overflow-y-auto no-scrollbar p-3 sm:p-4 lg:p-5 space-y-3 sm:space-y-4 lg:space-y-5'>
                        {errorMsg && (
                            <div className='rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2'>
                                <AlertCircle size={13} /> {errorMsg}
                            </div>
                        )}

                        {loading ? (
                            <div className='flex flex-col items-center justify-center py-20 gap-3'>
                                <span className='h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white' />
                                <p className='text-xs text-zinc-500'>Loading active ride…</p>
                            </div>
                        ) : !booking ? (
                            <div className='flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/15 rounded-2xl bg-white/[0.01] px-5'>
                                <AlertTriangle size={22} className='text-amber-400 mb-3' />
                                <p className='text-sm font-bold text-zinc-300'>No active ride</p>
                                <p className='text-[10px] text-zinc-500 mt-1 max-w-[240px] leading-relaxed'>
                                    Accept a ride from Pending Requests to start tracking it here.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Status Badge */}
                                <div className={`w-fit rounded-xl border px-3 py-1 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${booking.status === 'started'
                                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                                        : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                                    }`}>
                                    <span className='h-1.5 w-1.5 rounded-full bg-current animate-pulse' />
                                    {booking.status === 'started' ? 'IN PROGRESS' : 'CONFIRMED'}
                                </div>

                                {/* Passenger section */}
                                <div className='rounded-xl sm:rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 sm:p-4 space-y-2.5 sm:space-y-3'>
                                    <p className='text-[9px] font-black text-zinc-500 uppercase tracking-wider'>Passenger</p>
                                    <div className='flex items-center gap-3'>
                                        <div className='h-10 w-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-sm font-bold uppercase'>
                                            {(booking.passengerName || booking.user?.name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <p className='text-sm font-extrabold text-white'>{booking.passengerName || booking.user?.name}</p>
                                            <p className='text-[10px] text-zinc-500 mt-0.5'>{booking.user?.email}</p>
                                        </div>
                                    </div>
                                    <InfoRow icon={<Phone size={11} />} label='Phone' value={booking.passengerPhone || booking.user?.phone} />
                                    <InfoRow icon={<Mail size={11} />} label='Email' value={booking.user?.email} />
                                </div>

                                {/* Vehicle + Fare section */}
                                <div className='rounded-xl sm:rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 sm:p-4 space-y-0.5'>
                                    <p className='text-[9px] font-black text-zinc-500 uppercase tracking-wider mb-2.5'>Ride Details</p>
                                    <InfoRow icon={<Car size={11} />} label='Vehicle model' value={booking.vehicleModel} />
                                    <InfoRow icon={<Hash size={11} />} label='Plate number' value={booking.vehicleNumber} />
                                    <InfoRow icon={<Compass size={11} />} label='Distance' value={`${booking.distanceKm.toFixed(1)} km`} />
                                    <InfoRow icon={<Clock size={11} />} label='Est. time' value={`${booking.durationMin.toFixed(0)} min`} />
                                    <InfoRow icon={<DollarSign size={11} />} label='Total fare' value={`Rs ${booking.totalFare || booking.estimatedFare}`} />
                                    <InfoRow icon={<DollarSign size={11} />} label='Your earning' value={`Rs ${booking.partnerEarning || booking.estimatedFare}`} />
                                    <InfoRow
                                        icon={<CreditCard size={11} />}
                                        label='Payment'
                                        value={`${booking.paymentMethod} · ${booking.paymentStatus}`}
                                    />
                                </div>

                                {/* CTA Buttons */}
                                {booking.status === 'confirmed' ? (
                                    <div className='space-y-2 sm:space-y-2.5'>
                                        <button type='button' disabled={actionLoading} onClick={() => handleStatus('started')}
                                            className='w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 sm:py-3.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white transition flex items-center justify-center gap-2 disabled:opacity-50'>
                                            {actionLoading ? <Loader2 size={13} className='sm:w-[14px] sm:h-[14px] animate-spin' /> : <><Play size={13} className='sm:w-[14px] sm:h-[14px]' /> Start Ride</>}
                                        </button>
                                        <button type='button' disabled={actionLoading} onClick={handleCancel}
                                            className='w-full rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 sm:py-3 text-[11px] sm:text-xs font-black uppercase tracking-wider text-red-400 hover:bg-red-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50'>
                                            <XCircle size={13} className='sm:w-[14px] sm:h-[14px]' /> Cancel Ride
                                        </button>
                                    </div>
                                ) : (
                                    <button type='button' disabled={actionLoading} onClick={() => handleStatus('completed')}
                                        className='w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 sm:py-3.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-white transition flex items-center justify-center gap-2 disabled:opacity-50'>
                                        {actionLoading ? <Loader2 size={13} className='sm:w-[14px] sm:h-[14px] animate-spin' /> : <><CheckCircle size={13} className='sm:w-[14px] sm:h-[14px]' /> Complete Ride</>}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ── Right: Full route map ── */}
                <div className='flex-1 h-[52dvh] lg:h-full overflow-hidden bg-zinc-950/20 relative'>
                    {booking ? (
                        <PartnerRouteMap
                            pickupLat={booking.pickup.coordinates[1]}
                            pickupLng={booking.pickup.coordinates[0]}
                            dropoffLat={booking.dropoff.coordinates[1]}
                            dropoffLng={booking.dropoff.coordinates[0]}
                        />
                    ) : (
                        <div className='flex flex-1 h-full flex-col items-center justify-center text-center p-6 gap-3'>
                            <CheckCircle size={22} className='text-zinc-600 animate-pulse' />
                            <p className='text-xs text-zinc-500 font-semibold'>Map will appear once a ride is active</p>
                        </div>
                    )}
                </div>

                {/* ── Chat Sidebar (always visible on desktop) ── */}
                {booking && (
                    <div className='hidden lg:flex lg:w-[300px] xl:w-[320px] h-full shrink-0 border-l border-white/[0.06]'>
                        <ChatSidebar
                            bookingId={booking._id}
                            partnerName={booking.user?.name || 'Passenger'}
                            partnerEmail={booking.user?.email}
                            userRole='partner'
                            alwaysOpen={true}
                        />
                    </div>
                )}
            </div>

            {/* Mobile Chat Floating Button */}
            {booking && !mobileChatOpen && (
                <button
                    type='button'
                    onClick={() => setMobileChatOpen(true)}
                    className='lg:hidden fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-xl shadow-sky-600/30 hover:bg-sky-500 transition-all active:scale-95'
                >
                    <MessageCircle size={20} className='sm:w-[22px] sm:h-[22px]' />
                </button>
            )}

            {/* Mobile Chat Overlay — portal to escape Leaflet z-index */}
            {booking && mobileChatOpen && typeof document !== 'undefined' && createPortal(
                <div className='fixed inset-0 z-[9999] bg-black'>
                    <button
                        type='button'
                        onClick={() => setMobileChatOpen(false)}
                        className='absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition'
                    >
                        <XCircle size={18} />
                    </button>
                    <ChatSidebar
                        bookingId={booking._id}
                        partnerName={booking.user?.name || 'Passenger'}
                        partnerEmail={booking.user?.email}
                        userRole='partner'
                        alwaysOpen={true}
                    />
                </div>,
                document.body
            )}
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
                className='relative z-10 mx-2 sm:mx-3 lg:mx-5 flex h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-2rem)] max-h-[920px] w-full max-w-7xl flex-col overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/[0.08] bg-black/50 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl'
            >
                {children}
            </motion.div>
        </div>
    )
}
