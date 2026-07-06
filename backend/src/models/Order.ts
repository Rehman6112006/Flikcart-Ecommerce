import mongoose, { Schema, Document } from 'mongoose'

export interface IOrderItem {
  product: string
  name: string
  price: number
  quantity: number
  image?: string
  variant?: string
}

export interface IOrder extends Document {
  trackingId: string
  user?: string
  email?: string
  country: string
  orderItems: IOrderItem[]
  shippingAddress: {
    fullName: string
    address: string
    city: string
    state: string
    zipCode?: string
    country: string
    phone: string
    email?: string
  }
  paymentMethod: string
  paymentResult?: {
    id?: string
    status?: string
    email?: string
  }
  itemsPrice: number
  shippingPrice: number
  taxPrice: number
  totalPrice: number
  discount: number
  couponCode?: string
  isPaid: boolean
  paidAt?: Date
  isDelivered: boolean
  deliveredAt?: Date
  status: string
  trackingNumber?: string
  riderId?: mongoose.Types.ObjectId
  riderName?: string
  riderPhone?: string
  riderPhoto?: string
  riderRating: number
  riderVehicle?: string
  riderLocation?: { lat: number; lng: number; updatedAt: Date }
  deliveryProof?: {
    photo?: string
    signature?: string
    otpVerified: boolean
    deliveryNotes?: string
    deliveredAt?: Date
  }
  estimatedDeliveryTime?: Date
  deliveryOTP?: string
  orderReceivedAt?: Date
  processingAt?: Date
  shippedAt?: Date
  assignedToRiderAt?: Date
  outForDeliveryAt?: Date
  cancelledAt?: Date
  cancellationReason?: string
  statusUpdatedAt?: Date
  createdAt: Date
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
  variant: { type: String }
})

const OrderSchema = new Schema<IOrder>({
  trackingId: { type: String, unique: true, default: () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = 'TRK-'
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length))
    return result
  }},
  user: { type: String },
  email: { type: String },
  country: { type: String, required: true },
  orderItems: [OrderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String },
    country: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  paymentMethod: { type: String, required: true },
  paymentResult: {
    id: { type: String },
    status: { type: String },
    email: { type: String }
  },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, required: true },
  taxPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  couponCode: { type: String },
  isPaid: { type: Boolean, default: false },
  paidAt: { type: Date },
  isDelivered: { type: Boolean, default: false },
  deliveredAt: { type: Date },
  status: {
    type: String,
    enum: ['Order Received', 'Processing', 'Shipped', 'Assigned to Rider', 'Out for Delivery', 'Delivered', 'Cancelled', 'Payment Verification Pending', 'Payment Failed'],
    default: 'Order Received'
  },
  trackingNumber: { type: String },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider' },
  riderName: { type: String },
  riderPhone: { type: String },
  riderPhoto: { type: String },
  riderRating: { type: Number, default: 4.5 },
  riderVehicle: { type: String },
  riderLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  deliveryProof: {
    photo: { type: String },
    signature: { type: String },
    otpVerified: { type: Boolean, default: false },
    deliveryNotes: { type: String },
    deliveredAt: { type: Date }
  },
  estimatedDeliveryTime: { type: Date },
  deliveryOTP: { type: String },
  orderReceivedAt: { type: Date, default: Date.now },
  processingAt: { type: Date },
  shippedAt: { type: Date },
  assignedToRiderAt: { type: Date },
  outForDeliveryAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  statusUpdatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
})

OrderSchema.index({ user: 1, createdAt: -1 })
OrderSchema.index({ status: 1, createdAt: -1 })
OrderSchema.index({ trackingId: 1 })

export const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)
