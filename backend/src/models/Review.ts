import mongoose, { Schema, Document } from 'mongoose'

export interface IReview extends Document {
  product: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  name: string
  rating: number
  comment: string
  createdAt: Date
}

const ReviewSchema = new Schema<IReview>({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
})

export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema)
