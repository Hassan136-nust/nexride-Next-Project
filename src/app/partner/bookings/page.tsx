'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import {
    ArrowLeft,
    Clock,
    Compass,
    RefreshCw,
    AlertCircle,
    Calendar,
    CheckCircle,
    XCircle,
    PlayCircle,
    HelpCircle,
    Car,
    Scooter,
    Bike,
    Package,
    Truck,
} from 'lucide-react'

const VEHICLE_ICONS: Record<string, React.ElementType> = {
    bike: Bike,
    car: Car,
    auto: Scooter,
    loading: Package,
    truck: Truck,
}

const STATUS_BADGES: Record<
    string,
    { label: string; bg: string; text: string; icon: React.ElementType }
> = {
    requested: {
        label: 'Requested',
        bg: 'bg-amber-500/10 border-amber-500/20',
        text: 'text-amber-400',
        icon: HelpCircle,
    },
    confirmed: {
        label: 'Confirmed',
        bg: 'bg-sky-500/10 border-sky-500/20',
        text: 'text-sky-400',
        icon: PlayCircle,
    },
    started: {
        label: 'Started (In Progress)',
        bg: 'bg-blue-500/10 border-blue-500/20',
        text: 'text-blue-400',
        icon: PlayCircle,
    },
    completed: {
        label: 'Completed',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        text: 'text-emerald-400',
        icon: CheckCircle,
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-red-500/10 border-red-500/20',
        text: 'text-red-400',
        icon: XCircle,
    },
    rejected: {
        label: 'Rejected',
        bg: 'bg-zinc-800 border-zinc-700',
        text: 'text-zinc-500',
        icon: XCircle,
    },
}

interface BookingLog {
    _id: string
    user: {
        name: string
        email: string
        phone?: string
    }
    pickup: {
        label: string
    }
    dropoff: {
        label: string
    }
    vehicleType: string
    estimatedFare: number
    platformFee: number
    partnerEarning: number
    totalFare: number
    distanceKm: number
    durationMin: number
    status: string
    paymentStatus: string
    paymentMethod: string
    createdAt: string
}

export default function PartnerBookingsPage() {
    const router = useRouter()
    const { data: session, status: sessionStatus } = useSession()
    const [bookings, setBookings] = useState<BookingLog[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')

    const fetchBookings = async () => {
        setLoading(true)
        setErrorMsg('')
        try {
            const res = await fetch('/api/bookings')
            if (!res.ok) throw new Error('Failed to load booking history')
            const data = await res.json()
            setBookings(data.bookings || [])
        } catch (err: any) {
            setErrorMsg(err.message || 'Error occurred querying bookings log')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (sessionStatus === 'authenticated') {
            fetchBookings()
        } else if (sessionStatus === 'unauthenticated') {
            router.push('/signin')
        }
    }, [sessionStatus])

    return (
        <PageShell>
            {/* Header */}
            <header className='flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3 sm:px-7 sm:py-4 lg:py-5'>
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
                        <h1 className='text-sm font-black tracking-tight sm:text-base lg:text-lg truncate'>
                            My Trips History
                        </h1>
                        <p className='mt-0.5 text-[10px] sm:text-[11px] text-zinc-500 hidden sm:block'>
                            Overview of all your rides, statuses, passenger listings, and fares earned
                        </p>
                    </div>
                </div>
                <button
                    type='button'
                    onClick={fetchBookings}
                    disabled={loading}
                    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50'
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            {/* Main Content Area */}
            <div className='flex-1 overflow-y-auto no-scrollbar p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4 max-w-4xl w-full mx-auto'>
                {errorMsg && (
                    <div className='rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-center text-xs font-semibold text-red-500 flex items-center justify-center gap-2'>
                        <AlertCircle size={14} />
                        {errorMsg}
                    </div>
                )}

                {loading ? (
                    <div className='flex flex-col items-center justify-center py-20 gap-3'>
                        <span className='h-7 w-7 animate-spin rounded-full border-2 border-white/20 border-t-white' />
                        <p className='text-xs text-zinc-500 font-medium'>Fetching trips log...</p>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className='flex flex-col items-center justify-center py-24 text-center space-y-4 border border-dashed border-white/15 rounded-2xl bg-white/[0.01] px-5'>
                        <div className='h-12 w-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400'>
                            <Calendar size={20} />
                        </div>
                        <div>
                            <p className='text-sm font-bold text-zinc-200'>No trips found</p>
                            <p className='text-[10px] text-zinc-500 mt-1 max-w-[260px] leading-relaxed mx-auto'>
                                You don't have any bookings logged yet. Once you accept and finish rides, they will appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className='grid gap-4.5'>
                        {bookings.map((log) => {
                            const VehicleIcon = VEHICLE_ICONS[log.vehicleType] || Car
                            const Badge = STATUS_BADGES[log.status] || {
                                label: log.status,
                                bg: 'bg-zinc-800',
                                text: 'text-zinc-400',
                                icon: HelpCircle,
                            }
                            const BadgeIcon = Badge.icon
                            const formattedDate = new Date(log.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })

                            return (
                                <div
                                    key={log._id}
                                    className='rounded-2xl border border-white/[0.08] bg-white/[0.02]/30 p-5 space-y-4.5 hover:border-white/15 transition duration-200'
                                >
                                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3.5'>
                                        <div className='flex items-center gap-3'>
                                            <div className='h-10 w-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-350'>
                                                <VehicleIcon size={20} />
                                            </div>
                                            <div>
                                                <p className='text-xs font-bold text-white'>Passenger: {log.user.name}</p>
                                                <p className='text-[10px] text-zinc-500 mt-0.5'>{formattedDate}</p>
                                            </div>
                                        </div>

                                        <div className='flex flex-wrap items-center gap-2'>
                                            <span
                                                className={`flex items-center gap-1.5 rounded-lg border text-[10px] font-black uppercase tracking-wider px-2.5 py-1 ${Badge.bg} ${Badge.text}`}
                                            >
                                                <BadgeIcon size={11} />
                                                {Badge.label}
                                            </span>
                                            <span className='rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-black text-emerald-400'>
                                                Rs {log.partnerEarning || log.estimatedFare}
                                            </span>
                                            {log.totalFare && log.totalFare !== log.estimatedFare && (
                                                <span className='text-[9px] text-zinc-600'>Total: Rs {log.totalFare}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className='grid gap-3.5 sm:grid-cols-2 text-xs'>
                                        {/* Routing */}
                                        <div className='space-y-2 border-r sm:border-white/[0.05] pr-3'>
                                            <div className='flex items-start gap-2.5'>
                                                <div className='h-2 w-2 rounded-full bg-amber-500 mt-1 shrink-0' />
                                                <div>
                                                    <p className='text-[9px] font-black text-zinc-500 uppercase tracking-wide'>
                                                        Pickup
                                                    </p>
                                                    <p className='text-zinc-300 font-medium leading-relaxed mt-0.5'>
                                                        {log.pickup.label}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className='flex items-start gap-2.5 pt-1.5'>
                                                <div className='h-2 w-2 rounded-full bg-sky-500 mt-1 shrink-0' />
                                                <div>
                                                    <p className='text-[9px] font-black text-zinc-500 uppercase tracking-wide'>
                                                        Dropoff
                                                    </p>
                                                    <p className='text-zinc-300 font-medium leading-relaxed mt-0.5'>
                                                        {log.dropoff.label}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Stats details */}
                                        <div className='flex flex-col justify-around py-1 sm:pl-3 space-y-2.5 sm:space-y-0'>
                                            <div className='flex justify-between items-center text-zinc-400'>
                                                <span className='flex items-center gap-1.5'>
                                                    <Compass size={13} className='text-zinc-500' /> Distance
                                                </span>
                                                <span className='font-bold text-white'>{log.distanceKm.toFixed(1)} km</span>
                                            </div>
                                            <div className='flex justify-between items-center text-zinc-400'>
                                                <span className='flex items-center gap-1.5'>
                                                    <Clock size={13} className='text-zinc-500' /> Trip Time
                                                </span>
                                                <span className='font-bold text-white'>{log.durationMin.toFixed(0)} min</span>
                                            </div>
                                            <div className='flex justify-between items-center text-zinc-400 border-t border-white/[0.03] pt-2'>
                                                <span className='text-[10px] text-zinc-500 uppercase tracking-wider font-semibold'>Payment status</span>
                                                <span className='font-extrabold text-white capitalize text-[11px]'>{log.paymentStatus}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
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
                className='relative z-10 mx-2 sm:mx-3 lg:mx-5 flex h-[calc(100dvh-1rem)] sm:h-[calc(100dvh-2rem)] max-h-[920px] w-full max-w-5xl flex-col overflow-hidden rounded-[20px] sm:rounded-[28px] border border-white/[0.08] bg-black/50 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl'
            >
                {children}
            </motion.div>
        </div>
    )
}
