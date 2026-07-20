import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/db'
import Booking from '@/models/booking.model'

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const bookingId = url.searchParams.get('bookingId')
    const isMock = url.searchParams.get('mock') === 'true'

    if (isMock && bookingId) {
        // Fallback checkout mode — we update the DB here because webhook simulator won't reach outside the local network without ngrok
        await connectDb()
        await Booking.findByIdAndUpdate(bookingId, {
            status: 'requested',
            paymentStatus: 'paid',
            safepayReference: 'mock_sandbox_success',
        })
    }

    const redirect = new URL('/user/bookings', req.url)
    if (bookingId) redirect.searchParams.set('payment', 'processing')

    return NextResponse.redirect(redirect)
}
