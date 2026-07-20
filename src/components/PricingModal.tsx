'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  DollarSign,
  Gauge,
  Clock,
  CarFront,
  BadgeCheck
} from 'lucide-react'

type Vehicle = {
  imageUrl?: string
  vehicleModel?: string
  type?: string
  number?: string
  baseFare?: number
  perKmFare?: number
  waitingFare?: number
}

type PricingModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PricingModal({
  isOpen,
  onClose,
  onSuccess
}: PricingModalProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const [baseFare, setBaseFare] = useState<string>('')
  const [perKmFare, setPerKmFare] = useState<string>('')
  const [waitingFare, setWaitingFare] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!isOpen) return

    const fetchVehicle = async () => {
      try {
        setLoading(true)

        const res = await fetch('/api/partner/onboarding/vehicle')
        const data: { vehicle?: Vehicle } = await res.json()

        if (data.vehicle) {
          setVehicle(data.vehicle)

          setBaseFare(
            data.vehicle.baseFare
              ? String(data.vehicle.baseFare)
              : ''
          )

          setPerKmFare(
            data.vehicle.perKmFare
              ? String(data.vehicle.perKmFare)
              : ''
          )

          setWaitingFare(
            data.vehicle.waitingFare
              ? String(data.vehicle.waitingFare)
              : ''
          )
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchVehicle()
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setError('')

    if (!baseFare || !perKmFare || !waitingFare) {
      setError('All pricing fields are required.')
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch('/api/partner/onboarding/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          baseFare: Number(baseFare),
          perKmFare: Number(perKmFare),
          waitingFare: Number(waitingFare)
        })
      })

      const data: { error?: string } = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save pricing.')
      }

      onSuccess()
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Something went wrong.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 z-[100] bg-black/70 backdrop-blur-md'
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25 }}
            className='fixed left-1/2 top-1/2 z-[101] w-[95%] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-[#0d0d0d] shadow-[0_0_60px_rgba(0,0,0,0.7)]'
          >
            {/* Header */}
            <div className='flex items-center justify-between border-b border-white/10 px-6 py-5'>
              <div>
                <h2 className='flex items-center gap-2 text-xl font-bold text-white'>
                  <DollarSign className='text-emerald-400' size={22} />
                  Configure Pricing
                </h2>

                <p className='mt-1 text-sm text-gray-400'>
                  Set your vehicle pricing details for ride requests.
                </p>
              </div>

              <button
                onClick={onClose}
                className='flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition hover:bg-white/10 hover:text-white'
              >
                <X size={18} />
              </button>
            </div>

            {loading ? (
              <div className='flex items-center justify-center py-20'>
                <div className='h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-white' />
              </div>
            ) : vehicle ? (
              <form
                onSubmit={handleSubmit}
                className='grid gap-6 p-6 md:grid-cols-2'
              >
                {/* LEFT SIDE */}
                <div className='space-y-5'>
                  {/* Vehicle Card */}
                  <div className='overflow-hidden rounded-2xl border border-white/10 bg-[#141414]'>
                    {vehicle.imageUrl ? (
                      <div className='relative h-64 w-full overflow-hidden'>
                        <img
                          src={vehicle.imageUrl}
                          alt='Vehicle'
                          className='h-full w-full object-cover transition duration-500 hover:scale-105'
                        />

                        <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent' />

                        <div className='absolute bottom-0 left-0 w-full p-4'>
                          <div className='flex items-center gap-2'>
                            <BadgeCheck
                              size={16}
                              className='text-emerald-400'
                            />
                            <span className='text-xs font-medium text-emerald-300'>
                              Verified Vehicle
                            </span>
                          </div>

                          <h3 className='mt-2 text-2xl font-bold text-white'>
                            {vehicle.vehicleModel || 'Vehicle'}
                          </h3>

                          <p className='mt-1 text-sm text-gray-300'>
                            {vehicle.type} • {vehicle.number}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className='flex h-64 items-center justify-center bg-[#111]'>
                        <CarFront size={70} className='text-gray-600' />
                      </div>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className='rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4'>
                    <p className='text-sm leading-relaxed text-gray-300'>
                      Pricing affects ride estimates shown to customers. Make
                      sure your rates are competitive and accurate.
                    </p>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div className='flex flex-col justify-between'>
                  <div className='space-y-5'>
                    {error && (
                      <div className='rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300'>
                        {error}
                      </div>
                    )}

                    {/* Base Fare */}
                    <div>
                      <label className='mb-2 flex items-center gap-2 text-sm font-semibold text-gray-200'>
                        <DollarSign size={15} />
                        Base Fare (Rs.)
                      </label>

                      <input
                        type='number'
                        min='0'
                        required
                        value={baseFare}
                        onChange={(e) => setBaseFare(e.target.value)}
                        placeholder='Enter base fare'
                        className='h-12 w-full rounded-2xl border border-white/10 bg-[#121212] px-4 text-sm text-white outline-none transition focus:border-emerald-500'
                      />
                    </div>

                    {/* Per KM */}
                    <div>
                      <label className='mb-2 flex items-center gap-2 text-sm font-semibold text-gray-200'>
                        <Gauge size={15} />
                        Per KM Fare (Rs.)
                      </label>

                      <input
                        type='number'
                        min='0'
                        required
                        value={perKmFare}
                        onChange={(e) => setPerKmFare(e.target.value)}
                        placeholder='Enter per km fare'
                        className='h-12 w-full rounded-2xl border border-white/10 bg-[#121212] px-4 text-sm text-white outline-none transition focus:border-emerald-500'
                      />
                    </div>

                    {/* Waiting */}
                    <div>
                      <label className='mb-2 flex items-center gap-2 text-sm font-semibold text-gray-200'>
                        <Clock size={15} />
                        Waiting Fare (Rs./min)
                      </label>

                      <input
                        type='number'
                        min='0'
                        required
                        value={waitingFare}
                        onChange={(e) => setWaitingFare(e.target.value)}
                        placeholder='Enter waiting fare'
                        className='h-12 w-full rounded-2xl border border-white/10 bg-[#121212] px-4 text-sm text-white outline-none transition focus:border-emerald-500'
                      />
                    </div>
                  </div>

                  {/* Button */}
                  <button
                    type='submit'
                    disabled={submitting}
                    className='mt-8 flex h-13 w-full items-center justify-center rounded-2xl bg-emerald-600 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {submitting
                      ? 'Saving Pricing...'
                      : 'Submit Pricing for Review'}
                  </button>
                </div>
              </form>
            ) : (
              <div className='px-6 py-16 text-center'>
                <div className='mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5'>
                  <CarFront size={40} className='text-gray-500' />
                </div>

                <h3 className='mt-5 text-lg font-semibold text-white'>
                  No Vehicle Found
                </h3>

                <p className='mt-2 text-sm text-gray-400'>
                  Please complete the vehicle onboarding step first.
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}