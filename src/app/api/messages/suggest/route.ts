import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Booking from '@/models/booking.model'
import Message from '@/models/message.model'
import Groq from 'groq-sdk'

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
})

// POST /api/messages/suggest — generate AI-suggested replies based on conversation context
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({}))
    const { bookingId, userRole } = body

    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDb()

        if (!bookingId) {
            return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
        }

        // Verify user is part of this booking
        const booking = await Booking.findById(bookingId)
            .populate('user', 'name')
            .populate('partner', 'name')
            .lean()

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        const sessionUser = session.user as { id: string; role: string }
        const isParticipant =
            String(booking.user._id) === sessionUser.id ||
            String(booking.partner?._id) === sessionUser.id

        if (!isParticipant) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch recent messages for context
        const recentMessages = await Message.find({ booking: bookingId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('sender', 'name role')
            .lean()

        const reversedMessages = [...recentMessages].reverse()

        // Build conversation context
        const conversationText = reversedMessages
            .map((m: any) => {
                const name = m.sender?.name || (m.senderRole === 'partner' ? 'Driver' : 'Passenger')
                return `${name} (${m.senderRole}): ${m.content}`
            })
            .join('\n')

        const role = userRole || sessionUser.role
        const otherParty = role === 'partner' ? 'passenger' : 'driver'
        const userName = role === 'partner'
            ? (booking.partner as any)?.name || 'Driver'
            : (booking.user as any)?.name || 'Passenger'
        const otherName = role === 'partner'
            ? (booking.user as any)?.name || 'Passenger'
            : (booking.partner as any)?.name || 'Driver'

        const vehicleType = booking.vehicleType || 'vehicle'
        const bookingStatus = booking.status || 'confirmed'

        const systemPrompt = `You are an AI assistant for a ride-hailing app called NexRide. You help ${role === 'partner' ? 'drivers' : 'passengers'} quickly reply to messages during rides.

Context:
- The user is ${userName} (${role === 'partner' ? 'driver' : 'passenger'})
- The other person is ${otherName} (${otherParty})
- Vehicle type: ${vehicleType}
- Ride status: ${bookingStatus}
- The ride is currently ${bookingStatus === 'confirmed' ? 'confirmed, driver is on the way or waiting' : bookingStatus === 'started' ? 'in progress' : 'completed'}

Generate exactly 4 short, natural quick-reply suggestions that the ${role === 'partner' ? 'driver' : 'passenger'} might want to send RIGHT NOW based on the conversation context. Each suggestion should be 1 sentence max, casual but polite, and relevant to the current conversation or ride situation.

Return ONLY a JSON array of 4 strings, no other text. Example: ["I'm 2 minutes away", "Waiting at the pickup point", "Traffic is heavy, running late", "Can you share your exact location?"]`

        const userPrompt = conversationText
            ? `Here's the recent conversation:\n${conversationText}\n\nGenerate 4 contextual quick-reply suggestions for the ${role === 'partner' ? 'driver' : 'passenger'}.`
            : `No messages yet. Generate 4 common opening messages a ${role === 'partner' ? 'driver' : 'passenger'} might send at the ${bookingStatus} stage of a ${vehicleType} ride.`

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: 'openai/gpt-oss-120b',
            temperature: 0.8,
            max_completion_tokens: 300,
            top_p: 1,
            stream: false,
        })

        const raw = chatCompletion.choices[0]?.message?.content || '[]'

        // Parse the JSON array from the response
        let suggestions: string[]
        try {
            // Try to extract a JSON array from the response
            const match = raw.match(/\[[\s\S]*\]/)
            suggestions = match ? JSON.parse(match[0]) : []
        } catch {
            // Fallback: split by newline and clean up
            suggestions = raw
                .split('\n')
                .filter((line: string) => line.trim() && !line.startsWith('```'))
                .map((line: string) => line.replace(/^[\d\-\.\)\s]+/, '').trim())
                .filter((line: string) => line.length > 0)
        }

        // Limit to 4 suggestions
        suggestions = suggestions.slice(0, 4)

        return NextResponse.json({ success: true, suggestions })
    } catch (error) {
        console.error('AI suggestions error:', error)
        // Return fallback suggestions if AI fails
        const fallback = userRole === 'partner'
            ? [
                "I'm on my way to pick you up",
                "I've arrived at the pickup location",
                "Running a few minutes late, sorry!",
                "Can you share your exact location?",
            ]
            : [
                "I'm at the pickup point",
                "How far away are you?",
                "I'll be ready in 2 minutes",
                "Can you call me when you arrive?",
            ]
        return NextResponse.json({ success: true, suggestions: fallback })
    }
}
