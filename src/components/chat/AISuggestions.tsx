'use client'

import React from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface AISuggestionsProps {
    suggestions: string[]
    loading: boolean
    onSelect: (text: string) => void
    onRefresh: () => void
}

export default function AISuggestions({
    suggestions,
    loading,
    onSelect,
    onRefresh,
}: AISuggestionsProps) {
    return (
        <div className='border-t border-white/[0.06] bg-black/40 backdrop-blur-md'>
            {/* Header */}
            <div className='flex items-center justify-between px-3 py-2'>
                <div className='flex items-center gap-1.5'>
                    <Sparkles size={11} className='text-sky-400' />
                    <span className='text-[9px] font-bold uppercase tracking-wider text-sky-400'>
                        AI Suggestions
                    </span>
                </div>
                <button
                    type='button'
                    onClick={onRefresh}
                    disabled={loading}
                    className='p-1 rounded-md hover:bg-white/5 transition disabled:opacity-50'
                    title='Refresh suggestions'
                >
                    <RefreshCw
                        size={10}
                        className={`text-zinc-500 ${loading ? 'animate-spin' : ''}`}
                    />
                </button>
            </div>

            {/* Suggestion chips */}
            <div className='px-2 pb-2.5 flex flex-wrap gap-1.5'>
                {loading ? (
                    <>
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className='h-7 rounded-full bg-white/[0.04] animate-pulse'
                                style={{ width: `${60 + Math.random() * 60}px` }}
                            />
                        ))}
                    </>
                ) : (
                    <AnimatePresence mode='popLayout'>
                        {suggestions.map((text, i) => (
                            <motion.button
                                key={text + i}
                                initial={{ opacity: 0, scale: 0.9, y: 4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.05, duration: 0.15 }}
                                type='button'
                                onClick={() => onSelect(text)}
                                className='rounded-full border border-sky-500/20 bg-sky-500/[0.06] px-3 py-1.5 text-[10px] font-semibold text-sky-300 hover:bg-sky-500/15 hover:border-sky-500/30 transition-all active:scale-95 truncate max-w-[200px]'
                                title={text}
                            >
                                {text}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    )
}
