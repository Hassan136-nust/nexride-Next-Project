import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Message from '@/models/message.model'
import Booking from '@/models/booking.model'

// GET /api/messages?bookingId=xxx  — fetch all messages for a booking
export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDb()

        const url = new URL(req.url)
        const bookingId = url.searchParams.get('bookingId')

        if (!bookingId) {
            return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
        }

        // Verify the user is part of this booking
        const booking = await Booking.findById(bookingId).lean()
        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        const sessionUser = session.user as { id: string; role: string }
        const userId = sessionUser.id
        const isParticipant =
            String(booking.user) === userId ||
            String(booking.partner) === userId ||
            sessionUser.role === 'admin'

        if (!isParticipant) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const messages = await Message.find({ booking: bookingId })
            .populate('sender', 'name email role')
            .sort({ createdAt: 1 })
            .lean()

        // Mark unread messages as read (messages sent by the OTHER party)
        const senderRole = sessionUser.role === 'partner' ? 'partner' : 'user'
        await Message.updateMany(
            {
                booking: bookingId,
                senderRole: { $ne: senderRole },
                read: false,
            },
            { $set: { read: true } }
        )

        return NextResponse.json({ success: true, messages })
    } catch (error) {
        console.error('Get messages error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST /api/messages  — send a new message
export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDb()

        const body = await req.json()
        const { bookingId, content, isAiSuggestion } = body

        if (!bookingId || !content?.trim()) {
            return NextResponse.json({ error: 'bookingId and content are required' }, { status: 400 })
        }

        // Verify the booking exists and user is a participant
        const booking = await Booking.findById(bookingId).lean()
        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        const sessionUser = session.user as { id: string; role: string }
        const userId = sessionUser.id
        const isParticipant =
            String(booking.user) === userId || String(booking.partner) === userId

        if (!isParticipant) {
            return NextResponse.json({ error: 'Forbidden — not part of this booking' }, { status: 403 })
        }

        // Only allow chat for active bookings
        const chatAllowedStatuses = ['confirmed', 'started', 'completed']
        if (!chatAllowedStatuses.includes(booking.status)) {
            return NextResponse.json(
                { error: 'Chat is only available during an active ride' },
                { status: 400 }
            )
        }

        const senderRole = sessionUser.role === 'partner' ? 'partner' : 'user'

        const message = await Message.create({
            booking: bookingId,
            sender: userId,
            senderRole,
            content: content.trim(),
            isAiSuggestion: isAiSuggestion || false,
        })

        const populated = await Message.findById(message._id)
            .populate('sender', 'name email role')
            .lean()

        return NextResponse.json({ success: true, message: populated })
    } catch (error) {
        console.error('Send message error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
