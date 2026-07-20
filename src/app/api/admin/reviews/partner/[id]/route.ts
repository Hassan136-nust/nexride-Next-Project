import { auth } from "@/auth"
import connectDb from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import User from "@/models/user.model"
import Vehicle from "@/models/vehicles.model"
import PartnerDocs from "@/models/partnerDocs.model"
import PartnerBank from "@/models/partnerBank.model"

/* ─────────────────────────────────────────
   GET  /api/admin/reviews/partner/[id]
   Returns full partner submission details
───────────────────────────────────────── */
export async function GET(
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

    const user = await User.findById(id).lean()
    const vehicle = await Vehicle.findOne({ owner: id }).lean()
    const docs = await PartnerDocs.findOne({ owner: id }).lean()
    const bank = await PartnerBank.findOne({ owner: id }).lean()

    if (!user) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 })
    }

    return NextResponse.json({ user, vehicle, docs, bank })
  } catch (error) {
    console.error("Partner review GET error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}

/* ─────────────────────────────────────────
   POST  /api/admin/reviews/partner/[id]
   Body: { action: "approve" | "reject", reason?: string }
 ───────────────────────────────────────── */
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
    const body = await req.json()
    const { section, action, reason } = body as {
      section?: "vehicle" | "documents" | "bank"
      action: "approve" | "reject"
      reason?: string
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    if (action === "reject" && !reason?.trim()) {
      return NextResponse.json({ message: "Rejection reason is required" }, { status: 400 })
    }

    const user = await User.findById(id) as any
    if (!user) {
      return NextResponse.json({ message: "Partner not found" }, { status: 404 })
    }

    // Section-specific reviews
    if (section) {
      if (!["vehicle", "documents", "bank"].includes(section)) {
        return NextResponse.json({ message: "Invalid section" }, { status: 400 })
      }

      if (section === "vehicle") {
        await Vehicle.updateOne(
          { owner: id },
          { status: action === "approve" ? "approved" : "rejected", rejectionReason: action === "reject" ? reason : "" }
        )
      } else if (section === "documents") {
        await PartnerDocs.updateOne(
          { owner: id },
          { status: action === "approve" ? "approved" : "rejected", rejectionReason: action === "reject" ? reason : "" }
        )
      } else if (section === "bank") {
        await PartnerBank.updateOne(
          { owner: id },
          { status: action === "approve" ? "verified" : "rejected", rejectionReason: action === "reject" ? reason : "" }
        )
      }

      // If a section is rejected, also write to the user status & reason
      if (action === "reject") {
        user.partnerStatus = "rejected"
        user.partnerRejectionReason = `Rejected in ${section}: ${reason}`
        await user.save()
      } else {
        // If they approved a section, we can optionally clear general rejection reason if all are now valid,
        // but typically the overall status will be handled by the approve route.
      }

      return NextResponse.json({
        success: true,
        message: `${section} ${action === "approve" ? "approved" : "rejected"} successfully`,
      })
    }

    // Legacy fallback behavior / Global approve/reject
    if (action === "approve") {
      user.partnerStatus = "approved"
      user.isPartnerVerified = true
      user.role = "partner"
      user.partnerRejectionReason = ""

      // Approve all sub-entities
      await Vehicle.updateOne({ owner: id }, { status: "approved", rejectionReason: "" })
      await PartnerDocs.updateOne({ owner: id }, { status: "approved", rejectionReason: "" })
      await PartnerBank.updateOne({ owner: id }, { status: "verified", rejectionReason: "" })

    } else {
      user.partnerStatus = "rejected"
      user.isPartnerVerified = false
      user.partnerRejectionReason = reason ?? ""

      // Reject all sub-entities with the general reason
      await Vehicle.updateOne({ owner: id }, { status: "rejected", rejectionReason: reason ?? "" })
      await PartnerDocs.updateOne({ owner: id }, { status: "rejected", rejectionReason: reason ?? "" })
      await PartnerBank.updateOne({ owner: id }, { status: "rejected", rejectionReason: reason ?? "" })
    }

    await user.save()

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Partner approved successfully" : "Partner rejected",
    })
  } catch (error) {
    console.error("Partner review POST error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
