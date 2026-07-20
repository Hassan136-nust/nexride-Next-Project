import { NextRequest, NextResponse } from "next/server"

import connectDb from "@/lib/db"
import { auth } from "@/auth"

import User from "@/models/user.model"
import PartnerBank from "@/models/partnerBank.model"

export async function POST(req: NextRequest) {
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

    const body = await req.json()

    const {
      accountHolderName,
      bankName,
      ifscCode,
      accountNumber,
    } = body

    /* VALIDATION */
    if (
      !accountHolderName ||
      !bankName ||
      !ifscCode ||
      !accountNumber
    ) {
      return NextResponse.json(
        {
          error: "All bank details are required",
        },
        { status: 400 }
      )
    }

    /* CHECK DUPLICATE ACCOUNT NUMBER */
    const existingBank = await PartnerBank.findOne({
      accountNumber: accountNumber.trim(),
    })

    if (
      existingBank &&
      existingBank.owner.toString() !== user._id.toString()
    ) {
      return NextResponse.json(
        {
          error: "Bank account already registered",
        },
        { status: 400 }
      )
    }

    /* CHECK EXISTING BANK DETAILS */
    let partnerBank = await PartnerBank.findOne({
      owner: user._id,
    })

    if (partnerBank) {
      /* UPDATE */

      partnerBank.accountHolderName = accountHolderName
      partnerBank.bankName = bankName
      partnerBank.ifscCode = ifscCode
      partnerBank.accountNumber = accountNumber

      partnerBank.status = "added"

      await partnerBank.save()
    } else {
      /* CREATE */

      partnerBank = await PartnerBank.create({
        owner: user._id,

        accountHolderName,
        bankName,
        ifscCode,
        accountNumber,

        status: "added",
      })
    }

    /* UPDATE USER */
    if (user.partnerOnboardingSteps < 3) {
      user.partnerOnboardingSteps = 3
    }
    // Mark as pending review now that all 3 steps are done
    user.partnerStatus = "pending"

    await user.save()

    return NextResponse.json(
      {
        success: true,
        message: "Bank details saved successfully",
        partnerBank,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Partner Bank POST Error:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    )
  }
}



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

    const partnerBank = await PartnerBank.findOne({
      owner: user._id,
    })

    return NextResponse.json(
      {
        success: true,
        partnerBank,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Partner Bank GET Error:", error)

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      { status: 500 }
    )
  }
}