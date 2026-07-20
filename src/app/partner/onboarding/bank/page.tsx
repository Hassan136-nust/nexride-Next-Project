'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Landmark, User, Hash, CreditCard, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  const step = 3

  const [accountHolderName, setAccountHolderName] = useState("")
  const [bankName, setBankName] = useState("")
  const [ifscCode, setIfscCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  /* PREFILL EXISTING DATA */
  useEffect(() => {
    const fetchBank = async () => {
      try {
        const res = await fetch("/api/partner/onboarding/bank")
        const data = await res.json()
        if (res.ok && data.partnerBank) {
          setAccountHolderName(data.partnerBank.accountHolderName ?? "")
          setBankName(data.partnerBank.bankName ?? "")
          setIfscCode(data.partnerBank.ifscCode ?? "")
          setAccountNumber(data.partnerBank.accountNumber ?? "")
        }
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchBank()
  }, [])

  const handleSubmit = async () => {
    setError("")

    if (!accountHolderName || !bankName || !ifscCode || !accountNumber) {
      setError("All bank details are required.")
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/partner/onboarding/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountHolderName, bankName, ifscCode, accountNumber }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Something went wrong")
        return
      }

      router.push("/")
    } catch (err) {
      console.error(err)
      setError("Failed to save bank details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className='relative min-h-screen w-full text-white overflow-hidden flex items-center justify-center'>
        <div className='absolute inset-0 bg-cover bg-center scale-105 blur-sm' style={{ backgroundImage: "url('/heroImage.jpg')" }} />
        <div className='absolute inset-0 bg-black/70' />
        <p className='relative z-10 text-gray-300 text-sm'>Loading...</p>
      </div>
    )
  }

  return (
    <div className='relative min-h-screen w-full text-white overflow-hidden'>

      {/* BACKGROUND */}
      <div className='absolute inset-0 bg-cover bg-center scale-105 blur-sm' style={{ backgroundImage: "url('/heroImage.jpg')" }} />
      <div className='absolute inset-0 bg-black/70' />

      {/* CONTENT */}
      <div className='relative z-10 px-6 py-10 min-h-screen'>

        {/* HEADER */}
        <div className='max-w-4xl mx-auto flex items-center justify-between'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className='flex items-center gap-2 text-sm text-gray-300 hover:text-white transition'
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className='text-center flex-1'>
            <h1 className='text-3xl md:text-4xl font-bold'>Bank Details</h1>
            <p className='text-gray-300 mt-2'>Add your bank account to receive earnings securely</p>
            <div className='mt-4 flex items-center justify-center gap-2 text-sm text-green-400'>
              <ShieldCheck size={18} />
              Secure Payout System
            </div>
          </motion.div>

          <div className='w-[70px]' />
        </div>

        {/* STEP INDICATOR */}
        <div className='flex justify-center mt-8 gap-4'>
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 w-20 rounded-full transition-all ${step >= s ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>

        {/* BANK FORM */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='max-w-4xl mx-auto mt-12 grid md:grid-cols-2 gap-6'>
          <Input icon={<User size={18} />} label="Account Holder Name" placeholder="Hassan" value={accountHolderName} onChange={setAccountHolderName} />
          <Input icon={<Landmark size={18} />} label="Bank Name" placeholder="HBL / Meezan / UBL" value={bankName} onChange={setBankName} />
          <Input icon={<Hash size={18} />} label="IFSC / Branch Code" placeholder="12345" value={ifscCode} onChange={setIfscCode} />
          <Input icon={<CreditCard size={18} />} label="Account Number" placeholder="1234567890" value={accountNumber} onChange={setAccountNumber} />
        </motion.div>

        {/* INFO CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='max-w-3xl mx-auto mt-10 bg-white/10 border border-white/20 rounded-2xl p-5'
        >
          <p className='text-sm text-gray-300 flex items-center gap-2'>
            <ShieldCheck className='text-green-400' size={18} />
            Your bank details are encrypted and only used for payout processing.
          </p>
        </motion.div>

        {/* ERROR */}
        {error && <p className='text-red-400 text-sm mt-4 text-center max-w-4xl mx-auto'>{error}</p>}

        {/* BUTTONS */}
        <div className='flex justify-between max-w-4xl mx-auto mt-10'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className='px-6 py-3 rounded-xl bg-white/10 text-white border border-white/20'
          >
            Back
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
            onClick={handleSubmit}
            className='px-8 py-3 rounded-xl bg-white text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {loading ? "Submitting..." : "Save & Continue"}
          </motion.button>
        </div>

      </div>
    </div>
  )
}

/* INPUT COMPONENT */
function Input({
  icon, label, placeholder, value, onChange,
}: {
  icon: React.ReactNode
  label: string
  placeholder: string
  value: string
  onChange: (val: string) => void
}) {
  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <label className='text-sm text-gray-300'>{label}</label>
      <div className='flex items-center gap-2 bg-white/10 p-3 rounded-xl mt-1 border border-white/20'>
        {icon}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='bg-transparent outline-none w-full text-white'
          placeholder={placeholder}
        />
      </div>
    </motion.div>
  )
}
