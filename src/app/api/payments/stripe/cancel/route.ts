import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const bookingId = url.searchParams.get('bookingId')

    // Redirect back to bookings page with a cancellation signal
    const redirect = new URL('/user/bookings', req.url)
    redirect.searchParams.set('payment', 'cancelled')
    if (bookingId) redirect.searchParams.set('bookingId', bookingId)
    return NextResponse.redirect(redirect)
}
