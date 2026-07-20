import connectDb from "@/lib/db"
import { auth } from "@/auth"
import User from "@/models/user.model"
import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"

export async function POST(req: NextRequest) {
  try {
    await connectDb()

    const session = await auth()

    if (!session || !session.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { partnerId } = await req.json()

    if (!partnerId) {
      return NextResponse.json({ message: "Partner ID is required" }, { status: 400 })
    }

    // Find partner
    const partner = await User.findById(partnerId)

    if (!partner) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 })
    }

    if (partner.role !== "partner") {
      return NextResponse.json({ message: "User is not a partner" }, { status: 400 })
    }

    // If partner already has an assigned room (e.g., partner started the session), reuse it
    let roomId = partner.videoKycRoomId
    if (!roomId) {
      roomId = `kyc_${partnerId}_${randomBytes(8).toString("hex")}`
    }

    // Update partner's video KYC status and assign room (if not already set)
    const updatedPartner = await User.findByIdAndUpdate(
      partnerId,
      { 
        videoKycStatus: "in_progress",
        videoKycRoomId: roomId 
      },
      { new: true }
    )

    return NextResponse.json(
      { 
        message: "Video KYC started successfully", 
        partner: updatedPartner,
        roomId 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error starting video KYC:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
