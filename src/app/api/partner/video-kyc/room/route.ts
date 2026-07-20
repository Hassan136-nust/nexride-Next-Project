import connectDb from "@/lib/db"
import { auth } from "@/auth"
import User from "@/models/user.model"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    await connectDb()

    const session = await auth()

    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Find user by email
    const user = await User.findOne({ email: session.user.email }).select(
      "videoKycStatus videoKycRoomId videoKycRejectionReason role"
    )

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Only partners can access this route
    if (user.role !== "partner") {
      return NextResponse.json({ message: "Only partners can access KYC room" }, { status: 403 })
    }

    // Check if KYC is in progress
    if (user.videoKycStatus !== "in_progress" || !user.videoKycRoomId) {
      return NextResponse.json(
        { 
          message: "No active KYC session", 
          videoKycStatus: user.videoKycStatus 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        roomId: user.videoKycRoomId,
        videoKycStatus: user.videoKycStatus,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error getting KYC room:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
