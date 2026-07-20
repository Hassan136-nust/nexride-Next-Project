import mongoose from "mongoose"

type vehicleType = "bike" | "car" | "loading" | "truck" | "auto"

interface IVehicle {
  owner: mongoose.Types.ObjectId
  type: vehicleType
  vehicleModel: string
  number: string
  imageUrl?: string
  baseFare?: number
  perKmFare?: number
  waitingFare?: number
  status: "approved" | "pending" | "rejected"
  rejectionReason?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const vehicleSchema = new mongoose.Schema<IVehicle>(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["bike", "car", "loading", "truck", "auto"],
      required: true,
    },

    vehicleModel: {
      type: String,
      required: true,
      trim: true,
    },

    number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    imageUrl: {
      type: String,
    },

    baseFare: {
      type: Number,
      default: 0,
    },

    perKmFare: {
      type: Number,
      default: 0,
    },

    waitingFare: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

const Vehicle =
  mongoose.models.Vehicle || mongoose.model<IVehicle>("Vehicle", vehicleSchema)

export default Vehicle