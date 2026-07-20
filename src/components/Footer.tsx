'use client'

import React from 'react'
import {
  Car,
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { motion } from 'framer-motion'

function Footer() {

  const container = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.08
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <footer id="footer" className='w-full bg-zinc-950 text-white px-6 py-16'>
      <div className='max-w-7xl mx-auto'>

        {/* Top Section */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className='grid grid-cols-1 md:grid-cols-4 gap-10'
        >

          {/* Brand */}
          <motion.div variants={item}>
            <div className='flex items-center gap-2 mb-4'>
              <Car className='text-white' />
              <h2 className='text-xl font-bold'>NexRide</h2>
            </div>

            <p className='text-zinc-400 text-sm leading-relaxed'>
              Premium ride booking platform offering safe, fast and reliable transportation anytime, anywhere.
            </p>

            {/* subtle hover underline animation */}
            <motion.div
              className='h-[2px] bg-white w-0 mt-6'
              whileHover={{ width: 60 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Links */}
          <motion.div variants={item}>
            <h3 className='font-semibold mb-4'>Quick Links</h3>
            <ul className='space-y-2 text-zinc-400 text-sm'>
              {["Home", "Book Ride", "Vehicle Categories", "Pricing"].map((t) => (
                <li
                  key={t}
                  className='hover:text-white cursor-pointer transition'
                >
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div variants={item}>
            <h3 className='font-semibold mb-4'>Services</h3>
            <ul className='space-y-2 text-zinc-400 text-sm'>
              {["Car Rental", "Bike Booking", "Cargo Transport", "Airport Rides"].map((t) => (
                <li
                  key={t}
                  className='hover:text-white cursor-pointer transition'
                >
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={item}>
            <h3 className='font-semibold mb-4'>Contact</h3>

            <div className='space-y-3 text-zinc-400 text-sm'>

              <motion.div whileHover={{ x: 4 }} className='flex items-center gap-2'>
                <MapPin size={16} />
                <span>NUST, Islamabad, Pakistan</span>
              </motion.div>

              <motion.div whileHover={{ x: 4 }} className='flex items-center gap-2'>
                <Phone size={16} />
                <span>+92 328 9082754</span>
              </motion.div>

              <motion.div whileHover={{ x: 4 }} className='flex items-center gap-2'>
                <Mail size={16} />
                <span>support@nexride.com</span>
              </motion.div>

            </div>
          </motion.div>

        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className='border-t border-zinc-800 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4'
        >

          <p className='text-zinc-500 text-sm'>
            © {new Date().getFullYear()} NexRide. All rights reserved.
          </p>

          <div className='flex gap-6 text-zinc-500 text-sm'>
            {["Privacy Policy", "Terms", "Support"].map((t) => (
              <span
                key={t}
                className='hover:text-white cursor-pointer transition'
              >
                {t}
              </span>
            ))}
          </div>

        </motion.div>

      </div>
    </footer>
  )
}

export default Footer