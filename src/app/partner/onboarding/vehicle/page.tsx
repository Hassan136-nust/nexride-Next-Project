'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bike,
  Car,
  Truck,
  Bus,
  Gauge,
  Hash,
  ImagePlus,
  ArrowLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

type VehicleType = "bike" | "car" | "loading" | "truck" | "auto"

export default function Page() {
  const router = useRouter()

  const [vehicleType, setVehicleType] = useState<VehicleType | "">("")
  const [vehicleModel, setVehicleModel] = useState("")
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [baseFare, setBaseFare] = useState("")

  // existingImageUrl = already saved cloudinary URL (shown as preview, not re-uploaded)
  const [existingImageUrl, setExistingImageUrl] = useState("")
  // newImageBase64 = newly picked file (will be uploaded)
  const [newImageBase64, setNewImageBase64] = useState("")

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")

  const vehicles = [
    { type: "bike", icon: Bike },
    { type: "car", icon: Car },
    { type: "truck", icon: Truck },
    { type: "loading", icon: Bus },
    { type: "auto", icon: Gauge },
  ] as const

  /* PREFILL EXISTING DATA */
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch("/api/partner/onboarding/vehicle")
        const data = await res.json()
        if (res.ok && data.vehicle) {
          const v = data.vehicle
          setVehicleType(v.type ?? "")
          setVehicleModel(v.vehicleModel ?? "")
          setVehicleNumber(v.number ?? "")
          setBaseFare(v.baseFare ? String(v.baseFare) : "")
          setExistingImageUrl(v.imageUrl ?? "")
        }
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    fetchVehicle()
  }, [])

  const previewImage = newImageBase64 || existingImageUrl

  const handleSubmit = async () => {
    setError("")

    if (!vehicleType || !vehicleModel || !vehicleNumber) {
      setError("Please fill all required fields.")
      return
    }

    if (!existingImageUrl && !newImageBase64) {
      setError("Please upload a vehicle image.")
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/partner/onboarding/vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: vehicleType,
          vehicleModel,
          number: vehicleNumber,
          // send new base64 if changed, otherwise re-send existing URL
          imageUrl: newImageBase64 || existingImageUrl,
          baseFare: baseFare ? Number(baseFare) : 0,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Something went wrong")
        return
      }

      router.push("/partner/onboarding/documents")
    } catch (err) {
      console.error(err)
      setError("Failed to save vehicle details. Please try again.")
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
      <div className='relative z-10 px-6 py-10 h-screen overflow-y-auto no-scrollbar'>

        {/* HEADER */}
        <div className='max-w-4xl mx-auto flex items-center justify-between mb-6'>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className='flex items-center gap-2 text-sm text-gray-300 hover:text-white transition'
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>

          <div className='text-center flex-1'>
            <h1 className='text-3xl md:text-4xl font-bold'>Partner Onboarding</h1>
            <p className='text-gray-300 mt-1'>Complete your vehicle details to start earning with NexRide</p>
          </div>

          <div className='w-[70px]' />
        </div>

        {/* STEP INDICATOR */}
        <div className='flex justify-center mt-6 gap-4'>
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 w-20 rounded-full transition-all ${s === 1 ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='max-w-5xl mx-auto mt-12'>

          <h2 className='text-xl font-semibold mb-6 text-center'>Select Vehicle Type</h2>

          {/* VEHICLE TYPE SELECTOR */}
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
            {vehicles.map((v) => {
              const Icon = v.icon
              const active = vehicleType === v.type
              return (
                <motion.div
                  key={v.type}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setVehicleType(v.type)}
                  className={`cursor-pointer rounded-2xl p-5 border flex flex-col items-center gap-3 transition-all
                  ${active ? "bg-white text-black border-white" : "bg-white/10 border-white/20 hover:bg-white/20"}`}
                >
                  <Icon size={28} />
                  <span className='text-sm font-medium capitalize'>{v.type}</span>
                </motion.div>
              )
            })}
          </div>

          {/* INPUTS */}
          <div className='mt-10 grid md:grid-cols-2 gap-5'>
            <Input icon={<Car size={18} />} label="Vehicle Model" placeholder="Toyota Corolla" value={vehicleModel} onChange={setVehicleModel} />
            <Input icon={<Hash size={18} />} label="Vehicle Number" placeholder="ABC-123" value={vehicleNumber} onChange={setVehicleNumber} />
            <Input icon={<Gauge size={18} />} label="Base Fare" placeholder="Base fare" type="number" value={baseFare} onChange={setBaseFare} />

            {/* IMAGE UPLOAD */}
            <motion.div whileHover={{ scale: 1.02 }}>
              <label className='text-sm text-gray-300'>Vehicle Image</label>

              <label
                htmlFor='vehicleImage'
                className='flex items-center gap-2 bg-white/10 p-3 rounded-xl mt-1
                cursor-pointer border border-white/20 hover:bg-white/15 transition'
              >
                <ImagePlus size={18} className='text-gray-300' />
                <span className='text-gray-300 text-sm'>
                  {previewImage ? "Change vehicle image" : "Upload vehicle image"}
                </span>
                <input
                  id='vehicleImage'
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onloadend = () => setNewImageBase64(reader.result as string)
                    reader.readAsDataURL(file)
                  }}
                />
              </label>

              {previewImage && (
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={previewImage}
                  alt='Vehicle Preview'
                  className='mt-4 w-full h-44 object-cover rounded-2xl border border-white/20'
                />
              )}
            </motion.div>
          </div>

          {/* ERROR */}
          {error && <p className='text-red-400 text-sm mt-4 text-center'>{error}</p>}

          {/* SUBMIT */}
          <div className='flex justify-end mt-10'>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!vehicleType || loading}
              onClick={handleSubmit}
              className='px-8 py-3 rounded-xl bg-white text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed'
            >
              {loading ? "Saving..." : "Next Step"}
            </motion.button>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

/* INPUT */
function Input({
  icon, label, placeholder, type = "text", value, onChange,
}: {
  icon: React.ReactNode
  label: string
  placeholder: string
  type?: string
  value: string
  onChange: (val: string) => void
}) {
  return (
    <motion.div whileHover={{ scale: 1.02 }}>
      <label className='text-sm text-gray-300'>{label}</label>
      <div className='flex items-center gap-2 bg-white/10 p-3 rounded-xl mt-1 border border-white/20'>
        {icon}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className='bg-transparent outline-none w-full text-white'
          placeholder={placeholder}
        />
      </div>
    </motion.div>
  )
}
