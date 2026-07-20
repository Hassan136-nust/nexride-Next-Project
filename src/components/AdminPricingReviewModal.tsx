'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Gauge, Clock, ShieldCheck, XCircle, AlertCircle, ZoomIn } from 'lucide-react'

type AdminPricingReviewModalProps = {
    isOpen: boolean
    onClose: () => void
    partnerId: string | null
    onSuccess: () => void
}

export default function AdminPricingReviewModal({ isOpen, onClose, partnerId, onSuccess }: AdminPricingReviewModalProps) {
    const [loading, setLoading] = useState(true)
    const [partnerData, setPartnerData] = useState<any>(null)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [showRejectForm, setShowRejectForm] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && partnerId) {
            setLoading(true)
            setError('')
            setPartnerData(null)
            setShowRejectForm(false)
            setRejectReason('')

            fetch(`/api/admin/reviews/partner/${partnerId}`)
                .then((res) => {
                    if (!res.ok) throw new Error('Failed to load partner review details')
                    return res.json()
                })
                .then((data) => {
                    setPartnerData(data)
                })
                .catch((err) => {
                    setError(err.message || 'Something went wrong')
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [isOpen, partnerId])

    const handleAction = async (action: 'approve' | 'reject') => {
        if (action === 'reject' && !rejectReason.trim()) {
            setError('Please provide a reason for rejection.')
            return
        }

        setSubmitting(true)
        setError('')
        try {
            const res = await fetch(`/api/admin/reviews/partner/${partnerId}/pricing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, reason: rejectReason }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.message || 'Action failed')
            }

            onSuccess()
            onClose()
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <React.Fragment>
                    {/* Lightbox for large vehicle photo */}
                    <AnimatePresence>
                        {lightboxUrl && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setLightboxUrl(null)}
                                className='fixed inset-0 bg-black/95 z-[120] flex items-center justify-center p-8 backdrop-blur-md'
                            >
                                <div className='relative max-w-3xl w-full' onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => setLightboxUrl(null)}
                                        className='absolute -top-12 right-0 text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition'
                                    >
                                        <X size={18} />
                                    </button>
                                    <img src={lightboxUrl} alt='vehicle high-res' className='w-full max-h-[80vh] object-contain rounded-2xl border border-white/10' />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className='fixed inset-0 bg-black/80 z-[100] backdrop-blur-sm'
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]'
                    >
                        {/* Header */}
                        <div className='flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#060606] shrink-0'>
                            <div>
                                <h3 className='text-sm font-semibold text-white flex items-center gap-2'>
                                    <DollarSign size={16} className='text-orange-400' /> Partner Pricing Fare Review
                                </h3>
                                <p className='text-[10px] text-gray-500 mt-0.5'>Review submitted prices and base fare configuration details</p>
                            </div>
                            <button onClick={onClose} className='text-gray-500 hover:text-white transition'>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content area */}
                        <div className='flex-1 overflow-y-auto p-6 space-y-5 min-h-0'>
                            {loading ? (
                                <div className='py-12 flex flex-col items-center gap-3 justify-center'>
                                    <div className='w-7 h-7 border-2 border-white/20 border-t-white rounded-full animate-spin' />
                                    <p className='text-xs text-gray-500'>Retrieving pricing plan details...</p>
                                </div>
                            ) : error && !partnerData ? (
                                <div className='py-8 text-center space-y-3'>
                                    <AlertCircle size={32} className='text-red-500 mx-auto' />
                                    <p className='text-xs text-red-400'>{error}</p>
                                </div>
                            ) : partnerData ? (
                                <React.Fragment>
                                    {error && (
                                        <div className='p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 shrink-0'>
                                            <AlertCircle size={14} className='shrink-0' />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    {/* Partner Info Details Row */}
                                    <div className='p-4 bg-white/[0.02] border border-white/10 rounded-xl space-y-2.5'>
                                        <div className='flex justify-between items-center text-xs text-gray-400'>
                                            <span className='font-semibold text-gray-300'>Partner Name</span>
                                            <span className='text-white font-medium'>{partnerData.user?.name}</span>
                                        </div>
                                        <div className='flex justify-between items-center text-xs text-gray-400'>
                                            <span className='font-semibold text-gray-300'>Partner Email</span>
                                            <span className='text-white font-medium'>{partnerData.user?.email}</span>
                                        </div>
                                    </div>

                                    {/* Vehicle Details & Vehicle Image Grid */}
                                    <div className='grid grid-cols-2 gap-4'>
                                        {/* Vehicle Text specs */}
                                        <div className='p-4 bg-white/[0.02] border border-white/10 rounded-xl flex flex-col justify-center space-y-2.5'>
                                            <div>
                                                <span className='text-[9px] uppercase tracking-wider text-gray-500 font-semibold block'>Vehicle Class</span>
                                                <span className='text-xs font-bold text-white capitalize'>{partnerData.vehicle?.type || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className='text-[9px] uppercase tracking-wider text-gray-500 font-semibold block'>Vehicle Model</span>
                                                <span className='text-xs font-bold text-white'>{partnerData.vehicle?.vehicleModel || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className='text-[9px] uppercase tracking-wider text-gray-500 font-semibold block'>License Plate</span>
                                                <span className='text-xs font-bold text-white'>{partnerData.vehicle?.number || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {/* Image Preview Box */}
                                        {partnerData.vehicle?.imageUrl ? (
                                            <div
                                                onClick={() => setLightboxUrl(partnerData.vehicle.imageUrl)}
                                                className='relative h-28 border border-white/10 rounded-xl overflow-hidden cursor-pointer group bg-black'
                                            >
                                                <img src={partnerData.vehicle.imageUrl} alt='vehicle' className='w-full h-full object-cover group-hover:scale-[1.03] transition duration-300' />
                                                <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center'>
                                                    <span className='flex items-center gap-1.5 text-[10px] bg-black/85 border border-white/15 px-3 py-1.5 rounded-full text-white font-semibold'>
                                                        <ZoomIn size={12} /> View Foto
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className='flex items-center justify-center border border-dashed border-white/15 rounded-xl h-28 text-[10px] text-gray-500 bg-white/[0.01]'>
                                                No Image Uploaded
                                            </div>
                                        )}
                                    </div>

                                    {/* Fares Specs grid */}
                                    <div className='grid grid-cols-3 gap-3 pt-1'>
                                        <div className='p-3 bg-white/[0.02] border border-white/10 rounded-xl text-center flex flex-col items-center justify-center'>
                                            <DollarSign size={14} className='text-orange-400 mb-1 shrink-0' />
                                            <span className='text-[8px] uppercase tracking-wider text-gray-500 font-semibold'>Base Fare</span>
                                            <span className='text-sm font-black text-white mt-1'>Rs. {partnerData.vehicle?.baseFare ?? 0}</span>
                                        </div>

                                        <div className='p-3 bg-white/[0.02] border border-white/10 rounded-xl text-center flex flex-col items-center justify-center'>
                                            <Gauge size={14} className='text-emerald-400 mb-1 shrink-0' />
                                            <span className='text-[8px] uppercase tracking-wider text-gray-500 font-semibold'>Per KM Fare</span>
                                            <span className='text-sm font-black text-white mt-1'>Rs. {partnerData.vehicle?.perKmFare ?? 0}</span>
                                        </div>

                                        <div className='p-3 bg-white/[0.02] border border-white/10 rounded-xl text-center flex flex-col items-center justify-center'>
                                            <Clock size={14} className='text-blue-400 mb-1 shrink-0' />
                                            <span className='text-[8px] uppercase tracking-wider text-gray-500 font-semibold'>Waiting Fare</span>
                                            <span className='text-sm font-black text-white mt-1'>Rs. {partnerData.vehicle?.waitingFare ?? 0}/m</span>
                                        </div>
                                    </div>

                                    {/* Reject Reason input form */}
                                    <AnimatePresence>
                                        {showRejectForm && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className='space-y-2'
                                            >
                                                <label className='text-xs font-semibold text-gray-300 block'>Reason for Rejection</label>
                                                <textarea
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    placeholder='E.g., Waiting fare is set way too high. Base fare must not exceed Rs. 200.'
                                                    rows={3}
                                                    className='w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-600 outline-none resize-none focus:border-orange-500 transition'
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </React.Fragment>
                            ) : null}
                        </div>

                        {/* Footer controls */}
                        {partnerData && (
                            <div className='px-6 py-4 border-t border-white/10 bg-[#060606] flex gap-3 shrink-0'>
                                {showRejectForm ? (
                                    <React.Fragment>
                                        <button
                                            onClick={() => setShowRejectForm(false)}
                                            className='flex-1 py-2.5 rounded-xl border border-white/10 text-xs text-gray-400 hover:text-white transition'
                                        >
                                            Back
                                        </button>
                                        <button
                                            disabled={submitting || !rejectReason.trim()}
                                            onClick={() => handleAction('reject')}
                                            className='flex-2 py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50'
                                        >
                                            {submitting ? 'Rejecting...' : 'Reject Fares'}
                                        </button>
                                    </React.Fragment>
                                ) : (
                                    <React.Fragment>
                                        <button
                                            onClick={() => setShowRejectForm(true)}
                                            className='flex-1 py-2.5 border border-red-500/20 hover:bg-red-500/[0.03] text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition'
                                        >
                                            <XCircle size={14} /> Reject Fares
                                        </button>
                                        <button
                                            disabled={submitting}
                                            onClick={() => handleAction('approve')}
                                            className='flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50'
                                        >
                                            <ShieldCheck size={14} /> Approve & Go Live
                                        </button>
                                    </React.Fragment>
                                )}
                            </div>
                        )}
                    </motion.div>
                </React.Fragment>
            )}
        </AnimatePresence>
    )
}
