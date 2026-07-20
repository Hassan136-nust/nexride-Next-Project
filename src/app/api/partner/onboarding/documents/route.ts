import { NextRequest, NextResponse } from "next/server"

import connectDb from "@/lib/db"
import { auth } from "@/auth"

import User from "@/models/user.model"
import PartnerDocs from "@/models/partnerDocs.model"

import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(req: NextRequest) {
  try {
    await connectDb()

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await User.findOne({
      email: session.user.email,
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const body = await req.json()

    const {
      CNIC_Url,
      License_Url,
      vehicle_rc,
    } = body

    /* VALIDATION */
    if (!CNIC_Url || !License_Url || !vehicle_rc) {
      return NextResponse.json(
        { error: "All documents are required" },
        { status: 400 }
      )
    }

    /* ================================
       UPLOAD TO CLOUDINARY
    ================================= */

    const cnicUpload = await uploadToCloudinary(
      CNIC_Url,
      "nexride/partner-docs/cnic"
    )

    const licenseUpload = await uploadToCloudinary(
      License_Url,
      "nexride/partner-docs/license"
    )

    const rcUpload = await uploadToCloudinary(
      vehicle_rc,
      "nexride/partner-docs/vehicle-rc"
    )

    /* ================================
       CHECK EXISTING DOCS
    ================================= */

    let partnerDocs = await PartnerDocs.findOne({
      owner: user._id,
    })

    if (partnerDocs) {
      /* UPDATE */

      partnerDocs.CNIC_Url = cnicUpload.url
      partnerDocs.License_Url = licenseUpload.url
      partnerDocs.vehicle_rc = rcUpload.url

      partnerDocs.status = "pending"
      partnerDocs.rejectionReason = ""

      await partnerDocs.save()
    } else {
      /* CREATE */

      partnerDocs = await PartnerDocs.create({
        owner: user._id,

        CNIC_Url: cnicUpload.url,
        License_Url: licenseUpload.url,
        vehicle_rc: rcUpload.url,

        status: "pending",
      })
    }

    /* ================================
       UPDATE USER
    ================================= */

    if (user.partnerOnboardingSteps < 2) {
      user.partnerOnboardingSteps = 2
    }

    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: "Documents uploaded successfully",
        partnerDocs,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Partner Docs POST Error:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    )
  }
}

/* =========================================
   GET PARTNER DOCS
========================================= */

export async function GET(req: NextRequest) {
  try {
    await connectDb()

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const user = await User.findOne({
      email: session.user.email,
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const partnerDocs = await PartnerDocs.findOne({
      owner: user._id,
    })

    return NextResponse.json(
      {
        success: true,
        partnerDocs,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Partner Docs GET Error:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    )
  }
}