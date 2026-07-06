import mongoose, { Schema, Document } from 'mongoose'

export interface IAddress {
  _id?: mongoose.Types.ObjectId
  fullName: string
  address: string
  city: string
  state?: string
  zipCode?: string
  country?: string
  phone: string
  isDefault: boolean
}

export interface IUser extends Document {
  name: string
  email: string
  password: string
  phone?: string
  avatar?: string
  isAdmin: boolean
  addresses: IAddress[]
  wishlist: mongoose.Types.ObjectId[]
  wishlistSharePublic: boolean
  createdAt: Date
}

const AddressSchema = new Schema<IAddress>({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String },
  phone: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
})

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  avatar: { type: String },
  isAdmin: { type: Boolean, default: false },
  addresses: [AddressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  wishlistSharePublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

UserSchema.index({ isAdmin: 1 })

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
