import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDb from '@/lib/db'
import Booking from '@/models/booking.model'
import { createStripeCheckoutSession } from '@/lib/stripe'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDb()

        const body = await req.json()
        const { bookingId } = body

        if (!bookingId) {
            return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
        }

        const booking = await Booking.findById(bookingId)

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Only allow payment for completed rides with pending card payment
        if (booking.status !== 'completed') {
            return NextResponse.json(
                { error: 'Payment is only available after the ride is completed' },
                { status: 400 }
            )
        }

        if (booking.paymentMethod !== 'card') {
            return NextResponse.json(
                { error: 'This booking was not set up for online payment' },
                { status: 400 }
            )
        }

        if (booking.paymentStatus === 'paid' && booking.stripeSessionId) {
            return NextResponse.json(
                { error: 'This booking has already been paid' },
                { status: 400 }
            )
        }

        // Charge totalFare (base fare + 5% platform fee)
        const chargeAmount = booking.totalFare || booking.estimatedFare
        const checkoutUrl = await createStripeCheckoutSession({
            amount: chargeAmount,
            currency: 'pkr',
            bookingId: booking._id.toString(),
        })

        return NextResponse.json({ success: true, checkoutUrl })
    } catch (error) {
        console.error('[Stripe Checkout] Error creating session:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
