import Stripe from 'stripe'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

if (!STRIPE_SECRET_KEY) {
    console.warn('[Stripe] STRIPE_SECRET_KEY is not set. Payments will not work.')
}

export const stripe = new Stripe(STRIPE_SECRET_KEY || '', {
    apiVersion: "2026-05-27.dahlia",
})

/**
 * Creates a Stripe Checkout Session and returns the redirect URL.
 */
export async function createStripeCheckoutSession({
    amount,
    currency = 'pkr',
    bookingId,
}: {
    amount: number
    currency?: string
    bookingId: string
}): Promise<string> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (!STRIPE_SECRET_KEY) {
        throw new Error('Stripe secret key is not configured.')
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency,
                    product_data: {
                        name: 'NexRide Booking',
                        description: `Booking ID: ${bookingId}`,
                    },
                    unit_amount: Math.round(amount * 100), // in paisa/cents
                },
                quantity: 1,
            },
        ],
        metadata: {
            bookingId,
        },
        success_url: `${appUrl}/api/payments/stripe/success?session_id={CHECKOUT_SESSION_ID}&bookingId=${bookingId}`,
        cancel_url: `${appUrl}/api/payments/stripe/cancel?bookingId=${bookingId}`,
    })

    if (!session.url) {
        throw new Error('Stripe did not return a checkout URL.')
    }

    return session.url
}
