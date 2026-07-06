import mongoose, { Schema, Document } from 'mongoose'

export interface IBanner extends Document {
  title: string
  subtitle?: string
  image: string
  link?: string
  active: boolean
  order: number
  createdAt: Date
}

const BannerSchema = new Schema<IBanner>({
  title: { type: String, required: true },
  subtitle: { type: String },
  image: { type: String, required: true },
  link: { type: String },
  active: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})

export const Banner = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema)
