import connectDb from "@/lib/db"
import User from "@/models/user.model"
import { sendOtpEmail } from "@/lib/mailer"
import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 3) {
      return NextResponse.json(
        { message: "Password must be at least 3 characters" },
        { status: 400 }
      )
    }

    await connectDb()

    const existingUser = await User.findOne({ email })

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

    const hashedPassword = await bcrypt.hash(password, 10)

    let user

    // If user already exists
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return NextResponse.json(
          { message: "Email already exists" },
          { status: 400 }
        )
      }

      // not verified → update existing user
      existingUser.name = name
      existingUser.password = hashedPassword
      existingUser.otp = otp
      existingUser.otpExpires = otpExpires

      await existingUser.save()
      user = existingUser
    } 
    // new user
    else {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpires,
        isEmailVerified: false,
      })
    }

    // Send OTP email
    await sendOtpEmail(email, otp)

    return NextResponse.json(
      {
        message: "Account created successfully",
        userId: user._id,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    console.error("Register error:", message)

    return NextResponse.json(
      { message: `Register error: ${message}` },
      { status: 500 }
    )
  }
}