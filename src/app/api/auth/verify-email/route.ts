import connectDb from "@/lib/db"
import User from "@/models/user.model"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    await connectDb()

    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { message: "Email and OTP are required" },
        { status: 400 }
      )
    }

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { message: "Email already verified" },
        { status: 400 }
      )
    }

    if (!user.otp || !user.otpExpires) {
      return NextResponse.json(
        { message: "OTP not generated" },
        { status: 400 }
      )
    }

    if (user.otpExpires < new Date()) {
      return NextResponse.json(
        { message: "OTP expired" },
        { status: 400 }
      )
    }

    if (user.otp !== otp) {
      return NextResponse.json(
        { message: "Invalid OTP" },
        { status: 400 }
      )
    }

  
    user.isEmailVerified = true
    user.otp = undefined
    user.otpExpires = undefined

    await user.save()

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    console.error("OTP verify error:", message)

    return NextResponse.json(
      { message: `Server error: ${message}` },
      { status: 500 }
    )
  }
}