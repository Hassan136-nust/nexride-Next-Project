import mongoose from "mongoose"

interface IPartnerBank {
  owner: mongoose.Types.ObjectId
  accountHolderName: string
  bankName: string
  ifscCode: string
  accountNumber: string
  status: "not added" | "added" | "verified" | "rejected"
  rejectionReason?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const partnerBankSchema = new mongoose.Schema<IPartnerBank>(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
    },

    ifscCode: {
      type: String,
      required: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["not added", "added", "verified", "rejected"],
      default: "not added",
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

const PartnerBank =
  mongoose.models.PartnerBank ||
  mongoose.model<IPartnerBank>("PartnerBank", partnerBankSchema)

export default PartnerBank