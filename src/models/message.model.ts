import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IMessage extends Document {
    booking: mongoose.Types.ObjectId
    sender: mongoose.Types.ObjectId
    senderRole: 'user' | 'partner'
    content: string
    isAiSuggestion: boolean
    read: boolean
    createdAt: Date
    updatedAt: Date
}

const messageSchema = new Schema<IMessage>(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            index: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        senderRole: {
            type: String,
            enum: ['user', 'partner'],
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        isAiSuggestion: {
            type: Boolean,
            default: false,
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

// Compound index for fast lookups per booking
messageSchema.index({ booking: 1, createdAt: 1 })

const Message: Model<IMessage> =
    mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema)

export default Message
