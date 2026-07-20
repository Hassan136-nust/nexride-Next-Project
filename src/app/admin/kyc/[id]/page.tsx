'use client'

import { useRef, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt'
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

interface ZegoInstance {
    destroy?: () => void
    joinRoom: (config: {
        container: HTMLDivElement
        scenario: {
            mode: unknown
        }
        showScreenSharingButton: boolean
        showPreJoinView: boolean
        turnOnMicrophoneWhenJoining: boolean
        turnOnCameraWhenJoining: boolean
    }) => void
}

interface StartKycResponse {
    roomId?: string
}

export default function AdminKycRoom() {
    const containerRef = useRef<HTMLDivElement>(null)

    const { id } = useParams<{ id: string }>()

    const router = useRouter()

    const [submitting, setSubmitting] = useState(false)

    const [rejectReason, setRejectReason] = useState('')

    const [showRejectInput, setShowRejectInput] =
        useState(false)

    useEffect(() => {
        const appId = Number(
            process.env.NEXT_PUBLIC_ZEGO_APP_ID
        )

        const serverSecret =
            process.env.NEXT_PUBLIC_ZEGO_SERVER_SECRET || ''

        let zpRef: ZegoInstance | null = null

        const startAndJoin = async () => {
            const container = containerRef.current

            if (!container) return

            let roomID = id

            try {
                const startRes = await fetch(
                    '/api/admin/video-kyc/start',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type': 'application/json',
                        },

                        body: JSON.stringify({
                            partnerId: id,
                        }),
                    }
                )

                if (startRes.ok) {
                    const jd: StartKycResponse =
                        await startRes.json()

                    if (jd?.roomId) {
                        roomID = jd.roomId
                    }
                } else {
                    console.warn(
                        'Failed to start KYC on server, falling back to partner id as room'
                    )
                }
            } catch (err) {
                console.error(
                    'Error starting KYC session:',
                    err
                )
            }

            const userID =
                'admin-' +
                Math.floor(Math.random() * 100000)

            const userName = 'NexRide Admin'

            const kitToken =
                ZegoUIKitPrebuilt.generateKitTokenForTest(
                    appId,
                    serverSecret,
                    roomID,
                    userID,
                    userName
                )

            const zp = ZegoUIKitPrebuilt.create(
                kitToken
            ) as ZegoInstance

            zpRef = zp

            zp.joinRoom({
                container: container,

                scenario: {
                    mode: ZegoUIKitPrebuilt.VideoConference,
                },

                showScreenSharingButton: false,
                showPreJoinView: true,
                turnOnMicrophoneWhenJoining: true,
                turnOnCameraWhenJoining: true,
            })
        }

        startAndJoin()

        return () => {
            if (
                zpRef &&
                typeof zpRef.destroy === 'function'
            ) {
                zpRef.destroy()
            }
        }
    }, [id])

    const handleAction = async (
        action: 'approve' | 'reject'
    ) => {
        if (
            action === 'reject' &&
            !rejectReason
        ) {
            return
        }

        setSubmitting(true)

        try {
            const res = await fetch(
                `/api/admin/reviews/partner/${id}/kyc`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json',
                    },

                    body: JSON.stringify({
                        action,
                        reason: rejectReason,
                    }),
                }
            )

            if (!res.ok) {
                throw new Error('API Error')
            }

            router.push('/')
        } catch (err) {
            console.error(err)

            alert('Failed to process KYC action')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className='flex h-screen bg-[#080808] text-white'>
            {/* LEFT: VIDEO FEED */}
            <div className='flex-1 relative'>
                <div
                    ref={containerRef}
                    className='w-full h-full'
                />
            </div>

            {/* RIGHT: ADMIN CONTROLS */}
            <div className='w-80 flex flex-col border-l border-white/10 shrink-0'>
                <header className='p-5 border-b border-white/10'>
                    <button
                        onClick={() => router.push('/')}
                        className='text-xs text-gray-400 hover:text-white flex items-center gap-1.5 mb-3 transition'
                    >
                        <ArrowLeft size={13} />
                        Back to Dashboard
                    </button>

                    <h2 className='text-lg font-bold'>
                        Video KYC Review
                    </h2>

                    <p className='text-xs text-gray-500 mt-1'>
                        Partner ID:{' '}
                        {id.slice(-8).toUpperCase()}
                    </p>
                </header>

                <div className='flex-1 p-5 overflow-y-auto space-y-5'>
                    <div className='p-4 bg-white/[0.03] rounded-xl border border-white/10'>
                        <h3 className='text-sm font-semibold mb-2'>
                            Instructions
                        </h3>

                        <ul className='text-xs text-gray-400 space-y-2 list-disc list-inside'>
                            <li>
                                Verify the partner&apos;s
                                identity matches their CNIC
                                profile.
                            </li>

                            <li>
                                Confirm their vehicle matches
                                the uploaded RC documents if
                                requested.
                            </li>

                            <li>
                                Ensure clear audio and
                                professional behavior.
                            </li>
                        </ul>
                    </div>
                </div>

                <div className='p-5 border-t border-white/10 bg-white/[0.02]'>
                    <AnimatePresence>
                        {showRejectInput && (
                            <div className='mb-4 space-y-2'>
                                <label className='text-xs font-semibold text-gray-300'>
                                    Rejection Reason
                                </label>

                                <textarea
                                    className='w-full bg-black border border-white/10 rounded-lg p-3 text-xs focus:border-red-500/50 outline-none resize-none'
                                    rows={3}
                                    placeholder='Why is the KYC rejected?'
                                    value={rejectReason}
                                    onChange={(e) =>
                                        setRejectReason(
                                            e.target.value
                                        )
                                    }
                                />

                                <div className='flex gap-2 pb-2'>
                                    <button
                                        onClick={() =>
                                            setShowRejectInput(
                                                false
                                            )
                                        }
                                        className='flex-1 py-2 rounded-lg border border-white/10 text-xs hover:bg-white/5'
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        onClick={() =>
                                            handleAction(
                                                'reject'
                                            )
                                        }
                                        disabled={
                                            !rejectReason ||
                                            submitting
                                        }
                                        className='flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs disabled:opacity-50'
                                    >
                                        Confirm Reject
                                    </button>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>

                    {!showRejectInput && (
                        <div className='flex flex-col gap-3'>
                            <button
                                onClick={() =>
                                    handleAction('approve')
                                }
                                disabled={submitting}
                                className='w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-50'
                            >
                                <CheckCircle size={16} />
                                Approve KYC
                            </button>

                            <button
                                onClick={() =>
                                    setShowRejectInput(true)
                                }
                                disabled={submitting}
                                className='w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition border border-red-500/20 disabled:opacity-50'
                            >
                                <XCircle size={16} />
                                Reject
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}