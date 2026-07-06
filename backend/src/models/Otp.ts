import mongoose, { Document, Schema } from 'mongoose'

export interface IOtp extends Document {
  email: string
  otp: string
  expiresAt: Date
  createdAt: Date
}

const otpSchema = new Schema<IOtp>({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  createdAt: { type: Date, default: Date.now },
})

otpSchema.index({ email: 1, expiresAt: 1 })

export const Otp = mongoose.model<IOtp>('Otp', otpSchema)
