import  connectDb  from "@/lib/db";
import { auth } from "@/auth";
import User from "@/models/user.model";
export async function GET(req:Request){

    try{
        await connectDb()
        const session = await auth()
        if(!session || !session.user){
            return new Response(JSON.stringify({error:"Unauthorized"}),{status:401})
        }

        const user = await User.findOne({email:session.user.email})
        if(!user){
            return new Response(JSON.stringify({error:"User not found"}),{status:404})
        }

        return new Response(JSON.stringify({user}),{status:200})
    }
    catch(error){
        return new Response(JSON.stringify({error:"Internal server error"}),{status:500})
    }
}