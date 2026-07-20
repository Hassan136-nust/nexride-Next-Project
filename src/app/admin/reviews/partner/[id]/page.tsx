'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import logo from '../../../../../../public/logo.png'
import {
  ArrowLeft, Car, FileText, Landmark, User,
  CheckCircle, XCircle, ZoomIn, X, Clock,
  Hash, Gauge, CreditCard, Shield, AlertTriangle, DollarSign
} from 'lucide-react'

type PartnerData = {
  user: {
    _id: string
    name: string
    email: string
    partnerStatus: string
    partnerOnboardingSteps: number
    partnerRejectionReason?: string
  }
  vehicle: {
    type: string
    vehicleModel: string
    number: string
    imageUrl?: string
    baseFare?: number
    perKmFare?: number
    waitingFare?: number
    status: string
    rejectionReason?: string
  } | null
  docs: {
    CNIC_Url: string
    License_Url: string
    vehicle_rc: string
    status: string
    rejectionReason?: string
  } | null
  bank: {
    accountHolderName: string
    bankName: string
    ifscCode: string
    accountNumber: string
    status: string
    rejectionReason?: string
  } | null
}

type Section = 'vehicle' | 'documents' | 'bank'

export default function PartnerReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [data, setData] = useState<PartnerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectSection, setRejectSection] = useState<Section | null>(null)
  const [reason, setReason] = useState('')
  const [pricingSubmitting, setPricingSubmitting] = useState(false)
  const [pricingRejectReason, setPricingRejectReason] = useState('')
  const [showPricingReject, setShowPricingReject] = useState(false)

  const fetchPartner = async () => {
    try {
      const res = await fetch(`/api/admin/reviews/partner/${id}`)
      if (!res.ok) { setError('Failed to load partner data'); return }
      setData(await res.json())
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPartner() }, [id])

  const handleSectionAction = async (section: Section, action: 'approve' | 'reject', rejectReason?: string) => {
    if (action === 'reject' && !rejectReason?.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/reviews/partner/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, action, reason: rejectReason }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.message || 'Action failed'); return }
      setRejectOpen(false); setRejectSection(null); setReason('')
      await fetchPartner()
    } catch { setError('Something went wrong') }
    finally { setSubmitting(false) }
  }

  const handleFinalApprove = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/reviews/partner/${id}/approve`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.message || 'Final approval failed'); return }
      // Partner moves to KYC onboarding step - redirect admin back to dashboard
      router.push('/')
    } catch { setError('Something went wrong') }
    finally { setSubmitting(false) }
  }

  const handlePricingAction = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !pricingRejectReason.trim()) return
    setPricingSubmitting(true)
    try {
      const res = await fetch(`/api/admin/reviews/partner/${id}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: pricingRejectReason }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.message || 'Action failed'); return }
      setShowPricingReject(false)
      setPricingRejectReason('')
      router.push('/')
    } catch { setError('Something went wrong') }
    finally { setPricingSubmitting(false) }
  }

  /* ── LOADING ── */
  if (loading) return (
    <div className='h-screen bg-[#080808] flex items-center justify-center'>
      <div className='flex flex-col items-center gap-3'>
        <div className='w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin' />
        <p className='text-xs text-gray-500'>Loading...</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className='h-screen bg-[#080808] flex items-center justify-center'>
      <div className='text-center space-y-3'>
        <AlertTriangle size={36} className='text-red-500 mx-auto' />
        <p className='text-red-400 text-sm'>{error || 'Partner not found'}</p>
        <button onClick={() => router.push('/')} className='px-4 py-2 border border-white/10 rounded-xl text-xs text-white hover:bg-white/5 transition'>
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  const { user, vehicle, docs, bank } = data
  const isPricingReview = user.partnerOnboardingSteps === 6
  const allApproved =
    vehicle?.status === 'approved' &&
    docs?.status === 'approved' &&
    bank?.status === 'verified'

  const badge = (s: string) => {
    if (s === 'approved' || s === 'verified')
      return <span className='inline-flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full'><CheckCircle size={9} />Approved</span>
    if (s === 'rejected')
      return <span className='inline-flex items-center gap-1 text-[10px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full'><XCircle size={9} />Rejected</span>
    return <span className='inline-flex items-center gap-1 text-[10px] bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full'><Clock size={9} />Pending</span>
  }

  return (
    /* Full viewport, no scroll on the outer shell */
    <div className='h-screen bg-[#060606] text-white flex flex-col overflow-hidden'>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className='fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-8 backdrop-blur-md'
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className='relative max-w-3xl w-full'
            >
              <button onClick={() => setLightbox(null)}
                className='absolute -top-10 right-0 text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition'>
                <X size={16} />
              </button>
              <img src={lightbox} alt='preview' className='w-full max-h-[80vh] object-contain rounded-2xl border border-white/10' />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REJECT MODAL ── */}
      <AnimatePresence>
        {rejectOpen && rejectSection && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm'
          >
            <motion.div
              initial={{ scale: 0.93, y: 16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.93, y: 16, opacity: 0 }}
              className='bg-[#0d0d0d] border border-white/10 rounded-2xl p-5 w-full max-w-sm space-y-4'
            >
              <div>
                <h3 className='text-sm font-semibold capitalize'>Reject {rejectSection === 'bank' ? 'Bank Details' : rejectSection}</h3>
                <p className='text-xs text-gray-500 mt-0.5'>Partner will see this reason.</p>
              </div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='Reason for rejection...'
                rows={3}
                className='w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 outline-none resize-none focus:border-white/30 transition'
              />
              {!reason.trim() && <p className='text-[10px] text-red-400'>Reason is required.</p>}
              <div className='flex gap-2.5'>
                <button onClick={() => { setRejectOpen(false); setRejectSection(null); setReason('') }}
                  className='flex-1 py-2 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition'>
                  Cancel
                </button>
                <button
                  disabled={!reason.trim() || submitting}
                  onClick={() => handleSectionAction(rejectSection, 'reject', reason)}
                  className='flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-40 transition'>
                  {submitting ? 'Rejecting...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER (fixed height) ── */}
      <header className='shrink-0 h-12 flex items-center justify-between px-5 border-b border-white/[0.07] bg-[#060606]'>
        <div className='flex items-center gap-3'>
          <button onClick={() => router.push('/')}
            className='text-gray-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition'>
            <ArrowLeft size={14} />
          </button>
          <div className='w-6 h-6 rounded-md bg-white/10 text-white text-[10px] font-bold flex items-center justify-center'>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className='text-xs font-semibold'>{user.name}</span>
            <span className='text-[10px] text-gray-600 ml-2'>{user.email}</span>
          </div>
        </div>
        <div className='flex items-center gap-3'>
          {badge(user.partnerStatus)}
          <div className='h-3.5 w-px bg-white/10' />
          <Image src={logo} alt='NexRide' width={22} height={22} />
        </div>
      </header>

      {/* ── BODY: 3 or 4-column grid depends on step ── */}
      <div className={`flex-1 grid ${isPricingReview ? 'grid-cols-4' : 'grid-cols-3'} gap-0 overflow-hidden min-h-0`}>

        {/* ══ COL 1: VEHICLE ══ */}
        <motion.div
          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 }}
          className='border-r border-white/[0.07] flex flex-col overflow-hidden'
        >
          {/* col header */}
          <div className='shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02]'>
            <div className='flex items-center gap-1.5 text-xs font-semibold'>
              <Car size={13} className='text-gray-400' /> Vehicle
            </div>
            {vehicle && badge(vehicle.status)}
          </div>

          {vehicle ? (
            <div className='flex-1 flex flex-col overflow-hidden p-3 gap-3 min-h-0'>

              {/* Vehicle image — takes available space */}
              {vehicle.imageUrl && (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setLightbox(vehicle.imageUrl!)}
                  className='relative rounded-xl overflow-hidden cursor-pointer group flex-1 min-h-0 bg-white/5 border border-white/[0.07]'
                >
                  <img src={vehicle.imageUrl} alt='vehicle' className='w-full h-full object-cover group-hover:scale-105 transition duration-300' />
                  <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center'>
                    <span className='flex items-center gap-1 text-[10px] bg-black/70 border border-white/10 px-2.5 py-1 rounded-full text-gray-300'>
                      <ZoomIn size={11} /> View
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Info tiles */}
              <div className='shrink-0 grid grid-cols-2 gap-1.5'>
                <Tile icon={<Car size={10} />} label='Type' value={vehicle.type} />
                <Tile icon={<Car size={10} />} label='Model' value={vehicle.vehicleModel} />
                <Tile icon={<Hash size={10} />} label='Plate' value={vehicle.number} />
                <Tile icon={<Gauge size={10} />} label='Fare' value={`Rs.${vehicle.baseFare ?? 0}`} />
              </div>

              {vehicle.status === 'rejected' && vehicle.rejectionReason && <RejNote reason={vehicle.rejectionReason} />}

              {vehicle.status === 'pending' && (
                <ActionBar
                  onApprove={() => handleSectionAction('vehicle', 'approve')}
                  onReject={() => { setRejectSection('vehicle'); setRejectOpen(true) }}
                  submitting={submitting}
                />
              )}
            </div>
          ) : <Empty label='vehicle' />}
        </motion.div>

        {/* ══ COL 2: DOCUMENTS ══ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}
          className='border-r border-white/[0.07] flex flex-col overflow-hidden'
        >
          <div className='shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02]'>
            <div className='flex items-center gap-1.5 text-xs font-semibold'>
              <FileText size={13} className='text-gray-400' /> Documents
            </div>
            {docs && badge(docs.status)}
          </div>

          {docs ? (
            <div className='flex-1 flex flex-col overflow-hidden p-3 gap-2 min-h-0'>

              {/* 3 doc images — each takes equal flex space */}
              {[
                { label: 'CNIC', url: docs.CNIC_Url },
                { label: 'Driving License', url: docs.License_Url },
                { label: 'Vehicle RC', url: docs.vehicle_rc },
              ].map((doc, i) => (
                <motion.div
                  key={doc.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className='flex-1 min-h-0 flex flex-col gap-1'
                >
                  <p className='shrink-0 text-[9px] text-gray-600 uppercase tracking-widest'>{doc.label}</p>
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setLightbox(doc.url)}
                    className='flex-1 min-h-0 relative rounded-xl overflow-hidden cursor-pointer group bg-white/5 border border-white/[0.07]'
                  >
                    <img src={doc.url} alt={doc.label} className='w-full h-full object-cover group-hover:scale-105 transition duration-300' />
                    <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center'>
                      <ZoomIn size={14} className='text-white' />
                    </div>
                  </motion.div>
                </motion.div>
              ))}

              {docs.status === 'rejected' && docs.rejectionReason && <RejNote reason={docs.rejectionReason} />}

              {docs.status === 'pending' && (
                <ActionBar
                  onApprove={() => handleSectionAction('documents', 'approve')}
                  onReject={() => { setRejectSection('documents'); setRejectOpen(true) }}
                  submitting={submitting}
                />
              )}
            </div>
          ) : <Empty label='documents' />}
        </motion.div>

        {/* ══ COL 3: BANK + PARTNER INFO + FINAL ACTION ══ */}
        <motion.div
          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className='flex flex-col overflow-hidden'
        >
          {/* Partner info strip */}
          <div className='shrink-0 px-4 py-3 border-b border-white/[0.07] bg-white/[0.02]'>
            <div className='flex items-center gap-2'>
              <div className='w-7 h-7 rounded-lg bg-white/10 text-white text-xs font-bold flex items-center justify-center shrink-0'>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className='min-w-0'>
                <p className='text-xs font-semibold truncate'>{user.name}</p>
                <p className='text-[9px] text-gray-600 truncate'>{user.email}</p>
              </div>
              <div className='ml-auto shrink-0 text-[9px] text-gray-600 font-mono'>
                #{user._id.slice(-6).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Bank section header */}
          <div className='shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07]'>
            <div className='flex items-center gap-1.5 text-xs font-semibold'>
              <Landmark size={13} className='text-gray-400' /> Bank Details
            </div>
            {bank && badge(bank.status)}
          </div>

          {/* Bank content */}
          {bank ? (
            <div className='shrink-0 p-3 space-y-1.5 border-b border-white/[0.07]'>
              <div className='grid grid-cols-2 gap-1.5'>
                <Tile icon={<User size={10} />} label='Holder' value={bank.accountHolderName} />
                <Tile icon={<Landmark size={10} />} label='Bank' value={bank.bankName} />
                <Tile icon={<Hash size={10} />} label='IFSC' value={bank.ifscCode} />
                <Tile icon={<CreditCard size={10} />} label='Acc No.' value={bank.accountNumber} />
              </div>
              {bank.status === 'rejected' && bank.rejectionReason && <RejNote reason={bank.rejectionReason} />}
              {bank.status === 'added' && (
                <ActionBar
                  onApprove={() => handleSectionAction('bank', 'approve')}
                  onReject={() => { setRejectSection('bank'); setRejectOpen(true) }}
                  submitting={submitting}
                />
              )}
            </div>
          ) : <div className='shrink-0 px-4 py-3 text-[10px] text-gray-600'>No bank data.</div>}

          {/* Spacer */}
          <div className='flex-1' />

          {/* Final action area */}
          <div className='shrink-0 p-3 border-t border-white/[0.07]'>
            {allApproved ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className='bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-2.5'
              >
                <div className='flex items-center gap-2'>
                  <CheckCircle size={14} className='text-emerald-400 shrink-0' />
                  <div>
                    <p className='text-xs font-semibold text-emerald-400'>All sections approved</p>
                    <p className='text-[10px] text-gray-500'>Pass review to move to Video KYC</p>
                  </div>
                </div>
                <button
                  disabled={submitting}
                  onClick={handleFinalApprove}
                  className='w-full py-2 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition disabled:opacity-50'
                >
                  {submitting ? 'Approving...' : 'Pass Review & Continue'}
                </button>
              </motion.div>
            ) : (
              <div className='flex items-center gap-2 bg-white/[0.02] border border-white/[0.07] rounded-xl px-3 py-2.5'>
                <Shield size={13} className='text-gray-600 shrink-0' />
                <p className='text-[10px] text-gray-600'>Review all sections to enable final approval</p>
              </div>
            )}

            {user.partnerStatus === 'rejected' && user.partnerRejectionReason && (
              <div className='mt-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2'>
                <p className='text-[10px] text-red-400 font-medium'>Rejected:</p>
                <p className='text-[10px] text-red-300/70 mt-0.5 leading-relaxed'>{user.partnerRejectionReason}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ══ COL 4 (Pricing) — only shown for step 6 ══ */}
        {isPricingReview && vehicle && (
          <motion.div
            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.11 }}
            className='flex flex-col overflow-hidden'
          >
            <div className='shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02]'>
              <div className='flex items-center gap-1.5 text-xs font-semibold'>
                <DollarSign size={13} className='text-gray-400' /> Pricing
              </div>
              <span className='inline-flex items-center gap-1 text-[10px] bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full'>
                <Clock size={9} />Pending Review
              </span>
            </div>

            <div className='flex-1 overflow-y-auto p-3 space-y-3'>
              {vehicle.imageUrl && (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setLightbox(vehicle.imageUrl!)}
                  className='relative rounded-xl overflow-hidden cursor-pointer group h-28 bg-white/5 border border-white/[0.07]'
                >
                  <img src={vehicle.imageUrl} alt='vehicle' className='w-full h-full object-cover group-hover:scale-105 transition duration-300' />
                  <div className='absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center'>
                    <span className='flex items-center gap-1 text-[10px] bg-black/70 border border-white/10 px-2.5 py-1 rounded-full text-gray-300'>
                      <ZoomIn size={11} /> View
                    </span>
                  </div>
                </motion.div>
              )}

              <div className='grid grid-cols-1 gap-1.5'>
                <Tile icon={<DollarSign size={10} />} label='Base Fare' value={`Rs. ${vehicle.baseFare ?? 0}`} />
                <Tile icon={<Gauge size={10} />} label='Per KM Fare' value={`Rs. ${vehicle.perKmFare ?? 0} / km`} />
                <Tile icon={<Clock size={10} />} label='Waiting Fare' value={`Rs. ${vehicle.waitingFare ?? 0} / min`} />
              </div>
            </div>

            <div className='shrink-0 p-3 border-t border-white/[0.07] space-y-2'>
              {showPricingReject ? (
                <>
                  <textarea
                    rows={3}
                    value={pricingRejectReason}
                    onChange={e => setPricingRejectReason(e.target.value)}
                    placeholder='Reason for rejection...'
                    className='w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 outline-none resize-none focus:border-white/30 transition'
                  />
                  {!pricingRejectReason.trim() && <p className='text-[10px] text-red-400'>Reason is required.</p>}
                  <div className='flex gap-2'>
                    <button onClick={() => setShowPricingReject(false)} className='flex-1 py-1.5 rounded-lg border border-white/10 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition'>Cancel</button>
                    <button disabled={!pricingRejectReason.trim() || pricingSubmitting} onClick={() => handlePricingAction('reject')} className='flex-1 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 disabled:opacity-40 transition'>
                      {pricingSubmitting ? 'Rejecting...' : 'Confirm Reject'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    disabled={pricingSubmitting}
                    onClick={() => handlePricingAction('approve')}
                    className='w-full py-2 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-1'
                  >
                    <CheckCircle size={10} /> Approve Pricing
                  </button>
                  <button
                    onClick={() => setShowPricingReject(true)}
                    className='w-full py-2 rounded-lg border border-red-500/20 text-red-400 text-[10px] font-semibold hover:bg-red-500/5 transition flex items-center justify-center gap-1'
                  >
                    <XCircle size={10} /> Reject
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  )
}

/* ── TILE ── */
function Tile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className='flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-2'>
      <span className='text-gray-600 shrink-0'>{icon}</span>
      <div className='min-w-0'>
        <p className='text-[8px] text-gray-600 uppercase tracking-widest leading-none'>{label}</p>
        <p className='text-[11px] font-medium text-gray-200 truncate mt-0.5'>{value}</p>
      </div>
    </div>
  )
}

/* ── ACTION BAR ── */
function ActionBar({ onApprove, onReject, submitting }: {
  onApprove: () => void; onReject: () => void; submitting: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className='flex gap-2 pt-1'
    >
      <button onClick={onReject}
        className='flex-1 py-1.5 rounded-lg border border-red-500/20 text-red-400 text-[10px] font-semibold hover:bg-red-500/5 transition flex items-center justify-center gap-1'>
        <XCircle size={10} /> Reject
      </button>
      <button disabled={submitting} onClick={onApprove}
        className='flex-1 py-1.5 rounded-lg bg-emerald-500 text-black text-[10px] font-bold hover:bg-emerald-400 transition disabled:opacity-50 flex items-center justify-center gap-1'>
        <CheckCircle size={10} /> {submitting ? '...' : 'Approve'}
      </button>
    </motion.div>
  )
}

/* ── REJECTION NOTE ── */
function RejNote({ reason }: { reason: string }) {
  return (
    <div className='bg-red-500/5 border border-red-500/10 rounded-lg px-2.5 py-2 text-[10px] text-red-300/80'>
      <span className='font-semibold text-red-400'>Reason: </span>{reason}
    </div>
  )
}

/* ── EMPTY ── */
function Empty({ label }: { label: string }) {
  return (
    <div className='flex-1 flex flex-col items-center justify-center text-center p-4'>
      <Shield size={20} className='text-gray-700 mb-1.5' />
      <p className='text-[10px] text-gray-600'>No {label} data.</p>
    </div>
  )
}
