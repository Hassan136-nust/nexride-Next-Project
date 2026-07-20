import { auth } from "@/auth"
import connectDb from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import User from "@/models/user.model"
import Vehicle from "@/models/vehicles.model"
import PartnerDocs from "@/models/partnerDocs.model"
import PartnerBank from "@/models/partnerBank.model"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb()

    const session = await auth()
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const user = await User.findById(id)
    if (!user) {
      return NextResponse.json({ message: `DEBUG: Partner not found. Received ID: ${id}` }, { status: 404 })
    }

    // Move partner past the initial review stage → step 4 (Video KYC)
    // Not fully approved yet — more steps remain (KYC, pricing, final review)
    user.partnerStatus = "onboarding"
    user.isPartnerVerified = false
    user.role = "partner"
    user.partnerRejectionReason = ""

    if (user.partnerOnboardingSteps <= 3) {
      user.partnerOnboardingSteps = 4
    }

    await user.save()

    // Mark all sub-documents as approved/verified
    await Vehicle.updateOne(
      { owner: id },
      { $set: { status: "approved", rejectionReason: "" } }
    )
    await PartnerDocs.updateOne(
      { owner: id },
      { $set: { status: "approved", rejectionReason: "" } }
    )
    await PartnerBank.updateOne(
      { owner: id },
      { $set: { status: "verified", rejectionReason: "" } }
    )

    return NextResponse.json({
      success: true,
      message: "Initial review passed. Partner moved to Video KYC step.",
    })
  } catch (error) {
    console.error("Partner final approval error:", error)
    return NextResponse.json(
      { message: "Internal Server Error", detail: String(error) },
      { status: 500 }
    )
  }
}
