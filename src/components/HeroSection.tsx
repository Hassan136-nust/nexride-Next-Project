'use client'

import { motion } from "framer-motion"
import React, { useEffect } from 'react'
import { Bike, Bus, Car, Truck } from "lucide-react"
import { RootState } from "@/redux/store"
import { useSelector } from "react-redux"
import { useRouter } from "next/navigation"
import { getSocket } from "@/lib/socket"

function HeroSection({ onAuthRequired }: { onAuthRequired: () => void }) {

  const router = useRouter()



  const { userData } = useSelector((state: RootState) => state.user)


  return (
    <div className='relative min-h-screen w-full overflow-hidden'>

      <div
        className='absolute top-0 left-0 w-full h-full bg-cover bg-center'
        style={{ backgroundImage: "url('/heroImage.jpg')" }}
      />

      <div className='absolute inset-0 bg-black/55' />

      <div className='relative z-10 min-h-screen flex flex-col items-center justify-center px-4 text-center' >

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='text-white font-extrabold text-4xl sm:text-5xl md:text-7xl'
        >
          Book Any Vehicle
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className='mt-4 max-w-xl text-gray-300'
        >
          Experience the future of transportation with NexRide - your ultimate vehicle booking platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className='mt-8 flex gap-8 text-gray-300'
        >
          <Bike size={30} />
          <Car size={30} />
          <Bus size={30} />
          <Truck size={30} />
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className='mt-12 px-10 py-4 bg-white text-black font-semibold rounded-full shadow-xl'
          onClick={() => {
            if (userData) {
              router.push('/user/book')
            } else {
              onAuthRequired()
            }
          }}
        >
          Book Now
        </motion.button>

      </div>
    </div>
  )
}

export default HeroSection