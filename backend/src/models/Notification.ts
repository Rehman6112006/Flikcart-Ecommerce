import mongoose, { Schema, Document } from 'mongoose'

export interface INotification extends Document {
  userId?: string
  riderId?: mongoose.Types.ObjectId
  type: 'order_update' | 'payment' | 'delivery' | 'system' | 'admin'
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
  type: { type: String, enum: ['order_update', 'payment', 'delivery', 'system', 'admin'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema)
