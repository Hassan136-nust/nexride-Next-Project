'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Send, MessageCircle, X, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import MessageBubble, { ChatMessage } from './MessageBubble'
import AISuggestions from './AISuggestions'
import { getSocket } from '@/lib/socket'

interface ChatSidebarProps {
    bookingId: string
    partnerName?: string
    partnerEmail?: string
    userRole: 'user' | 'partner'
    /** When true the sidebar is always visible (no toggle) */
    alwaysOpen?: boolean
}

export default function ChatSidebar({
    bookingId,
    partnerName,
    partnerEmail,
    userRole,
    alwaysOpen = true,
}: ChatSidebarProps) {
    const { data: session } = useSession()
    const currentUserId = (session?.user as any)?.id || ''

    const [isOpen, setIsOpen] = useState(alwaysOpen)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [unread, setUnread] = useState(0)

    // AI suggestions
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [suggestionsLoading, setSuggestionsLoading] = useState(false)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    // ── Fetch messages ──────────────────────────────────────
    const fetchMessages = useCallback(async () => {
        try {
            const res = await fetch(`/api/messages?bookingId=${bookingId}`, {
                cache: 'no-store',
            })
            if (!res.ok) throw new Error('Failed to load messages')
            const data = await res.json()
            setMessages(data.messages || [])
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load chat')
        } finally {
            setLoading(false)
        }
    }, [bookingId])

    // ── Fetch AI suggestions ────────────────────────────────
    const fetchSuggestions = useCallback(async () => {
        setSuggestionsLoading(true)
        try {
            const res = await fetch('/api/messages/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, userRole }),
            })
            if (res.ok) {
                const data = await res.json()
                setSuggestions(data.suggestions || [])
            }
        } catch {
            // Silently fail — suggestions are optional
        } finally {
            setSuggestionsLoading(false)
        }
    }, [bookingId, userRole])

    // ── Initial load + socket events ────────────────────────
    useEffect(() => {
        fetchMessages()
        fetchSuggestions()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId])

    // Socket listener (separate effect so isOpen changes don't re-trigger fetches)
    useEffect(() => {
        const socket = getSocket()
        if (!socket) return

        const handleNewMessage = (msg: ChatMessage) => {
            if (msg.booking !== bookingId) return
            setMessages((prev) => {
                if (prev.some((m) => m._id === msg._id)) return prev
                return [...prev, msg]
            })
            if (!isOpen && msg.senderRole !== userRole) {
                setUnread((prev) => prev + 1)
            }
        }

        socket.on('newMessage', handleNewMessage)
        return () => {
            socket.off('newMessage', handleNewMessage)
        }
    }, [bookingId, isOpen, userRole])

    // ── Auto-scroll on new messages ─────────────────────────
    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    // ── Poll for messages every 15 seconds (socket handles real-time) ──
    useEffect(() => {
        const iv = setInterval(fetchMessages, 15000)
        return () => clearInterval(iv)
    }, [fetchMessages])

    // ── Send message ────────────────────────────────────────
    const sendMessage = async (text: string, isAiSuggestion = false) => {
        if (!text.trim()) return
        setSending(true)
        setError('')
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    content: text.trim(),
                    isAiSuggestion,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to send')

            // Add locally for instant feedback
            setMessages((prev) => [...prev, data.message])
            setInput('')

            // Emit via socket for real-time delivery
            const socket = getSocket()
            if (socket) {
                socket.emit('sendMessage', {
                    bookingId,
                    message: data.message,
                })
            }

            // Don't auto-refresh AI suggestions — only on manual refresh to save API calls
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send message')
        } finally {
            setSending(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        sendMessage(input, false)
    }

    const handleSuggestionSelect = (text: string) => {
        setInput(text)
        // Small delay to let input populate, then send
        setTimeout(() => sendMessage(text, true), 100)
    }

    const handleOpen = () => {
        setIsOpen(true)
        setUnread(0)
    }

    const otherName = partnerName || (userRole === 'partner' ? 'Passenger' : 'Driver')

    // ── Toggle button (shown when sidebar is closed) ────────
    if (!alwaysOpen && !isOpen) {
        return (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={handleOpen}
                className='fixed bottom-24 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-xl hover:bg-sky-500 transition-all'
            >
                <MessageCircle size={22} />
                {unread > 0 && (
                    <span className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white'>
                        {unread}
                    </span>
                )}
            </motion.button>
        )
    }

    return (
        <div
            className={`flex flex-col h-full w-full bg-[#0A0A0A] ${
                alwaysOpen ? '' : 'fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-auto'
            }`}
        >
            {/* ── Header ── */}
            <div className='flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3'>
                <div className='flex items-center gap-2.5'>
                    <div className='flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400'>
                        <MessageCircle size={16} />
                    </div>
                    <div>
                        <p className='text-xs font-bold text-white'>{otherName}</p>
                        <p className='text-[9px] text-zinc-500'>
                            {partnerEmail || 'Ride chat'}
                        </p>
                    </div>
                </div>
                {!alwaysOpen && (
                    <button
                        type='button'
                        onClick={() => setIsOpen(false)}
                        className='p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 transition'
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* ── Messages area ── */}
            <div className='flex-1 overflow-y-auto no-scrollbar py-3 space-y-0.5'>
                {loading ? (
                    <div className='flex flex-col items-center justify-center h-full gap-2'>
                        <Loader2 size={18} className='animate-spin text-zinc-500' />
                        <p className='text-[10px] text-zinc-600'>Loading chat...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full gap-3 px-6 text-center'>
                        <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/[0.06]'>
                            <MessageCircle size={24} className='text-zinc-600' />
                        </div>
                        <div>
                            <p className='text-xs font-bold text-zinc-300'>No messages yet</p>
                            <p className='text-[10px] text-zinc-600 mt-1 leading-relaxed'>
                                Start a conversation with {otherName}. AI will suggest quick replies!
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMine = String(msg.sender?._id) === String(currentUserId)
                        const showName =
                            i === 0 || messages[i - 1]?.senderRole !== msg.senderRole
                        return (
                            <MessageBubble
                                key={msg._id}
                                message={msg}
                                isMine={isMine}
                                showName={showName}
                            />
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* ── Error display ── */}
            {error && (
                <div className='mx-3 mb-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-center text-[10px] font-semibold text-red-400'>
                    {error}
                </div>
            )}

            {/* ── AI Suggestions ── */}
            <AISuggestions
                suggestions={suggestions}
                loading={suggestionsLoading}
                onSelect={handleSuggestionSelect}
                onRefresh={fetchSuggestions}
            />

            {/* ── Input bar ── */}
            <form
                onSubmit={handleSubmit}
                className='flex shrink-0 items-center gap-2 border-t border-white/[0.06] bg-black/60 px-3 py-3'
            >
                <input
                    ref={inputRef}
                    type='text'
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder='Type a message...'
                    className='flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-[12px] text-white placeholder:text-zinc-600 outline-none focus:border-sky-500/30 focus:ring-1 focus:ring-sky-500/10 transition'
                    disabled={sending}
                />
                <button
                    type='submit'
                    disabled={sending || !input.trim()}
                    className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition disabled:opacity-40 disabled:cursor-not-allowed'
                >
                    {sending ? (
                        <Loader2 size={14} className='animate-spin' />
                    ) : (
                        <Send size={14} />
                    )}
                </button>
            </form>
        </div>
    )
}
