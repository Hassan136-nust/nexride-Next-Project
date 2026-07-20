import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/db'
import Booking from '@/models/booking.model'

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const bookingId = url.searchParams.get('bookingId')

    if (bookingId) {
        await connectDb()
        await Booking.findByIdAndUpdate(bookingId, {
            status: 'cancelled',
            paymentStatus: 'failed',
        })
    }

    const redirect = new URL('/user/bookings', req.url)
    redirect.searchParams.set('payment', 'cancelled')
    return NextResponse.redirect(redirect)
}
