import connectDb from "@/lib/db"
import { auth } from "@/auth"
import User from "@/models/user.model"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    await connectDb()

    const session = await auth()

    if (!session || !session.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { partnerId, status, rejectionReason } = await req.json()

    if (!partnerId || !status) {
      return NextResponse.json({ message: "Partner ID and status are required" }, { status: 400 })
    }

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ message: "Status must be 'approved' or 'rejected'" }, { status: 400 })
    }

    // Find partner
    const partner = await User.findById(partnerId)

    if (!partner) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 })
    }

    // Update partner status
    const updateData: any = {
      videoKycStatus: status,
      videoKycRoomId: "", // Clear the room ID
    }

    if (status === "rejected" && rejectionReason) {
      updateData.videoKycRejectionReason = rejectionReason
    }

    const updatedPartner = await User.findByIdAndUpdate(
      partnerId,
      updateData,
      { new: true }
    )

    return NextResponse.json(
      { 
        message: `Video KYC ${status} successfully`, 
        partner: updatedPartner 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error completing video KYC:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
