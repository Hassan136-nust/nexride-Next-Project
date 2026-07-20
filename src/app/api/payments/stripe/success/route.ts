import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/db'
import Booking from '@/models/booking.model'
import { stripe } from '@/lib/stripe'

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')
    const bookingId = url.searchParams.get('bookingId')

    if (sessionId && bookingId) {
        try {
            // Verify the session is actually paid
            const session = await stripe.checkout.sessions.retrieve(sessionId)

            if (session.payment_status === 'paid') {
                await connectDb()
                // Only update payment status — booking status stays as-is (completed)
                await Booking.findByIdAndUpdate(bookingId, {
                    paymentStatus: 'paid',
                    stripeSessionId: sessionId,
                    stripePaymentIntentId: session.payment_intent as string || '',
                })
            }
        } catch (err) {
            console.error('[Stripe Success] Error verifying session:', err)
        }
    }

    const redirect = new URL('/user/bookings', req.url)
    redirect.searchParams.set('payment', 'success')
    return NextResponse.redirect(redirect)
}
