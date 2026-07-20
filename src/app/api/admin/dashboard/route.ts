import { auth } from "@/auth"
import connectDb from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"
import User from "@/models/user.model"
import Vehicle from "@/models/vehicles.model"
import Booking from "@/models/booking.model"

export async function GET(req: NextRequest) {
  try {
    await connectDb()

    const session = await auth()

    if (!session || !session.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Fully approved = admin reviewed AND all remaining steps completed (isPartnerVerified = true)
    const totalApprovedPartners = await User.countDocuments({ partnerStatus: "approved", isPartnerVerified: true })
    const totalRejectedPartners = await User.countDocuments({ partnerStatus: "rejected" })

    // Pending = waiting for admin step-3 review OR in "onboarding" (admin approved, still doing KYC/pricing etc.)
    const pendingFilter = {
      $or: [
        { partnerStatus: "pending" },
        { partnerStatus: "onboarding" },
        { partnerOnboardingSteps: { $gte: 3 }, partnerStatus: { $nin: ["approved", "rejected", "onboarding"] as const } }
      ]
    } as any

    const totalPendingPartners = await User.countDocuments(pendingFilter)
    const totalPartners = totalApprovedPartners + totalPendingPartners + totalRejectedPartners

    // Fetch partners needing admin review (step 3 done, not yet reviewed)
    const reviewFilter = {
      $or: [
        { partnerStatus: "pending" },
        { partnerOnboardingSteps: { $gte: 3 }, partnerStatus: { $nin: ["approved", "rejected", "onboarding"] as const } }
      ]
    } as any

    const pendingPartnerUsers = await User.find(reviewFilter).lean()

    const partnerIds = pendingPartnerUsers.map((p) => p._id)

    const partnerVehicles = await Vehicle.find({ owner: { $in: partnerIds } }).lean()

    const vehicleTypeMap = new Map(
      partnerVehicles.map((v) => [String(v.owner), v.type])
    )

    const pendingPartnerReviews = pendingPartnerUsers.map((p) => ({
      _id: String(p._id),
      name: p.name,
      email: p.email,
      vehicleType: vehicleTypeMap.get(String(p._id)) ?? null,
      partnerOnboardingSteps: p.partnerOnboardingSteps,
    }))

    // Fetch partners waiting for KYC:
    const kycUsers = await User.find({ partnerStatus: "onboarding", partnerOnboardingSteps: 4 }).lean()

    const kycReviews = kycUsers.map((p) => ({
      _id: String(p._id),
      name: p.name,
      email: p.email,
      vehicleType: vehicleTypeMap.get(String(p._id)) ?? null,
      partnerOnboardingSteps: p.partnerOnboardingSteps,
    }))

    // Fetch partners waiting for Pricing review (step 6):
    const pricingUsers = await User.find({ partnerStatus: "onboarding", partnerOnboardingSteps: 6 }).lean()

    const pricingReviews = pricingUsers.map((p) => ({
      _id: String(p._id),
      name: p.name,
      email: p.email,
      vehicleType: vehicleTypeMap.get(String(p._id)) ?? null,
      partnerOnboardingSteps: p.partnerOnboardingSteps,
    }))

    // Pending vehicles (not yet approved)
    const pendingVehiclesCount = await Vehicle.countDocuments({ status: "pending" })

    // ── Ride & Earnings Statistics ────────────────────────────────────────────────
    const totalRides = await Booking.countDocuments({})
    const completedRides = await Booking.countDocuments({ status: 'completed' })
    const cancelledRides = await Booking.countDocuments({ status: { $in: ['cancelled', 'rejected'] } })
    const activeRides = await Booking.countDocuments({ status: { $in: ['requested', 'confirmed', 'started'] } })

    // Aggregate earnings from completed rides
    const earningsAgg = await Booking.aggregate([
        { $match: { status: 'completed' } },
        {
            $group: {
                _id: null,
                totalPlatformFees: { $sum: { $ifNull: ['$platformFee', 0] } },
                totalPartnerPayouts: { $sum: { $ifNull: ['$partnerEarning', 0] } },
                totalRevenue: { $sum: { $ifNull: ['$totalFare', '$estimatedFare'] } },
            }
        }
    ])

    const earnings = earningsAgg[0] || { totalPlatformFees: 0, totalPartnerPayouts: 0, totalRevenue: 0 }

    // Recent bookings (last 20)
    const recentBookings = await Booking.find({})
        .populate('user', 'name email')
        .populate('partner', 'name email')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()

    const recentBookingsList = recentBookings.map((b: any) => ({
        _id: String(b._id),
        userName: b.user?.name || 'Unknown',
        userEmail: b.user?.email || '',
        partnerName: b.partner?.name || 'Unassigned',
        partnerEmail: b.partner?.email || '',
        vehicleType: b.vehicleType,
        status: b.status,
        paymentMethod: b.paymentMethod,
        paymentStatus: b.paymentStatus,
        totalFare: b.totalFare || b.estimatedFare,
        platformFee: b.platformFee || 0,
        partnerEarning: b.partnerEarning || 0,
        distanceKm: b.distanceKm,
        createdAt: b.createdAt,
    }))

    // Total customers count (role 'user' = customer)
    const totalCustomers = await User.countDocuments({ role: 'user' })

    return NextResponse.json({
      totalPartners,
      totalApprovedPartners,
      totalPendingPartners,
      totalRejectedPartners,
      pendingPartnerReviews,
      kycReviews,
      pricingReviews,
      pendingVehiclesCount,
      // Ride stats
      totalRides,
      completedRides,
      cancelledRides,
      activeRides,
      totalCustomers,
      // Earnings
      adminEarnings: earnings.totalPlatformFees,
      totalPartnerPayouts: earnings.totalPartnerPayouts,
      totalRevenue: earnings.totalRevenue,
      // Recent bookings
      recentBookings: recentBookingsList,
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
  }
}
