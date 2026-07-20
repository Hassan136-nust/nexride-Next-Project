'use client'

import React, { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  Car,
  Clock,
  Compass,
  Star,
  CheckCircle,
  Truck,
  Scooter,
  Bike,
  Package,
} from 'lucide-react'

// Simple icons mapped
const VEHICLE_ICONS: Record<string, React.ElementType> = {
  bike: Bike,
  car: Car,
  auto: Scooter,
  loading: Package,
  truck: Truck,
}

function CheckoutPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  // Retrieve parameters from URL
  const pickup = searchParams.get('pickup') || ''
  const pickupLat = parseFloat(searchParams.get('pickupLat') || '0')
  const pickupLng = parseFloat(searchParams.get('pickupLng') || '0')
  const dropoff = searchParams.get('dropoff') || ''
  const dropoffLat = parseFloat(searchParams.get('dropoffLat') || '0')
  const dropoffLng = parseFloat(searchParams.get('dropoffLng') || '0')
  const vehicle = searchParams.get('vehicle') || 'car'
  const phone = searchParams.get('phone') || ''
  const partnerId = searchParams.get('partnerId') || ''
  const partnerName = searchParams.get('partnerName') || 'Driver'
  const vehicleModel = searchParams.get('vehicleModel') || 'Standard Vehicle'
  const vehicleNumber = searchParams.get('vehicleNumber') || 'N/A'
  const estimatedFare = parseFloat(searchParams.get('estimatedFare') || '0')
  const distanceKm = parseFloat(searchParams.get('distanceKm') || '0')
  const durationMin = parseFloat(searchParams.get('durationMin') || '0')

  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash')
  const [bookingLoading, setBookingLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (status === 'unauthenticated') {
    router.push('/signin')
    return null
  }

  const handleBooking = async () => {
    setBookingLoading(true)
    setErrorMsg('')
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickup: { label: pickup, lat: pickupLat, lng: pickupLng },
          dropoff: { label: dropoff, lat: dropoffLat, lng: dropoffLng },
          vehicleType: vehicle,
          estimatedFare,
          distanceKm,
          durationMin,
          partnerId,
          paymentMethod,
          passengerPhone: phone,
          passengerName: session?.user?.name || '',
          vehicleModel,
          vehicleNumber,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData.error || 'Failed to request booking')
      }
      const data = await response.json()

      // Card payment is deferred — no Stripe redirect at booking time.
      // User will pay after the ride is completed from the bookings page.
      setSuccess(true)
      setTimeout(() => {
        router.push('/user/bookings')
      }, 3000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred while creating booking request.')
    } finally {
      setBookingLoading(false)
    }
  }

  const VehicleIcon = VEHICLE_ICONS[vehicle] || Car

  // Calculate pricing breakdown details
  const platformFee = Math.round(estimatedFare * 0.05)
  const totalFare = estimatedFare + platformFee
  const partnerEarning = estimatedFare

  return (
    <PageShell>
      {/* Header */}
      <header className='flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4 sm:px-7 sm:py-5'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => router.back()}
            className='flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white'
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className='text-base font-black tracking-tight sm:text-lg'>
              Confirm Booking
            </h1>
            <p className='mt-0.5 text-[11px] text-zinc-500'>
              Choose payment method and submit booking details
            </p>
          </div>
        </div>
      </header>

      {/* Success Page overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 text-center'
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className='flex flex-col items-center gap-4'
            >
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'>
                <CheckCircle size={48} />
              </div>
              <h2 className='text-2xl font-black text-white'>Booking Requested!</h2>
              <p className='max-w-xs text-sm text-zinc-400'>
                Your ride request has been successfully created. Redirecting to home...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className='flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden relative'>
        {/* Left Side: Payment Details Card */}
        <div className='w-full lg:w-[480px] shrink-0 border-t lg:border-t-0 lg:border-r border-white/[0.06] flex flex-col h-[60dvh] lg:h-full overflow-hidden bg-black/40 backdrop-blur-md'>
          <div className='no-scrollbar flex-1 overflow-y-auto p-5 sm:p-6 space-y-6'>
            {/* Payment Method Selector */}
            <div className='space-y-3.5'>
              <h2 className='text-xs font-bold uppercase tracking-wider text-zinc-400'>
                Select Payment Method
              </h2>
              <div className='grid grid-cols-2 gap-3.5'>
                <button
                  type='button'
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex flex-col items-center gap-3.5 p-4 rounded-xl border text-center transition-all duration-200 ${paymentMethod === 'cash'
                    ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20'
                    : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                >
                  <DollarSign
                    size={22}
                    className={paymentMethod === 'cash' ? 'text-emerald-400' : 'text-zinc-400'}
                  />
                  <div>
                    <p className='text-xs font-bold text-white'>Cash Payment</p>
                    <p className='text-[10px] text-zinc-500 mt-0.5'>Pay driver directly</p>
                  </div>
                </button>

                <button
                  type='button'
                  onClick={() => setPaymentMethod('card')}
                  className={`flex flex-col items-center gap-3.5 p-4 rounded-xl border text-center transition-all duration-200 ${paymentMethod === 'card'
                    ? 'border-sky-500/50 bg-sky-500/5 ring-1 ring-sky-500/20'
                    : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]'
                    }`}
                >
                  <CreditCard
                    size={22}
                    className={paymentMethod === 'card' ? 'text-sky-400' : 'text-zinc-400'}
                  />
                  <div>
                    <p className='text-xs font-bold text-white'>Credit / Debit Card</p>
                    <p className='text-[10px] text-zinc-500 mt-0.5'>Pay online fast</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Price Detail Summary */}
            <div className='rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4'>
              <h2 className='text-xs font-bold uppercase tracking-wider text-zinc-400'>
                Fare Breakdown
              </h2>
              <div className='space-y-2.5 text-xs'>
                <div className='flex justify-between text-zinc-400'>
                  <span>Base fare ({distanceKm.toFixed(1)} km)</span>
                  <span className='font-semibold text-white'>Rs {estimatedFare.toLocaleString()}</span>
                </div>
                <div className='flex justify-between text-zinc-400'>
                  <span>Platform fee (5%)</span>
                  <span className='font-semibold text-white'>Rs {platformFee.toLocaleString()}</span>
                </div>
                <div className='border-t border-white/5 pt-3 flex justify-between text-sm font-bold text-white'>
                  <span>Total Payable</span>
                  <span className='text-base font-black text-emerald-400'>
                    Rs {totalFare.toLocaleString()}
                  </span>
                </div>
                <p className='text-[10px] text-zinc-600'>
                  Partner earns: Rs {partnerEarning.toLocaleString()}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className='rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-center text-xs font-semibold text-red-400'>
                {errorMsg}
              </div>
            )}

            {/* Action CTA */}
            <button
              type='button'
              onClick={handleBooking}
              disabled={bookingLoading}
              className='relative w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-xl hover:from-emerald-400 hover:to-teal-500 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2'
            >
              {bookingLoading ? (
                <>
                  <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white' />
                  Requesting Ride...
                </>
              ) : (
                paymentMethod === 'card' ? 'Book & Pay Later' : 'Request Booking'
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Ride Summary Info Card */}
        <div className='flex-1 h-[40dvh] lg:h-full overflow-y-auto p-5 sm:p-6 bg-zinc-950/20 flex flex-col justify-between'>
          <div className='max-w-xl w-full mx-auto space-y-6'>
            {/* Header statistics info */}
            <div className='grid grid-cols-3 gap-3.5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4'>
              <div className='text-center border-r border-white/5'>
                <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-wider'>Service</p>
                <div className='mt-1.5 flex justify-center text-emerald-400'>
                  <VehicleIcon size={18} />
                </div>
                <p className='mt-1 text-xs font-extrabold text-white capitalize'>{vehicle}</p>
              </div>
              <div className='text-center border-r border-white/5'>
                <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-wider'>Distance</p>
                <div className='mt-1.5 flex justify-center text-sky-400'>
                  <Compass size={18} />
                </div>
                <p className='mt-1 text-xs font-extrabold text-white'>{distanceKm.toFixed(1)} km</p>
              </div>
              <div className='text-center'>
                <p className='text-[10px] font-bold text-zinc-500 uppercase tracking-wider'>Duration</p>
                <div className='mt-1.5 flex justify-center text-amber-400'>
                  <Clock size={18} />
                </div>
                <p className='mt-1 text-xs font-extrabold text-white'>{durationMin.toFixed(0)} mins</p>
              </div>
            </div>

            {/* Address Details */}
            <div className='space-y-4 bg-white/[0.01] border border-white/[0.04] rounded-2xl p-5'>
              <h3 className='text-[10px] font-bold text-zinc-500 uppercase tracking-wider'>Route Detail</h3>
              <div className='space-y-4 relative pl-5'>
                <div className='absolute left-[6px] top-[7px] bottom-[7px] w-0.5 bg-zinc-800 border-dashed border-l border-zinc-700' />

                {/* Pickup details */}
                <div className='relative'>
                  <div className='absolute left-[-24px] top-1.5 h-3.5 w-3.5 rounded-full border-3 border-amber-500 bg-black flex items-center justify-center' />
                  <p className='text-[10px] font-black text-amber-500 uppercase tracking-wider'>Pickup</p>
                  <p className='text-sm text-zinc-200 mt-1 font-semibold'>{pickup}</p>
                </div>

                {/* Dropoff details */}
                <div className='relative'>
                  <div className='absolute left-[-24px] top-1.5 h-3.5 w-3.5 rounded-full border-3 border-sky-500 bg-black flex items-center justify-center' />
                  <p className='text-[10px] font-black text-sky-500 uppercase tracking-wider'>Dropoff</p>
                  <p className='text-sm text-zinc-200 mt-1 font-semibold'>{dropoff}</p>
                </div>
              </div>
            </div>

            {/* Driver Summary Details section */}
            <div className='bg-white/[0.02] border border-white/[0.08] rounded-2xl p-5 flex items-center gap-4 pl-6'>
              <div className='h-12 w-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0'>
                <Car size={24} />
              </div>
              <div className='min-w-0 flex-1 py-0.5'>
                <div className='flex items-center justify-between gap-2'>
                  <div>
                    <p className='text-sm font-bold text-white truncate'>{partnerName}</p>
                    <p className='text-xs text-zinc-400 truncate mt-0.5'>{vehicleModel}</p>
                  </div>
                  <div className='flex items-center gap-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400'>
                    <Star size={10} fill='currentColor' />
                    4.9
                  </div>
                </div>
                <p className='text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mt-1.5'>
                  Plate Number: {vehicleNumber}
                </p>
              </div>
            </div>
          </div>
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
        className='relative z-10 mx-3 flex h-[calc(100dvh-2rem)] max-h-[920px] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/50 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:mx-5'
      >
        {children}
      </motion.div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className='flex flex-1 flex-col items-center justify-center gap-3'>
            <span className='h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white' />
            <p className='text-sm text-zinc-400'>Loading details…</p>
          </div>
        </PageShell>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  )
}
