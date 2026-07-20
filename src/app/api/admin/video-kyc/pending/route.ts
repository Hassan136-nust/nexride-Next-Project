
import connectDb from "@/lib/db"
import {auth} from "@/auth"
import User from "@/models/user.model"
import { NextRequest , NextResponse } from "next/server"
export async function GET(req: NextRequest) {
  try {
    await connectDb()

    const session = await auth()

    if (!session || !session.user?.email || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const partner = await User.find({
        role:"partner",
        videoKycStatus:{$in:["pending" , "in_progress"]}
    })
    return Response.json(
        partner, {status:200}
    )

  }
  catch{

  }

}