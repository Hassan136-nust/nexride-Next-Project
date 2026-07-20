'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Car,
  FileText,
  Banknote,
  Eye,
  Video,
  DollarSign,
  CheckCircle2,
  Rocket,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { useSelector } from 'react-redux'
import { RootState } from '@/redux/store'
import PricingModal from './PricingModal'

type StepStatus = "completed" | "active" | "locked" | "rejected"

export default function PartnerDashboard() {
  const router = useRouter()

  const userData = useSelector((state: RootState) => state.user.userData)

  const currentStep = userData?.partnerOnboardingSteps ?? 1
  const isVerified = userData?.isPartnerVerified ?? false

  const [vehicleStatus, setVehicleStatus] = useState<string>("none")
  const [docsStatus, setDocsStatus] = useState<string>("none")
  const [bankStatus, setBankStatus] = useState<string>("none")
  const [vehicleReason, setVehicleReason] = useState<string>("")
  const [docsReason, setDocsReason] = useState<string>("")
  const [bankReason, setBankReason] = useState<string>("")
  const [fetching, setFetching] = useState(true)

  const [showPricing, setShowPricing] = useState(false)

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const [resV, resD, resB] = await Promise.all([
          fetch("/api/partner/onboarding/vehicle"),
          fetch("/api/partner/onboarding/documents"),
          fetch("/api/partner/onboarding/bank")
        ])

        if (resV.ok) {
          const jsonV = await resV.json()
          setVehicleStatus(jsonV.vehicle?.status || "none")
          setVehicleReason(jsonV.vehicle?.rejectionReason || "")
        }
        if (resD.ok) {
          const jsonD = await resD.json()
          setDocsStatus(jsonD.partnerDocs?.status || "none")
          setDocsReason(jsonD.partnerDocs?.rejectionReason || "")
        }
        if (resB.ok) {
          const jsonB = await resB.json()
          setBankStatus(jsonB.partnerBank?.status || "none")
          setBankReason(jsonB.partnerBank?.rejectionReason || "")
        }
      } catch (err) {
        console.error("Partner dashboard fetch statuses error:", err)
      } finally {
        setFetching(false)
      }
    }

    fetchStatuses()
  }, [])

  const steps = [
    { id: 1, title: "Vehicle Info", icon: Car, route: "/partner/onboarding/vehicle" },
    { id: 2, title: "Identity Docs", icon: FileText, route: "/partner/onboarding/documents" },
    { id: 3, title: "Bank Details", icon: Banknote, route: "/partner/onboarding/bank" },
    { id: 4, title: "Admin Review", icon: Eye, route: "#" },
    { id: 5, title: "Video KYC", icon: Video, route: "/partner/kyc" },
    { id: 6, title: "Pricing Plans", icon: DollarSign, route: "#" },
    { id: 7, title: "Final Review", icon: CheckCircle2, route: "#" },
    { id: 8, title: "Go Live", icon: Rocket, route: "#" },
  ]

  const getStatus = (stepId: number): StepStatus => {
    // 1. Step already completed via onboarding progression → always completed (overrides any sub-entity status)
    if (stepId <= currentStep) return "completed"

    // 2. Only check rejected states for steps the partner hasn't been advanced past
    if (stepId === 1 && vehicleStatus === "rejected") return "rejected"
    if (stepId === 2 && docsStatus === "rejected") return "rejected"
    if (stepId === 3 && bankStatus === "rejected") return "rejected"

    // 3. Next step is active
    if (stepId === currentStep + 1 && currentStep < steps.length) return "active"
    return "locked"
  }

  const progress = Math.round((currentStep / steps.length) * 100)

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-24 select-none">

      {/* HEADER */}
      <div className="max-w-5xl mx-auto text-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Partner Dashboard</h1>
        <p className="text-gray-400 mt-2 text-sm max-w-md mx-auto">
          Complete your onboarding requirements to start earning with NexRide.
        </p>

        {/* STATUS BANNER */}
        {userData?.partnerStatus === 'rejected' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mt-6 bg-red-950/20 border border-red-500/30 text-red-200
            rounded-2xl px-6 py-4 max-w-lg mx-auto flex gap-3 text-left shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl" />
            <XCircle size={22} className="text-red-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Application Rejected</p>
              <p className="text-sm text-red-100 mt-1 font-medium">{userData.partnerRejectionReason || "Please review and edit the rejected details below."}</p>
              <p className="text-[10px] text-red-400/80 mt-2">Click on the rejected blocks below to correct your submissions.</p>
            </div>
          </motion.div>
        ) : !isVerified && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-center gap-3 
            bg-white/5 border border-white/10 text-gray-300
            rounded-2xl px-5 py-3 max-w-lg mx-auto"
          >
            <Clock size={18} className="text-gray-400" />
            <p className="text-sm">
              Your account is pending verification. You can continue onboarding.
            </p>
          </motion.div>
        )}

        {/* PROGRESS BAR */}
        <div className="mt-8 max-w-lg mx-auto">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-white"
            />
          </div>
          <p className="text-xs text-gray-400 mt-2 font-medium">{progress}% completed</p>
        </div>
      </div>

      {/* STEP CONNECTOR */}
      <div className="max-w-5xl mx-auto mb-10 overflow-x-auto pb-4 scrollbar-none">
        <div className="flex items-center justify-between min-w-[640px] px-2">
          {steps.map((step, i) => {
            const status = getStatus(step.id)

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* NODE */}
                <div
                  className={`w-5 h-5 rounded-full z-10 flex items-center justify-center border transition-all duration-300
                  ${status === "completed"
                      ? "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/20"
                      : status === "rejected"
                        ? "bg-red-500 border-red-500 shadow-md shadow-red-500/20"
                        : status === "active"
                          ? "bg-black border-white"
                          : "bg-white/10 border-white/20"
                    }`}
                >
                  {status === "completed" && (
                    <CheckCircle2 size={12} className="text-black" />
                  )}
                  {status === "rejected" && (
                    <XCircle size={12} className="text-white" />
                  )}
                </div>

                {/* LINE */}
                {i !== steps.length - 1 && (
                  <div
                    className={`flex-1 h-[2px] mx-2 transition-colors duration-300
                    ${step.id <= currentStep ? "bg-emerald-500" : "bg-white/10"}`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* STEP CARDS */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((step) => {
          const status = getStatus(step.id)
          const Icon = step.icon

          return (
            <motion.div
              key={step.id}
              whileHover={status !== "locked" ? { scale: 1.025, y: -2 } : {}}
              whileTap={status !== "locked" ? { scale: 0.985 } : {}}
              onClick={async () => {
                if (status === "locked") return
                // Video KYC start for partner
                if (step.id === 5) {
                  try {
                    const res = await fetch('/api/partner/video-kyc/start', { method: 'POST', credentials: 'include' })
                    if (!res.ok) {
                      console.error('KYC start returned', res.status)
                      // still navigate so partner sees waiting UI, but log error
                    }
                  } catch (err) {
                    console.error('Failed to request KYC start:', err)
                  }
                  router.push(step.route)
                  return
                }

                if (step.id === 6) {
                  setShowPricing(true)
                  return
                }
                if (step.route !== "#") router.push(step.route)
              }}
              className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[140px]
                ${status === "rejected"
                  ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10"
                  : status === "completed"
                    ? "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                    : status === "active"
                      ? "bg-white/10 border-white hover:bg-white/15"
                      : "bg-white/5 border-white/5 opacity-30 cursor-not-allowed"
                }
              `}
            >
              <div>
                {/* ICON */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl border transition-colors duration-300
                    ${status === "rejected"
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : status === "active"
                          ? "bg-white/10 text-white border-white/20"
                          : "bg-white/5 text-gray-500 border-white/5"
                    }
                  `}>
                    <Icon size={18} />
                  </div>

                  {/* BADGE ON TOP-RIGHT */}
                  <div>
                    {status === "completed" && (
                      <div className="w-5 h-5 flex items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30">
                        <CheckCircle2 size={12} className="text-black" />
                      </div>
                    )}

                    {status === "rejected" && (
                      <div className="w-5 h-5 flex items-center justify-center rounded-full bg-red-600 shadow-sm shadow-red-500/30 animate-bounce">
                        <XCircle size={12} className="text-white" />
                      </div>
                    )}

                    {status === "active" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-md shadow-white" />
                    )}
                  </div>
                </div>

                {/* TITLE */}
                <h3 className="text-xs font-semibold tracking-wide">
                  {step.title}
                </h3>

                {/* STATUS TEXT */}
                <p className="text-[10px] mt-1 text-gray-400 font-medium">
                  {status === "completed"
                    ? "Completed"
                    : status === "rejected"
                      ? "Rejected"
                      : status === "active"
                        ? "In Progress"
                        : "Locked"}
                </p>
              </div>

              {/* REJECTION MESSAGE IN CARD BODY */}
              {status === "rejected" && (
                <div className="mt-3 text-[9px] text-red-300/90 leading-normal bg-red-950/20 border border-red-500/10 p-2 rounded-xl text-left font-sans">
                  <span className="font-bold block text-red-400 mb-0.5">Feedback:</span>
                  {step.id === 1 && (vehicleReason || "Vehicle details rejected.")}
                  {step.id === 2 && (docsReason || "Documents rejected.")}
                  {step.id === 3 && (bankReason || "Bank details rejected.")}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* CONGRATULATIONS - YOU'RE LIVE! */}
      {isVerified && currentStep >= steps.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="max-w-3xl mx-auto mt-8"
        >
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-emerald-600/5 to-black border border-emerald-500/30 rounded-2xl p-6 text-center">
            
            {/* CONTENT */}
            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 mb-4 shadow-lg shadow-emerald-500/30"
              >
                <Rocket size={24} className="text-black" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-2xl font-extrabold text-white mb-2 tracking-tight"
              >
                Congratulations!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="text-emerald-300 text-base font-medium mb-1"
              >
                You're Live on NexRide!
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-gray-400 text-xs max-w-md mx-auto mb-4"
              >
                Your account is fully verified and active. Start accepting rides and earning with NexRide today!
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
                className="flex items-center justify-center gap-3"
              >
                <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Active</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span className="text-[10px] font-semibold text-gray-300">Verified Partner</span>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      <PricingModal
        isOpen={showPricing}
        onClose={() => setShowPricing(false)}
        onSuccess={() => {
          setShowPricing(false)
          window.location.reload()
        }}
      />
    </div>
  )
}