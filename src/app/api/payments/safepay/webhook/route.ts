import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/db'
import Booking from '@/models/booking.model'

function verifySignature(rawBody: string, signature: string | null) {
    const secret = process.env.SAFEPAY_SECRET_KEY
    if (!secret) return false
    if (!signature) return false

    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
    const expectedBuffer = Buffer.from(expected)
    const signatureBuffer = Buffer.from(signature)
    return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
}

function findBookingId(payload: Record<string, unknown>) {
    const metadata = payload.metadata as Record<string, unknown> | undefined
    const order = payload.order as Record<string, unknown> | undefined

    return (
        payload.bookingId ||
        metadata?.bookingId ||
        payload.order_id ||
        order?.metadata && (order.metadata as Record<string, unknown>).bookingId
    )
}

function findTracker(payload: Record<string, unknown>) {
    const tracker = payload.tracker as Record<string, unknown> | string | undefined
    if (typeof tracker === 'string') return tracker
    return tracker?.token || payload.token || payload.tracker_token
}

function isPaidEvent(payload: Record<string, unknown>) {
    const values = [
        payload.status,
        payload.state,
        payload.event,
        payload.payment_status,
        payload.type,
    ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())

    return values.some((value) =>
        ['paid', 'succeeded', 'success', 'captured', 'completed', 'payment.succeeded'].includes(value)
    )
}

export async function POST(req: NextRequest) {
    const rawBody = await req.text()
    const signature = req.headers.get('x-sfpy-signature')

    if (!verifySignature(rawBody, signature)) {
        return NextResponse.json({ error: 'Invalid Safepay signature' }, { status: 400 })
    }

    let payload: Record<string, unknown>
    try {
        payload = JSON.parse(rawBody) as Record<string, unknown>
    } catch {
        return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 })
    }
    const bookingId = findBookingId(payload)
    const tracker = findTracker(payload)

    if (!bookingId && !tracker) {
        return NextResponse.json({ error: 'Booking reference missing' }, { status: 400 })
    }

    await connectDb()

    const query = bookingId ? { _id: bookingId } : { safepayTracker: tracker }
    const update = isPaidEvent(payload)
        ? {
            status: 'requested',
            paymentStatus: 'paid',
            safepayReference: String(payload.reference || payload.transaction_id || payload.id || ''),
        }
        : {
            paymentStatus: 'failed',
            status: 'cancelled',
        }

    await Booking.findOneAndUpdate(query, update)

    return NextResponse.json({ success: true })
}
