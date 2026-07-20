'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Upload,
  FileText,
  BadgeCheck,
  Check,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()

  const step = 2

  // existing = cloudinary URL already saved, new = freshly picked base64
  const [existingCnic, setExistingCnic] = useState("")
  const [existingLicense, setExistingLicense] = useState("")
  const [existingRc, setExistingRc] = useState("")

  const [cnic, setCnic] = useState("")
  const [license, setLicense] = useState("")
  const [vehicleRc, setVehicleRc] = useState("")

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  /* PREFILL EXISTING DATA */
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await fetch("/api/partner/onboarding/documents")
        const data = await res.json()
        if (res.ok && data.partnerDocs) {
          setExistingCnic(data.partnerDocs.CNIC_Url ?? "")
          setExistingLicense(data.partnerDocs.License_Url ?? "")
          setExistingRc(data.partnerDocs.vehicle_rc ?? "")
        }
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchDocs()
  }, [])

  const handleSubmit = async () => {
    // use new base64 if changed, otherwise fall back to existing URL
    const finalCnic = cnic || existingCnic
    const finalLicense = license || existingLicense
    const finalRc = vehicleRc || existingRc

    if (!finalCnic || !finalLicense || !finalRc) {
      alert("Please upload all three documents.")
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/partner/onboarding/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CNIC_Url: finalCnic,
          License_Url: finalLicense,
          vehicle_rc: finalRc,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || "Something went wrong")
        return
      }

      router.push("/partner/onboarding/bank")
    } catch (error) {
      console.log(error)
      alert("Upload failed")
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
      <div className='relative z-10 px-6 py-10 min-h-screen overflow-y-auto no-scrollbar'>

        {/* HEADER */}
        <div className='max-w-5xl mx-auto flex items-center justify-between'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className='flex items-center gap-2 text-sm text-gray-300 hover:text-white transition'
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>

          <div className='text-center flex-1'>
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className='text-3xl md:text-4xl font-bold'>Upload Documents</h1>
              <p className='text-gray-300 mt-2'>Your documents are securely stored and verified by our team</p>
              <div className='mt-4 flex items-center justify-center gap-2 text-sm text-green-400'>
                <ShieldCheck size={18} />
                Secure Verification System
              </div>
            </motion.div>
          </div>

          <div className='w-[70px]' />
        </div>

        {/* STEP INDICATOR */}
        <div className='flex justify-center mt-8 gap-4'>
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 w-20 rounded-full transition-all duration-300 ${step >= s ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>

        {/* INFO CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='max-w-3xl mx-auto mt-10 bg-white/10 border border-white/20 rounded-2xl p-5'
        >
          <div className='flex items-center gap-3 text-gray-300'>
            <BadgeCheck className='text-green-400' />
            <p className='text-sm'>We verify all documents manually to ensure safety and trust in our platform.</p>
          </div>
        </motion.div>

        {/* UPLOAD GRID */}
        <div className='max-w-5xl mx-auto mt-10 grid md:grid-cols-3 gap-6'>
          <UploadCard
            title="CNIC Front & Back"
            existingUrl={existingCnic}
            newValue={cnic}
            setNewValue={setCnic}
          />
          <UploadCard
            title="Driving License"
            existingUrl={existingLicense}
            newValue={license}
            setNewValue={setLicense}
          />
          <UploadCard
            title="Vehicle Registration (RC)"
            existingUrl={existingRc}
            newValue={vehicleRc}
            setNewValue={setVehicleRc}
          />
        </div>

        {/* BUTTONS */}
        <div className='flex justify-between max-w-5xl mx-auto mt-10'>
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
            {loading ? "Uploading..." : "Next Step"}
          </motion.button>
        </div>

      </div>
    </div>
  )
}

/* =========================================
   UPLOAD CARD
========================================= */
function UploadCard({
  title,
  existingUrl,
  newValue,
  setNewValue,
}: {
  title: string
  existingUrl: string
  newValue: string
  setNewValue: React.Dispatch<React.SetStateAction<string>>
}) {
  const preview = newValue || existingUrl
  const hasFile = !!preview

  return (
    <motion.label
      whileHover={{ scale: 1.03 }}
      className='bg-white/10 border border-white/20 rounded-2xl p-6
      cursor-pointer flex flex-col items-center justify-center gap-3 text-center'
    >
      {hasFile ? (
        <Check size={34} className='text-green-400' />
      ) : (
        <FileText size={30} className='text-gray-300' />
      )}

      <h3 className='text-sm font-medium text-gray-200'>{title}</h3>

      <div className='flex items-center gap-2 text-xs text-gray-400'>
        <Upload size={14} />
        {hasFile ? "Uploaded — click to change" : "Click to upload"}
      </div>

      <input
        type='file'
        accept='image/*'
        className='hidden'
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onloadend = () => setNewValue(reader.result as string)
          reader.readAsDataURL(file)
        }}
      />

      {/* PREVIEW */}
      {preview && (
        <img
          src={preview}
          alt='preview'
          className='w-full h-36 object-cover rounded-xl mt-2'
        />
      )}
    </motion.label>
  )
}
