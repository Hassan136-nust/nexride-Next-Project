'use client'

import React, { useRef } from 'react'
import {
  CarTaxiFront,
  Car,
  Bike,
  Bus,
  Truck,
  Ambulance,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock3,
  MapPinned,
  BadgeCheck
} from 'lucide-react'
import { motion } from 'framer-motion'

const VEHICLE_CATEGORIES = [
  {
    title: "All Vehicles",
    desc: "Browse the full fleet",
    Icon: CarTaxiFront,
    tag: "Popular"
  },
  {
    title: "Cars",
    desc: "Comfortable daily rides",
    Icon: Car,
    tag: "Economy"
  },
  {
    title: "Bikes",
    desc: "Fast and affordable travel",
    Icon: Bike,
    tag: "Quick"
  },
  {
    title: "SUVs",
    desc: "Spacious rides for families",
    Icon: Bus,
    tag: "Premium"
  },
  {
    title: "Vans",
    desc: "Perfect for group travel",
    Icon: Ambulance,
    tag: "Family"
  },
  {
    title: "Trucks",
    desc: "Heavy-duty transport vehicles",
    Icon: Truck,
    tag: "Cargo"
  }
]

const FEATURES = [
  { title: "10+ Categories", Icon: BadgeCheck },
  { title: "24/7 Available", Icon: Clock3 },
  { title: "Live Tracking", Icon: MapPinned },
  { title: "Safe & Secure", Icon: ShieldCheck }
]

function VehicleSection() {
  const sliderRef = useRef<HTMLDivElement | null>(null)

  const scrollLeft = () => {
    sliderRef.current?.scrollBy({
      left: -300,
      behavior: 'smooth'
    })
  }

  const scrollRight = () => {
    sliderRef.current?.scrollBy({
      left: 300,
      behavior: 'smooth'
    })
  }

  return (
    <div className='w-full bg-white py-20 px-4 overflow-hidden'>
      <div className='max-w-7xl mx-auto'>

        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className='flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12'
        >
          <div>
            <div className='flex items-center gap-3 mb-4'>
              <div className='h-px w-8 bg-zinc-900' />
              <span className='text-sm font-semibold tracking-[0.2em] uppercase text-zinc-500 relative'>
                Categories

                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className='absolute -bottom-1 left-0 h-[2px] bg-zinc-900'
                />
              </span>
            </div>

            <h2 className='text-4xl md:text-5xl font-bold text-zinc-900'>
              Choose Your <br /> Perfect Ride
            </h2>
          </div>

          {/* Buttons */}
          <div className='flex gap-3'>
            <button
              onClick={scrollLeft}
              className='h-11 w-11 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-900 hover:text-white transition'
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={scrollRight}
              className='h-11 w-11 rounded-full border border-zinc-300 flex items-center justify-center hover:bg-zinc-900 hover:text-white transition'
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>

        {/* Slider */}
        <div
          ref={sliderRef}
          className='flex gap-5 overflow-x-auto scroll-smooth pb-6'
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {VEHICLE_CATEGORIES.map((vehicle, index) => {
            const Icon = vehicle.Icon

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className='group relative min-w-[260px] md:min-w-[280px] rounded-3xl border border-zinc-200 bg-zinc-50 p-6 hover:bg-zinc-900 hover:border-zinc-900 transition-all duration-300 overflow-hidden cursor-pointer'
              >
                {/* Tag */}
                <div className='text-xs px-3 py-1 rounded-full bg-zinc-200 text-zinc-700 w-fit group-hover:bg-white/10 group-hover:text-white mb-5 transition'>
                  {vehicle.tag}
                </div>

                {/* Icon */}
                <div className='h-14 w-14 flex items-center justify-center rounded-2xl bg-white border border-zinc-200 group-hover:bg-white/10 group-hover:border-white/10 mb-5 transition'>
                  <Icon className='text-zinc-900 group-hover:text-white' size={26} />
                </div>

                {/* Title */}
                <h3 className='text-xl font-bold text-zinc-900 group-hover:text-white transition'>
                  {vehicle.title}
                </h3>

                {/* Animated underline */}
                <div className='h-[2px] w-0 bg-white group-hover:w-14 transition-all duration-300 mt-2 mb-4' />

                {/* Desc */}
                <p className='text-sm text-zinc-600 group-hover:text-zinc-300 transition'>
                  {vehicle.desc}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-14'
        >
          {FEATURES.map((f, i) => {
            const Icon = f.Icon
            return (
              <div
                key={i}
                className='flex items-center gap-4 p-5 rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-900 group transition'
              >
                <div className='h-11 w-11 flex items-center justify-center rounded-xl bg-white border border-zinc-200 group-hover:bg-white/10 group-hover:border-white/10 transition'>
                  <Icon size={20} className='group-hover:text-white' />
                </div>

                <span className='text-sm font-semibold text-zinc-800 group-hover:text-white transition'>
                  {f.title}
                </span>
              </div>
            )
          })}
        </motion.div>
      </div>

      {/* hide scrollbar */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

export default VehicleSection