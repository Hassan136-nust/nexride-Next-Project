'use client'

import React, { useRef, useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import Image from 'next/image'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, LogOut, Briefcase, ChevronDown } from "lucide-react"
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../redux/store'
import { setUserData } from '../redux/userSlice'
import { signOut } from 'next-auth/react'
import { useOnClickOutside } from '../hooks/useOnClickOutside'
import { useRouter } from 'next/navigation'
import logo from "../../public/logo.png"

type NavProps = {
  onLoginClick: () => void
  onSignupClick: () => void
}

function Nav({ onLoginClick, onSignupClick }: NavProps) {
  const pathName = usePathname()
  const dispatch = useDispatch()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  const userData = useSelector((state: RootState) => state.user.userData)
  const Nav_Items = userData?.role === "partner"
    ? ["Home", "Pending Requests", "Bookings", "Active Ride"]
    : ["Home", "Bookings", "About Us", "Contact"]

  const getHref = (item: string) => {
    if (item === "Home") return "/"
    if (item === "Pending Requests") return "/partner/pending-requests"
    if (item === "Bookings") return userData?.role === "partner" ? "/partner/bookings" : "/user/bookings"
    if (item === "Active Ride") return "/partner/active-ride"
    // For About Us and Contact, scroll to the footer instead of navigating to a separate page
    if (item === "About Us" || item === "Contact") return "/#footer"
    return `/${item.toLowerCase().replace(/\s+/g, "-")}`
  }

  const handleLogout = async () => {
    if (userData?.role === 'partner') {
      try {
        await fetch('/api/partner/offline', { method: 'POST' })
      } catch (err) {
        console.error('Failed to go offline on logout:', err)
      }
    }
    dispatch(setUserData(null))
    setDropdownOpen(false)
    await signOut({ redirect: false })
  }

  useOnClickOutside(dropdownRef, () => setDropdownOpen(false))

  const firstLetter = userData?.name?.charAt(0).toUpperCase() ?? ""

  return (
    <>
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className='fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 w-[96%] sm:w-[94%] md:w-[86%]
        z-50 rounded-full bg-[#0B0B0B] text-white
        shadow-[0_15px_50px_rgba(0,0,0,0.7)] py-2.5 sm:py-3'
      >
        <div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-8 flex items-center justify-between'>

          {/* Logo */}
          <Image src={logo} alt="NexRide logo" width={70} height={70} priority className='w-[60px] sm:w-[70px] md:w-[84px] h-auto' />

          {/* Nav links — desktop */}
          <div className='hidden md:flex items-center gap-6 lg:gap-10'>
            {Nav_Items.map((item, index) => {
              const href = getHref(item)
              const active = href === pathName
              return (
                <Link
                  key={index}
                  href={href}
                  className={`text-sm font-medium transition ${active ? "text-white" : "text-gray-400 hover:text-white"
                    }`}
                >
                  {item}
                </Link>
              )
            })}
          </div>

          {/* Right side — desktop */}
          <div className='hidden md:flex items-center gap-3'>
            {userData ? (
              <div className='relative' ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className='flex items-center gap-2 focus:outline-none'
                  aria-label="User menu"
                >
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    className='w-9 h-9 rounded-full bg-white text-black font-bold text-sm cursor-pointer
                    flex items-center justify-center shadow-md select-none'
                  >
                    {firstLetter}
                  </motion.div>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 cursor-pointer transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className='absolute right-0 mt-3 w-64 rounded-2xl bg-[#141414]
                      border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                      overflow-hidden z-50 '
                    >
                      {/* User info */}
                      <div className='px-5 py-4 border-b border-white/10 bg-white/[0.02] '>
                        <div className='flex items-center gap-3 '>
                          <div className='w-10 h-10 rounded-full bg-white text-black font-bold
                          flex items-center justify-center text-sm shrink-0 '>
                            {firstLetter}
                          </div>
                          <div className='min-w-0'>
                            <p className='text-sm font-semibold text-white truncate '>
                              {userData.name}
                            </p>
                            <p className='text-xs text-gray-500 truncate'>
                              {userData.email}
                            </p>
                            <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize
                              ${userData.role === "partner" ? "bg-green-500/20 text-green-400" :
                                userData.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                                  "bg-white/10 text-gray-400"}`}>
                              {userData.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Become a Partner - only shown if not already a partner/admin */}
                      {userData.role === "user" && userData.partnerOnboardingSteps === 0 && (
                        <div className='px-3 py-2.5 border-b border-white/10'>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setDropdownOpen(false);
                              router.push('/partner/onboarding/vehicle');
                            }}
                            className='group w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                          text-sm font-semibold text-white bg-white/[0.06] border border-white/10
                          hover:bg-white hover:text-black hover:border-white
                          transition-colors duration-200 shadow-sm'
                          >
                            <Briefcase size={16} className='transform group-hover:translate-x-1 transition-transform duration-200 cursor-pointer' />
                            Become a Partner
                          </motion.button>
                        </div>
                      )}

                      {/* Logout */}
                      <div className='px-2 py-2'>
                        <button
                          onClick={handleLogout}
                          className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                          text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-150'
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className='px-4 py-1.5 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 transition'
                >
                  Login
                </button>
                <button
                  onClick={onSignupClick}
                  className='px-4 py-1.5 rounded-full bg-white text-black text-sm font-medium hover:bg-gray-100 transition'
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            className='md:hidden text-white p-1 cursor-pointer'
            onClick={() => setMobileOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className='fixed top-20 left-1/2 -translate-x-1/2 w-[94%] z-40
            rounded-2xl bg-[#0B0B0B] text-white shadow-[0_15px_50px_rgba(0,0,0,0.7)]
            flex flex-col px-6 py-5 gap-4 md:hidden border border-white/5 '
          >
            {Nav_Items.map((item, index) => {
              const href = getHref(item)
              const active = href === pathName
              return (
                <Link
                  key={index}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`text-sm font-medium transition ${active ? "text-white" : "text-gray-400 hover:text-white"
                    }`}
                >
                  {item}
                </Link>
              )
            })}

            <div className='pt-2 border-t border-white/10'>
              {userData ? (
                <div className='space-y-2'>
                  <div className='flex items-center gap-3 px-1 py-2'>
                    <div className='w-9 h-9 rounded-full bg-white text-black font-bold text-sm flex items-center justify-center shrink-0'>
                      {firstLetter}
                    </div>
                    <div className='min-w-0'>
                      <p className='text-sm font-semibold truncate'>{userData.name}</p>
                      <p className='text-xs text-gray-500 truncate'>{userData.email}</p>
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize
                        ${userData.role === "partner" ? "bg-green-500/20 text-green-400" :
                          userData.role === "admin" ? "bg-purple-500/20 text-purple-400" :
                            "bg-white/10 text-gray-400"}`}>
                        {userData.role}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Become a Partner Button */}
                  {userData.role === "user" && userData.partnerOnboardingSteps === 0 && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setMobileOpen(false); router.push('/partner/onboarding/vehicle') }}
                      className='w-full flex items-center justify-center gap-3 px-3 py-3 rounded-xl 
                    text-sm font-semibold text-black bg-white active:bg-gray-200 transition-colors cursor-pointer'
                    >
                      <Briefcase size={16} />
                      Become a Partner
                    </motion.button>
                  )}

                  <button
                    onClick={() => { setMobileOpen(false); handleLogout() }}
                    className='w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-400 active:text-white transition'
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className='flex gap-3'>
                  <button
                    onClick={() => { setMobileOpen(false); onLoginClick() }}
                    className='flex-1 py-2 rounded-full border border-white/30 text-white text-sm font-medium active:bg-white/10 transition'
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setMobileOpen(false); onSignupClick() }}
                    className='flex-1 py-2 rounded-full bg-white text-black text-sm font-medium active:bg-gray-100 transition'
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Nav;