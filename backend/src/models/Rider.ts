import mongoose, { Schema, Document } from 'mongoose'

export interface IRider extends Document {
  name: string
  email: string
  password: string
  phone: string
  photo: string
  vehicle: string
  licenseNumber?: string
  rating: number
  totalDeliveries: number
  totalEarnings: number
  status: 'active' | 'offline' | 'busy' | 'suspended'
  currentLocation?: { lat: number; lng: number; updatedAt: Date }
  isActive: boolean
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  createdAt: Date
}

const RiderSchema = new Schema<IRider>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  photo: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' },
  vehicle: { type: String, required: true },
  licenseNumber: { type: String },
  rating: { type: Number, default: 4.5 },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'offline', 'busy', 'suspended'], default: 'offline' },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  isActive: { type: Boolean, default: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now }
})

export const Rider = mongoose.models.Rider || mongoose.model<IRider>('Rider', RiderSchema)
