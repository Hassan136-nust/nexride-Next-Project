'use client'

import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { X, Mail, Lock, User, CircleDashed } from "lucide-react"
import Image from 'next/image'
import { motion, AnimatePresence } from "framer-motion"
import { signIn } from "next-auth/react"
import { useSession } from "next-auth/react"
import google from "../../public/google.jpg"

type propType = {
  open: boolean
  onClose: () => void
  initialStep?: "login" | "signup"
}

function AuthModal({
  open,
  onClose,
  initialStep = "login"
}: propType) {

  const [step, setStep] = useState<"login" | "signup">("login")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // OTP STATE
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""))
  const [otpLoading, setOtpLoading] = useState(false)

  const { data } = useSession()

  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  // SIGNUP
  const handleSignup = async () => {
    setError("")
    setLoading(true)

    try {
      await axios.post("/api/auth/register", { name, email, password })

      setLoading(false)

      // 👉 go to OTP step instead of login
      setOtpStep(true)

    } catch (err: unknown) {
      setLoading(false)

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Something went wrong")
      } else {
        setError("Something went wrong")
      }
    }
  }

  // LOGIN (NEXTAUTH)
  const handleLogin = async () => {
    setError("")
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      setLoading(false)

      if (res?.error) {
        setError(res.error)
      } else {
        onClose()
      }

    } catch {
      setLoading(false)
      setError("Login failed")
    }
  }

  // GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    await signIn("google")
  }

  // OTP CHANGE
  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // BACKSPACE
  const handleOtpKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  // VERIFY OTP
  const handleVerifyOtp = async () => {
    setOtpLoading(true)
    setError("")

    try {
      const code = otp.join("")

      await axios.post("/api/auth/verify-email", {
        email,
        otp: code,
      })

      setOtpLoading(false)
      setOtpStep(false)
      setStep("login")

      setOtp(new Array(6).fill(""))

    } catch (err: unknown) {
      setOtpLoading(false)
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Invalid OTP")
      } else {
        setError("Something went wrong")
      }
    }
  }

  useEffect(() => {
    if (!open) return

    requestAnimationFrame(() => {
      setStep(initialStep ?? "login")
      setOtpStep(false)
    })

  }, [open, initialStep])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className='fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center px-4'
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            onClick={(e) => e.stopPropagation()}
            className='relative w-full max-w-md rounded-3xl bg-white border border-black/10 shadow-[0_40px_100px_rgba(0,0,0,0.35)] p-6 sm:p-8 text-black'
          >

            {/* CLOSE */}
            <button
              onClick={onClose}
              className='absolute top-4 right-4 text-gray-500 hover:text-black'
            >
              <X size={20} />
            </button>

            {/* HEADER */}
            <div className='text-center mb-6'>
              <h1 className='text-3xl font-extrabold tracking-widest'>NexRide</h1>
              <p className='text-xs text-gray-500'>Premium Vehicle Booking</p>
            </div>

            {/* GOOGLE */}
            <button
              onClick={handleGoogleLogin}
              className='w-full h-11 rounded-xl border border-black/20 flex items-center justify-center gap-3 text-sm font-semibold hover:bg-black hover:text-white'
            >
              <Image src={google} alt="google" width={20} height={20} />
              Continue with Google
            </button>

            <div className='my-6 flex items-center gap-4 text-gray-400'>
              <div className='flex-1 h-px bg-black/10' />
              <div className='text-xs'>OR</div>
              <div className='flex-1 h-px bg-black/10' />
            </div>

            {/* OTP STEP */}
            {otpStep ? (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h1 className='text-xl font-semibold text-center'>Verify Account</h1>
                <p className='text-xs text-gray-500 text-center mt-1'>
                  Enter 6-digit OTP sent to {email}
                </p>

                <div className='flex justify-center gap-2 mt-6'>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el
                      }}
                      id={`otp-${i}`}
                      value={digit}
                      maxLength={1}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKeyDown(e, i)}
                      className='w-10 h-12 text-center text-lg font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none'
                    />
                  ))}
                </div>

                {error && (
                  <p className='text-red-500 text-sm text-center mt-3'>{error}</p>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={otpLoading}
                  className='w-full mt-6 h-11 rounded-lg bg-black text-white font-semibold flex justify-center items-center'
                >
                  {!otpLoading ? "Verify Account" : <CircleDashed className='animate-spin' size={18} />}
                </button>
              </motion.div>
            ) : step === "login" ? (

              /* LOGIN */
              <motion.div>
                <h1 className='text-xl text-center font-semibold'>Welcome Back</h1>

                <div className='mt-5 space-y-4'>
                  <div className='flex items-center gap-3 border rounded-lg px-3 py-2'>
                    <Mail size={20} />
                    <input
                      placeholder='Email'
                      className='w-full outline-none'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className='flex items-center gap-3 border rounded-lg px-3 py-2'>
                    <Lock size={20} />
                    <input
                      type='password'
                      placeholder='Password'
                      className='w-full outline-none'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className='w-full h-11 bg-black text-white rounded-lg flex justify-center items-center'
                  >
                    {!loading ? "Login" : <CircleDashed className='animate-spin' />}
                  </button>

                  <p className='text-center text-sm'>
                    No account?{" "}
                    <span
                      className='cursor-pointer underline'
                      onClick={() => setStep("signup")}
                    >
                      Sign up
                    </span>
                  </p>
                </div>
              </motion.div>

            ) : (

              /* SIGNUP */
             /* SIGNUP */
<motion.div>
  <h1 className='text-xl text-center font-semibold'>Create Account</h1>

  <div className='mt-5 space-y-4'>

    {/* Name */}
    <div className='flex items-center gap-3 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-black transition'>
      <User size={20} className='text-gray-400' />

      <input
        type='text'
        placeholder='Full Name'
        className='w-full outline-none bg-transparent text-sm'
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>

    {/* Email */}
    <div className='flex items-center gap-3 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-black transition'>
      <Mail size={20} className='text-gray-400' />

      <input
        type='email'
        placeholder='Email'
        className='w-full outline-none bg-transparent text-sm'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div>

    {/* Password */}
    <div className='flex items-center gap-3 border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-black transition'>
      <Lock size={20} className='text-gray-400' />

      <input
        type='password'
        placeholder='Password'
        className='w-full outline-none bg-transparent text-sm'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </div>

    {/* Error */}
    {error && (
      <p className='text-red-500 text-sm text-center'>{error}</p>
    )}

    {/* Button */}
    <button
      onClick={handleSignup}
      disabled={loading}
      className='w-full h-11 rounded-lg bg-black text-white text-sm font-semibold flex justify-center items-center hover:bg-gray-900 active:scale-[0.98] transition shadow-md'
    >
      {!loading ? (
        "Sign Up"
      ) : (
        <CircleDashed size={18} className='animate-spin' />
      )}
    </button>

    {/* Switch */}
    <p className='text-sm text-gray-600 text-center'>
      Already have an account?{" "}
      <span
        className='text-black font-medium hover:underline cursor-pointer transition'
        onClick={() => setStep("login")}
      >
        Login
      </span>
    </p>

  </div>
</motion.div>

            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AuthModal