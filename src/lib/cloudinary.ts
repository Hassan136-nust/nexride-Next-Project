import { v2 as cloudinary } from "cloudinary"


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
})


export const uploadToCloudinary = async (
  file: string,
  folder: string = "nexride"
) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder,
      resource_type: "image",
      transformation: [
        { quality: "auto" },
        { fetch_format: "auto" }
      ],
    })

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    }
  } catch (error) {
    console.error("Cloudinary Upload Error:", error)
    throw new Error("Failed to upload image to Cloudinary")
  }
}


export const deleteFromCloudinary = async (public_id: string) => {
  try {
    const result = await cloudinary.uploader.destroy(public_id)
    return result
  } catch (error) {
    console.error("Cloudinary Delete Error:", error)
    throw new Error("Failed to delete image from Cloudinary")
  }
}


export default cloudinary