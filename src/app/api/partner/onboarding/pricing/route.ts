import { auth } from "@/auth"
import connectDb from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import User from "@/models/user.model"
import Vehicle from "@/models/vehicles.model"

export async function POST(req: NextRequest) {
  try {
    await connectDb()

    const session = await auth()
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { baseFare, perKmFare, waitingFare } = await req.json()

    if (!baseFare || !perKmFare || !waitingFare) {
      return NextResponse.json({ error: "All pricing fields are required" }, { status: 400 })
    }

    const user = await User.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find user's vehicle
    const vehicle = await Vehicle.findOne({ owner: user._id })
    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    // Update vehicle pricing
    vehicle.baseFare = baseFare
    vehicle.perKmFare = perKmFare
    vehicle.waitingFare = waitingFare
    await vehicle.save()

    // Advance to step 6 (pricing submitted, waiting for admin review)
    if (user.partnerOnboardingSteps === 5) {
      user.partnerOnboardingSteps = 6
      await user.save()
    }

    return NextResponse.json({
      success: true,
      message: "Pricing submitted successfully"
    })
  } catch (error) {
    console.error("Pricing submission error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
