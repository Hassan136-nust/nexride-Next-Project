import { NextRequest, NextResponse } from "next/server"

import connectDb from "@/lib/db"
import { auth } from "@/auth"

import User from "@/models/user.model"
import Vehicle from "@/models/vehicles.model"

import { uploadToCloudinary } from "@/lib/cloudinary"

export async function POST(request: Request) {
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

    const body = await request.json()

    const {
      type,
      number,
      vehicleModel,
      imageUrl,
      baseFare,
      perKmFare,
      waitingFare,
    } = body

    /* VALIDATION */
    if (!type || !number || !vehicleModel || !imageUrl) {
      return NextResponse.json(
        {
          error: "All required fields must be provided",
        },
        { status: 400 }
      )
    }

    /* CHECK DUPLICATE VEHICLE NUMBER */
    const existingVehicleNumber = await Vehicle.findOne({
      number: number.trim().toUpperCase(),
    })

    if (
      existingVehicleNumber &&
      existingVehicleNumber.owner.toString() !== user._id.toString()
    ) {
      return NextResponse.json(
        {
          error: "Vehicle number already registered",
        },
        { status: 400 }
      )
    }

    /* ================================
       UPLOAD IMAGE TO CLOUDINARY
    ================================= */

    const uploadedVehicleImage = await uploadToCloudinary(
      imageUrl,
      "nexride/vehicles"
    )

    /* CHECK IF USER ALREADY HAS VEHICLE */
    let vehicle = await Vehicle.findOne({
      owner: user._id,
    })

    if (vehicle) {
      /* UPDATE EXISTING VEHICLE */

      vehicle.type = type
      vehicle.number = number.trim().toUpperCase()
      vehicle.vehicleModel = vehicleModel

      vehicle.imageUrl = uploadedVehicleImage.url

      vehicle.baseFare = baseFare || 0
      vehicle.perKmFare = perKmFare || 0
      vehicle.waitingFare = waitingFare || 0

      vehicle.status = "pending"

      await vehicle.save()
    } else {
      /* CREATE NEW VEHICLE */

      vehicle = await Vehicle.create({
        owner: user._id,

        type,
        number: number.trim().toUpperCase(),
        vehicleModel,

        imageUrl: uploadedVehicleImage.url,

        baseFare: baseFare || 0,
        perKmFare: perKmFare || 0,
        waitingFare: waitingFare || 0,

        status: "pending",
      })
    }

    /* UPDATE USER */
    if (user.partnerOnboardingSteps < 1) {
      user.partnerOnboardingSteps = 1
    }

    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: "Vehicle details saved successfully",
        vehicle,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Vehicle POST Error:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    )
  }
}

/* =========================================
   GET VEHICLE DETAILS
========================================= */

export async function GET(req: NextRequest) {
  try {
    await connectDb()

    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      )
    }

    const user = await User.findOne({
      email: session.user.email,
    })

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        { status: 404 }
      )
    }

    const vehicle = await Vehicle.findOne({
      owner: user._id,
    })

    return NextResponse.json(
      {
        success: true,
        vehicle,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Vehicle GET Error:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    )
  }
}