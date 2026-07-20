import mongoose from "mongoose"

interface IPartnerDocs {
  owner: mongoose.Types.ObjectId
  CNIC_Url: string
  License_Url: string
  vehicle_rc: string
  status: "approved" | "pending" | "rejected"
  rejectionReason?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const partnerDocsSchema = new mongoose.Schema<IPartnerDocs>(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    CNIC_Url: {
      type: String,
      required: true,
    },

    License_Url: {
      type: String,
      required: true,
    },

    vehicle_rc: {
      type: String,
      required: true,
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

const PartnerDocs =
  mongoose.models.PartnerDocs ||
  mongoose.model<IPartnerDocs>("PartnerDocs", partnerDocsSchema)

export default PartnerDocs