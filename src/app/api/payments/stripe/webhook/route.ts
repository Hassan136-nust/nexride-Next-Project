import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import connectDb from '@/lib/db'
import Booking from '@/models/booking.model'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
    const rawBody = await req.text()
    const sig = req.headers.get('stripe-signature')
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret || !sig) {
        console.error('[Stripe Webhook] Missing webhook secret or signature')
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
    } catch (err: any) {
        console.error('[Stripe Webhook] Signature verification failed:', err.message)
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`)

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session

        const bookingId = session.metadata?.bookingId
        if (!bookingId) {
            console.error('[Stripe Webhook] No bookingId in session metadata')
            return NextResponse.json({ error: 'Missing bookingId metadata' }, { status: 400 })
        }

        await connectDb()

        // Payment happens post-ride, so only update paymentStatus — leave booking status untouched
        await Booking.findByIdAndUpdate(bookingId, {
            paymentStatus: session.payment_status === 'paid' ? 'paid' : 'failed',
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string || '',
        })

        console.log(`[Stripe Webhook] Booking ${bookingId} paymentStatus updated`)
    }

    if (event.type === 'checkout.session.expired' || event.type === 'payment_intent.payment_failed') {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId
        if (bookingId) {
            await connectDb()
            // Only mark payment as failed — don't cancel the booking (ride is already completed)
            await Booking.findByIdAndUpdate(bookingId, {
                paymentStatus: 'failed',
            })
        }
    }

    return NextResponse.json({ received: true })
}
