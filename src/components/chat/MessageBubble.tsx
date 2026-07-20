'use client'

import React from 'react'
import { Check, CheckCheck, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export interface ChatMessage {
    _id: string
    booking: string
    sender: { _id: string; name?: string; email?: string; role?: string }
    senderRole: 'user' | 'partner'
    content: string
    isAiSuggestion: boolean
    read: boolean
    createdAt: string
}

interface MessageBubbleProps {
    message: ChatMessage
    isMine: boolean
    showName?: boolean
}

export default function MessageBubble({ message, isMine, showName }: MessageBubbleProps) {
    const time = new Date(message.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    })

    const senderName =
        message.sender?.name ||
        (message.senderRole === 'partner' ? 'Driver' : 'Passenger')

    return (
        <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2 px-3`}
        >
            <div
                className={`relative max-w-[80%] rounded-2xl px-3.5 py-2 shadow-sm ${
                    isMine
                        ? 'bg-emerald-600 text-white rounded-br-md'
                        : 'bg-white/[0.08] text-zinc-100 border border-white/[0.06] rounded-bl-md'
                }`}
            >
                {/* Sender name (for received messages) */}
                {!isMine && showName && (
                    <p className={`text-[9px] font-bold mb-0.5 ${
                        message.senderRole === 'partner' ? 'text-sky-400' : 'text-amber-400'
                    }`}>
                        {senderName}
                    </p>
                )}

                {/* AI badge */}
                {message.isAiSuggestion && (
                    <div className='flex items-center gap-1 mb-1'>
                        <Sparkles size={8} className={isMine ? 'text-emerald-200' : 'text-sky-400'} />
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${
                            isMine ? 'text-emerald-200' : 'text-sky-400'
                        }`}>
                            AI Suggested
                        </span>
                    </div>
                )}

                {/* Message content */}
                <p className='text-[13px] leading-relaxed whitespace-pre-wrap break-words'>
                    {message.content}
                </p>

                {/* Time + read receipt */}
                <div className={`flex items-center gap-1 mt-1 ${
                    isMine ? 'justify-end' : 'justify-start'
                }`}>
                    <span className={`text-[9px] ${
                        isMine ? 'text-emerald-200/70' : 'text-zinc-500'
                    }`}>
                        {time}
                    </span>
                    {isMine && (
                        message.read
                            ? <CheckCheck size={10} className='text-emerald-200' />
                            : <Check size={10} className='text-emerald-200/50' />
                    )}
                </div>
            </div>
        </motion.div>
    )
}
