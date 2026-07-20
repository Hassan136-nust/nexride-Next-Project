'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Car, Bike, Truck, Navigation,
  MapPin, Phone, ArrowRight,
  CheckCircle, Loader2, Map,
  AlertTriangle, Check,
  Package,
  Scooter,
} from 'lucide-react'

// Types
type VehicleClassId = 'car' | 'bike' | 'auto' | 'loading' | 'truck'

interface VehicleOption {
  id: VehicleClassId
  label: string
  desc: string
  icon: React.ElementType
  color: string
}

interface SuggestionFeature {
  properties: {
    name?: string
    city?: string
    state?: string
    country?: string
    street?: string
  }
  geometry: {
    coordinates: [number, number]
  }
}

const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'bike',
    label: 'Ride Bike',
    desc: 'Single passenger',
    icon: Bike,
    color:
      'border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-white',
  },
  {
    id: 'car',
    label: 'Ride Car',
    desc: 'Premium commute',
    icon: Car,
    color:
      'border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-white',
  },
  {
    id: 'auto',
    label: 'Ride Auto',
    desc: 'Budget share',
    icon: Scooter,
    color:
      'border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-amber-500/30 hover:bg-amber-500/10 hover:text-white',
  },
  {
    id: 'loading',
    label: 'Ride Loader',
    desc: 'Medium delivery',
    icon: Package,
    color:
      'border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-white',
  },
  {
    id: 'truck',
    label: 'NexRide Cargo',
    desc: 'Express truck',
    icon: Truck,
    color:
      'border-white/[0.08] bg-white/[0.03] text-zinc-300 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-white',
  },
]

export default function BookRidePage() {
  const router = useRouter()

  // State variables for inputs
  const [vehicleClass, setVehicleClass] = useState<VehicleClassId>('car')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')

  // Pickup location state
  const [pickupInput, setPickupInput] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupCountry, setPickupCountry] = useState('')
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null)

  // Suggestion overlay state for Pickup
  const [pickupSuggestions, setPickupSuggestions] = useState<SuggestionFeature[]>([])
  const [pickupLoading, setPickupLoading] = useState(false)
  const [showPickupOverlay, setShowPickupOverlay] = useState(false)
  const [geoLocating, setGeoLocating] = useState(false)

  // Dropoff location state
  const [dropoffInput, setDropoffInput] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [dropoffCoords, setDropoffCoords] = useState<[number, number] | null>(null)

  // Suggestion overlay state for Dropoff
  const [dropoffSuggestions, setDropoffSuggestions] = useState<SuggestionFeature[]>([])
  const [dropoffLoading, setDropoffLoading] = useState(false)
  const [showDropoffOverlay, setShowDropoffOverlay] = useState(false)
  const [countryWarning, setCountryWarning] = useState('')
  const [loadingConfirm, setLoadingConfirm] = useState(false)
  const [openRideLoading, setOpenRideLoading] = useState(true)
  const [openRide, setOpenRide] = useState<{ _id: string; status: string } | null>(null)

  // Overlay outside click refs
  const pickupRef = useRef<HTMLDivElement>(null)
  const dropoffRef = useRef<HTMLDivElement>(null)

  // Hide dropdowns when clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickupRef.current && !pickupRef.current.contains(event.target as Node)) {
        setShowPickupOverlay(false)
      }
      if (dropoffRef.current && !dropoffRef.current.contains(event.target as Node)) {
        setShowDropoffOverlay(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    let alive = true
    const checkOpenRide = async () => {
      try {
        const res = await fetch('/api/bookings?open=true')
        if (!res.ok) return
        const data = await res.json()
        if (alive) setOpenRide(data.bookings?.[0] || null)
      } finally {
        if (alive) setOpenRideLoading(false)
      }
    }
    checkOpenRide()
    const iv = setInterval(checkOpenRide, 15000)
    return () => {
      alive = false
      clearInterval(iv)
    }
  }, [])

  // Auto-complete fetch logic for Pickup Location
  useEffect(() => {
    if (!pickupInput || pickupInput === pickupAddress) {
      queueMicrotask(() => setPickupSuggestions([]))
      return
    }
    const timer = setTimeout(async () => {
      setPickupLoading(true)
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(pickupInput)}`)
        if (!res.ok) throw new Error('API failed')
        const data = await res.json()
        setPickupSuggestions((data.features || []).slice(0, 5))
        setShowPickupOverlay(true)
      } catch (err) {
        console.error('Pickup suggestions fetch error:', err)
      } finally {
        setPickupLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [pickupInput, pickupAddress])

  // Auto-complete fetch logic for Dropoff Location
  useEffect(() => {
    if (!dropoffInput || dropoffInput === dropoffAddress) {
      queueMicrotask(() => setDropoffSuggestions([]))
      return
    }
    const timer = setTimeout(async () => {
      setDropoffLoading(true)
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(dropoffInput)}`)
        if (!res.ok) throw new Error('API failed')
        const data = await res.json()
        setDropoffSuggestions((data.features || []).slice(0, 5))
        setShowDropoffOverlay(true)
      } catch (err) {
        console.error('Dropoff suggestions fetch error:', err)
      } finally {
        setDropoffLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [dropoffInput, dropoffAddress])

  // Geolocate device position using browser reverse search
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('Your browser does not support geolocation.')
      return
    }
    setGeoLocating(true)
    setPhoneError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude, latitude } = pos.coords
        setPickupCoords([longitude, latitude])
        try {
          const res = await fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`)
          if (!res.ok) throw new Error('Reverse geocoding failed')
          const data = await res.json()
          if (data.features && data.features.length > 0) {
            const feat: SuggestionFeature = data.features[0]
            const name = feat.properties.name || ''
            const street = feat.properties.street || ''
            const city = feat.properties.city || ''
            const country = feat.properties.country || ''
            const formatted = [street || name, city, country].filter(Boolean).join(', ')

            setPickupAddress(formatted)
            setPickupInput(formatted)
            setPickupCountry(country)
          } else {
            const altAddress = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            setPickupAddress(altAddress)
            setPickupInput(altAddress)
            setPickupCountry('Global')
          }
        } catch {
          const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          setPickupAddress(fallback)
          setPickupInput(fallback)
          setPickupCountry('Global')
        } finally {
          setGeoLocating(false)
        }
      },
      (err) => {
        console.error('Location capture error:', err)
        alert('Permission failed or browser Geolocation access blocked.')
        setGeoLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // Handle Pickup Selection
  const selectPickupSuggestion = (feat: SuggestionFeature) => {
    const name = feat.properties.name || ''
    const street = feat.properties.street || ''
    const city = feat.properties.city || ''
    const country = feat.properties.country || ''
    const formatted = [street || name, city, country].filter(Boolean).join(', ')

    setPickupAddress(formatted)
    setPickupInput(formatted)
    setPickupCountry(country)
    setPickupCoords(feat.geometry.coordinates)
    setShowPickupOverlay(false)

    // Clear dropoff if starting country changes
    if (dropoffAddress) {
      setDropoffAddress('')
      setDropoffInput('')
      setDropoffCoords(null)
    }
    setCountryWarning('')
  }

  // Handle Dropoff Selection
  const selectDropoffSuggestion = (feat: SuggestionFeature) => {
    const name = feat.properties.name || ''
    const street = feat.properties.street || ''
    const city = feat.properties.city || ''
    const country = feat.properties.country || ''

    // Country constraint checks
    if (pickupCountry && country && pickupCountry.toLowerCase() !== country.toLowerCase()) {
      setCountryWarning(`Same country validation failed. Selected dropoff must remain in [${pickupCountry}]. Found suggestion in [${country}].`)
      return
    }

    const formatted = [street || name, city, country].filter(Boolean).join(', ')
    setDropoffAddress(formatted)
    setDropoffInput(formatted)
    setDropoffCoords(feat.geometry.coordinates)
    setShowDropoffOverlay(false)
    setCountryWarning('')
  }

  // Verification steps indicators
  const stepVehicleOk = !!vehicleClass
  const stepPhoneOk = !!phone && phone.length >= 7
  const stepPickupOk = !!pickupAddress
  const stepDropoffOk = !!dropoffAddress

  const isFormValid = stepVehicleOk && stepPhoneOk && stepPickupOk && stepDropoffOk && !openRide

  const handleConfirmBooking = () => {
    if (!isFormValid || loadingConfirm || openRide) return

    setLoadingConfirm(true)

    const query = new URLSearchParams({
      vehicle: vehicleClass,
      phone,
      pickup: pickupAddress,
      dropoff: dropoffAddress,
      pickupLat: pickupCoords?.[1]?.toString() || '',
      pickupLng: pickupCoords?.[0]?.toString() || '',
      dropoffLat: dropoffCoords?.[1]?.toString() || '',
      dropoffLng: dropoffCoords?.[0]?.toString() || '',
    })

    setTimeout(() => {
      router.push(`/user/search?${query.toString()}`)
    }, 1200)
  }

  // Lock viewport scroll — scroll only inside card (hidden scrollbar)
  useEffect(() => {
    const prevBody = document.body.style.overflow
    const prevHtml = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevBody
      document.documentElement.style.overflow = prevHtml
    }
  }, [])

  const stepPills = [
    { label: 'Ride', ok: stepVehicleOk },
    { label: 'Contact', ok: stepPhoneOk },
    { label: 'Pickup', ok: stepPickupOk },
    { label: 'Dropoff', ok: stepDropoffOk },
  ] as const

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black text-white font-sans selection:bg-white/20 selection:text-white'>
      <div className='absolute inset-0 bg-cover bg-center scale-105 blur-[6px]' style={{ backgroundImage: "url('/heroImage.jpg')" }} />
      <div className='absolute inset-0 bg-gradient-to-b from-black/80 via-black/85 to-black/95' />
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.08),transparent)]' />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className='relative z-10 mx-3 flex h-[calc(100dvh-2rem)] max-h-[900px] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-black/50 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.85)] backdrop-blur-2xl sm:mx-5'
      >
        <div className='flex shrink-0 flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5'>
          <div>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black shadow-lg shadow-white/10'>
                <Navigation size={17} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className='text-base font-black tracking-tight text-white sm:text-lg'>NexRide Booking</h1>
                <p className='text-[10px] text-zinc-500 sm:text-[11px]'>Instant ride validation and dispatch</p>
              </div>
            </div>
          </div>

          <div className='flex items-center gap-1 sm:gap-1.5'>
            {stepPills.map((step, i) => (
              <React.Fragment key={step.label}>
                <div
                  className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide transition-all duration-300 sm:px-3 sm:text-[10px] ${step.ok
                    ? 'border-white/25 bg-white/12 text-white shadow-[0_0_20px_-4px_rgba(255,255,255,0.15)]'
                    : 'border-white/10 bg-white/[0.03] text-zinc-500'
                    }`}
                >
                  {step.ok && <Check size={10} className='text-emerald-400' />}
                  {step.label}
                </div>
                {i < stepPills.length - 1 && (
                  <div className={`hidden h-px w-3 sm:block ${step.ok ? 'bg-white/30' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className='no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-5 py-4 sm:px-7 sm:py-5'>
          {openRide && (
            <div className='shrink-0 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-semibold text-amber-300'>
              You already have an active booking ({openRide.status}). View it in My Bookings before requesting another ride.
            </div>
          )}

          <section className='shrink-0 space-y-2.5'>
            <label className='flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400'>
              <span className='text-zinc-600'>01</span> Select ride category
              {stepVehicleOk && <CheckCircle size={12} className='text-emerald-400' />}
            </label>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5'>
              {VEHICLE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = vehicleClass === opt.id
                return (
                  <button
                    key={opt.id}
                    type='button'
                    onClick={() => setVehicleClass(opt.id)}
                    className={`flex min-w-0 flex-col items-start rounded-xl border p-3 text-left transition-all duration-200 ${isSelected
                      ? 'border-white/25 bg-white/[0.1] ring-1 ring-white/20'
                      : opt.color
                      }`}
                  >
                    <div className='mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white'>
                      <Icon size={18} />
                    </div>
                    <h4 className='text-xs font-bold capitalize text-white'>{opt.id}</h4>
                    <span className='mt-0.5 text-[10px] leading-tight text-zinc-500'>{opt.desc}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className='shrink-0 space-y-2'>
            <label className='flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400'>
              <span className='text-zinc-600'>02</span> Mobile phone number
              {stepPhoneOk && <CheckCircle size={12} className='text-emerald-400' />}
            </label>
            <div className='relative'>
              <div className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500'>
                <Phone size={14} />
              </div>
              <input
                type='tel'
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (phoneError) setPhoneError('')
                }}
                placeholder='Enter phone, e.g. +923001234567'
                className='w-full rounded-xl border border-white/[0.08] bg-black/50 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10'
              />
            </div>
            {phoneError && (
              <p className='text-[11px] text-red-400'>{phoneError}</p>
            )}
          </section>

          <section className='space-y-2.5'>
            <label className='flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400'>
              <span className='text-zinc-600'>03</span> Route &amp; locations
              {stepPickupOk && stepDropoffOk && <CheckCircle size={12} className='text-emerald-400' />}
            </label>

            <div className='grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4'>
              <div className='space-y-2 rounded-xl border border-white/[0.06] bg-black/40 p-3 sm:p-3.5' ref={pickupRef}>
                <div className='flex items-center justify-between'>
                  <span className='flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500'>
                    <MapPin size={11} className='text-amber-400/90' /> Pickup point
                  </span>
                  <button
                    type='button'
                    onClick={handleGeolocate}
                    disabled={geoLocating}
                    className='flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-50 disabled:opacity-50'
                  >
                    {geoLocating ? <Loader2 size={9} className='animate-spin' /> : <Map size={9} />}
                    {geoLocating ? 'Locating…' : 'GPS Locate'}
                  </button>
                </div>

                <div className='relative'>
                  <input
                    type='text'
                    value={pickupInput}
                    onChange={(e) => {
                      setPickupInput(e.target.value)
                      if (!e.target.value) {
                        setPickupAddress('')
                        setPickupCountry('')
                        setPickupCoords(null)
                        setDropoffAddress('')
                        setDropoffInput('')
                        setDropoffCoords(null)
                      }
                      setCountryWarning('')
                    }}
                    placeholder='Search pickup area…'
                    className='w-full rounded-lg border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-white/25'
                  />
                  {pickupLoading && (
                    <div className='absolute right-2.5 top-1/2 -translate-y-1/2'>
                      <Loader2 size={11} className='animate-spin text-zinc-500' />
                    </div>
                  )}
                  {showPickupOverlay && pickupSuggestions.length > 0 && (
                    <div className='no-scrollbar absolute top-full left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/98 shadow-2xl backdrop-blur-xl'>
                      {pickupSuggestions.map((feat, idx) => {
                        const name = feat.properties.name || ''
                        const city = feat.properties.city || ''
                        const country = feat.properties.country || ''
                        return (
                          <button
                            key={idx}
                            type='button'
                            onClick={() => selectPickupSuggestion(feat)}
                            className='flex w-full items-start gap-2 border-b border-white/5 p-2.5 text-left text-xs transition last:border-0 hover:bg-white/[0.08]'
                          >
                            <MapPin size={12} className='mt-0.5 shrink-0 text-zinc-500' />
                            <div>
                              <p className='font-semibold text-white'>{name}</p>
                              <p className='text-[10px] text-zinc-500'>{[city, country].filter(Boolean).join(', ')}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {pickupAddress ? (
                  <div className='rounded-lg border border-white/[0.06] bg-white/[0.04] p-2 text-xs text-white'>
                    <span className='mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-500'>Confirmed</span>
                    <p className='truncate'>{pickupAddress}</p>
                  </div>
                ) : (
                  <p className='text-[11px] italic text-zinc-600'>Set pickup location</p>
                )}
              </div>

              <div className='space-y-2 rounded-xl border border-white/[0.06] bg-black/40 p-3 sm:p-3.5' ref={dropoffRef}>
                <span className='flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500'>
                  <MapPin size={11} className='text-sky-400/90' /> Dropoff destination
                </span>

                <div className='relative'>
                  <input
                    type='text'
                    disabled={!pickupAddress}
                    value={dropoffInput}
                    onChange={(e) => {
                      setDropoffInput(e.target.value)
                      if (!e.target.value) {
                        setDropoffAddress('')
                        setDropoffCoords(null)
                      }
                      setCountryWarning('')
                    }}
                    placeholder={pickupAddress ? 'Search dropoff area…' : 'Complete pickup first'}
                    className='w-full rounded-lg border border-white/[0.08] bg-black/60 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-white/25 disabled:cursor-not-allowed disabled:opacity-40'
                  />
                  {dropoffLoading && (
                    <div className='absolute right-2.5 top-1/2 -translate-y-1/2'>
                      <Loader2 size={11} className='animate-spin text-zinc-500' />
                    </div>
                  )}
                  {showDropoffOverlay && dropoffSuggestions.length > 0 && (
                    <div className='no-scrollbar absolute top-full left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950/98 shadow-2xl backdrop-blur-xl'>
                      {dropoffSuggestions.map((feat, idx) => {
                        const name = feat.properties.name || ''
                        const city = feat.properties.city || ''
                        const country = feat.properties.country || ''
                        return (
                          <button
                            key={idx}
                            type='button'
                            onClick={() => selectDropoffSuggestion(feat)}
                            className='flex w-full items-start gap-2 border-b border-white/5 p-2.5 text-left text-xs transition last:border-0 hover:bg-white/[0.08]'
                          >
                            <MapPin size={12} className='mt-0.5 shrink-0 text-zinc-500' />
                            <div>
                              <p className='font-semibold text-white'>{name}</p>
                              <p className='text-[10px] text-zinc-500'>{[city, country].filter(Boolean).join(', ')}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {countryWarning && (
                  <div className='flex items-start gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-[11px] leading-snug text-red-400'>
                    <AlertTriangle size={12} className='mt-0.5 shrink-0' />
                    <span>{countryWarning}</span>
                  </div>
                )}

                {dropoffAddress ? (
                  <div className='rounded-lg border border-white/[0.06] bg-white/[0.04] p-2 text-xs text-white'>
                    <span className='mb-0.5 block text-[9px] font-bold uppercase tracking-wider text-zinc-500'>Confirmed</span>
                    <p className='truncate'>{dropoffAddress}</p>
                  </div>
                ) : (
                  <p className='text-[11px] italic text-zinc-600'>Set destination</p>
                )}
              </div>
            </div>
          </section>

          <div className='shrink-0 border-t border-white/[0.06] pt-4'>
            <button
              type='button'
              disabled={!isFormValid || loadingConfirm || openRideLoading}
              onClick={handleConfirmBooking}
              className='flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-black text-black shadow-[0_8px_32px_-8px_rgba(255,255,255,0.35)] transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500 disabled:shadow-none'
            >
              {openRide ? (
                <>
                  <AlertTriangle size={16} /> Active ride in progress
                </>
              ) : loadingConfirm ? (
                <>
                  <Loader2 size={16} className='animate-spin' /> Finding your ride…
                </>
              ) : (
                <>
                  Confirm &amp; find NexRide <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
