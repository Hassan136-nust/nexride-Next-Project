import { auth } from "@/auth"
import connectDb from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import User from "@/models/user.model"

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
        const { action, reason } = await req.json()

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json({ message: "Invalid action" }, { status: 400 })
        }

        const user = await User.findById(id)
        if (!user) {
            return NextResponse.json({ message: "Partner not found" }, { status: 404 })
        }

        if (action === "approve") {
            // Advance to pricing step
            if (user.partnerOnboardingSteps === 4) {
                user.partnerOnboardingSteps = 5
            }
            user.partnerRejectionReason = ""
        } else if (action === "reject") {
            if (!reason?.trim()) {
                return NextResponse.json({ message: "Rejection reason is required" }, { status: 400 })
            }
            user.partnerRejectionReason = reason
            // Keep on step 4 to force them to retry KYC, change status slightly so they know it's rejected
            user.partnerStatus = "rejected"
        }

        await user.save()

        return NextResponse.json({
            success: true,
            message: action === "approve" ? "Video KYC Approved" : "Video KYC Rejected",
        })
    } catch (error) {
        console.error("Partner KYC API error:", error)
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}
