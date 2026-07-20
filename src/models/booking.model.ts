import mongoose, { Document, Model, Schema } from 'mongoose'

export type BookingStatus =
    | 'requested'
    | 'awaiting_payment'
    | 'confirmed'
    | 'started'
    | 'completed'
    | 'cancelled'
    | 'rejected'
    | 'expired'

export type PaymentStatus = 'pending' | 'paid' | 'cash' | 'failed'

export interface IBooking extends Document {
    user: mongoose.Types.ObjectId
    partner?: mongoose.Types.ObjectId | null
    pickup: {
        label: string
        coordinates: [number, number] // [lng, lat]
    }
    dropoff: {
        label: string
        coordinates: [number, number] // [lng, lat]
    }
    vehicleType: string
    estimatedFare: number
    platformFee: number
    partnerEarning: number
    totalFare: number
    distanceKm: number
    durationMin: number
    status: BookingStatus
    paymentStatus: PaymentStatus
    paymentMethod: 'cash' | 'card'
    // Extra info stored at booking creation time for partner display
    passengerPhone?: string
    passengerName?: string
    vehicleModel?: string
    vehicleNumber?: string
    stripeSessionId?: string
    stripePaymentIntentId?: string
    createdAt: Date
    updatedAt: Date
}

const bookingSchema = new Schema<IBooking>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        partner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        pickup: {
            label: { type: String, required: true },
            coordinates: {
                type: [Number], // [lng, lat]
                required: true,
            },
        },
        dropoff: {
            label: { type: String, required: true },
            coordinates: {
                type: [Number], // [lng, lat]
                required: true,
            },
        },
        vehicleType: {
            type: String,
            required: true,
        },
        estimatedFare: {
            type: Number,
            required: true,
        },
        platformFee: {
            type: Number,
            default: 0,
        },
        partnerEarning: {
            type: Number,
            default: 0,
        },
        totalFare: {
            type: Number,
            default: 0,
        },
        distanceKm: {
            type: Number,
            required: true,
        },
        durationMin: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: [
                'requested',
                'awaiting_payment',
                'confirmed',
                'started',
                'completed',
                'cancelled',
                'rejected',
                'expired',
            ],
            default: 'requested',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'cash', 'failed'],
            default: 'pending',
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'card'],
            default: 'cash',
        },
        // Snapshot fields — stored at booking time so partner always sees info
        passengerPhone: { type: String, default: '' },
        passengerName: { type: String, default: '' },
        vehicleModel: { type: String, default: '' },
        vehicleNumber: { type: String, default: '' },
        stripeSessionId: { type: String, default: '' },
        stripePaymentIntentId: { type: String, default: '' },
    },
    {
        timestamps: true,
    }
)

const Booking: Model<IBooking> =
    mongoose.models.Booking || mongoose.model<IBooking>('Booking', bookingSchema)

export default Booking
