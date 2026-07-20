import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import connectDb from '@/lib/db'
import User from '@/models/user.model'

export async function POST(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { lat, lng } = body

        if (
            typeof lat !== 'number' ||
            typeof lng !== 'number' ||
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 || lat > 90 ||
            lng < -180 || lng > 180
        ) {
            return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
        }

        const sessionUser = session.user as { id: string; role: string }

        if (sessionUser.role !== 'partner') {
            return NextResponse.json({ error: 'Only partners can update location' }, { status: 403 })
        }

        await connectDb()

        await User.findByIdAndUpdate(sessionUser.id, {
            $set: {
                location: {
                    type: 'Point',
                    coordinates: [lng, lat],
                },
                isOnline: true,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('partner location update error:', error)
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
    }
}
