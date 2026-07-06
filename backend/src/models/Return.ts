import mongoose, { Schema, Document } from 'mongoose'

export interface IReturn extends Document {
  order: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  items: Array<{ name: string; quantity: number; price: number }>
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  refundAmount?: number
  adminNote?: string
  createdAt: Date
  updatedAt?: Date
}

const ReturnSchema = new Schema<IReturn>({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ name: String, quantity: Number, price: Number }],
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  refundAmount: { type: Number },
  adminNote: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
})

export const Return = mongoose.models.Return || mongoose.model<IReturn>('Return', ReturnSchema)
