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

        const sessionUser = session.user as { id: string; role: string }

        if (sessionUser.role !== 'partner') {
            return NextResponse.json({ error: 'Only partners can go offline' }, { status: 403 })
        }

        await connectDb()

        await User.findByIdAndUpdate(sessionUser.id, {
            $set: {
                isOnline: false,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('partner offline update error:', error)
        return NextResponse.json({ error: 'Failed to update online status' }, { status: 500 })
    }
}
