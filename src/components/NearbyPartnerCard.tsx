'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { Bike, Car, Clock, MapPin, Package, Scooter, Star, Truck } from 'lucide-react'
import type { NearbyPartner, VehicleType } from '@/types/nearby'
import { getVehicleStyle } from '@/lib/vehicleMapIcons'

const VEHICLE_ICONS: Record<VehicleType, React.ElementType> = {
  bike: Bike,
  car: Car,
  auto: Scooter,
  loading: Package,
  truck: Truck,
}

type Props = {
  partner: NearbyPartner
  selected?: boolean
  onSelect?: () => void
}

export default function NearbyPartnerCard({
  partner,
  selected = false,
  onSelect,
}: Props) {
  const style = getVehicleStyle(partner.vehicle.type)
  const VehicleIcon = VEHICLE_ICONS[partner.vehicle.type] ?? Car

  return (
    <motion.button
      type='button'
      onClick={onSelect}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`group relative w-full overflow-hidden rounded-2xl border text-left transition-all duration-200 ${selected
          ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/20 shadow-[0_12px_30px_-8px_rgba(16,185,129,0.15)]'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
        }`}
    >
      <div
        className='absolute inset-y-0 left-0 w-1.5'
        style={{ background: style.color }}
      />

      <div className='flex gap-4 p-4 pl-5'>
        {/* Landscape Clear Image Container */}
        <div className='relative h-[80px] w-[120px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-1 flex items-center justify-center'>
          {partner.vehicle.imageUrl ? (
            <Image
              src={partner.vehicle.imageUrl}
              alt={partner.vehicle.vehicleModel}
              fill
              className='object-contain p-0.5 rounded-lg'
              sizes='120px'
              unoptimized
            />
          ) : (
            <div
              className='flex h-full w-full items-center justify-center rounded-lg'
              style={{ background: `${style.color}15` }}
            >
              <VehicleIcon size={32} style={{ color: style.color }} />
            </div>
          )}
          {partner.isOnline && (
            <span className='absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded bg-emerald-500/90 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider text-white shadow-sm'>
              <span className='h-1 w-1 animate-pulse rounded-full bg-white' />
              Live
            </span>
          )}
        </div>

        <div className='min-w-0 flex-1 flex flex-col justify-between py-0.5'>
          <div>
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <p className='truncate text-sm font-bold text-white group-hover:text-emerald-400 transition-colors'>
                  {partner.partnerName}
                </p>
                <p className='truncate text-xs font-medium text-zinc-400 mt-0.5'>
                  {partner.vehicle.vehicleModel}
                </p>
              </div>
              <div className='flex shrink-0 items-center gap-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400'>
                <Star size={10} fill='currentColor' />
                4.9
              </div>
            </div>

            <p className='mt-1 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase'>
              {partner.vehicle.number}
            </p>
          </div>

          <div className='mt-2 flex flex-wrap gap-2'>
            <span className='inline-flex items-center gap-1 rounded-lg border border-white/5 bg-black/40 px-2 py-1 text-[10px] font-medium text-zinc-300'>
              <MapPin size={10} className='text-zinc-400' />
              {partner.distanceKm} km away
            </span>
            <span className='inline-flex items-center gap-1 rounded-lg border border-white/5 bg-black/40 px-2 py-1 text-[10px] font-medium text-zinc-300'>
              <Clock size={10} className='text-zinc-400' />
              {partner.etaMin} min
            </span>
          </div>
        </div>
      </div>

      <div className='flex items-center justify-between border-t border-white/[0.04] bg-black/35 px-4 py-3 pl-5'>
        <div>
          <p className='text-[9px] font-bold uppercase tracking-wider text-zinc-500'>
            Est. fare
          </p>
          <p className='text-base font-extrabold text-white'>
            Rs {partner.estimatedFare.toLocaleString()}
          </p>
        </div>
        <span
          className='rounded-xl px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-md transition-all duration-200 group-hover:opacity-95'
          style={{ background: style.color }}
        >
          Select ride
        </span>
      </div>
    </motion.button>
  )
}
