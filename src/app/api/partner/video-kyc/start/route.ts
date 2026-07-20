import connectDb from '@/lib/db'
import { auth } from '@/auth'
import User from '@/models/user.model'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    await connectDb()

    const session = await auth()

    if (!session || !session.user?.email || session.user.role !== 'partner') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const partnerId = session.user.id

    // Generate unique room ID for this KYC session
    const roomId = `kyc_${partnerId}_${randomBytes(8).toString('hex')}`

    const updatedPartner = await User.findByIdAndUpdate(
      partnerId,
      {
        videoKycStatus: 'in_progress',
        videoKycRoomId: roomId,
      },
      { new: true }
    )

    return NextResponse.json({ message: 'Video KYC started', roomId, partner: updatedPartner }, { status: 200 })
  } catch (error) {
    console.error('Error starting partner KYC:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
