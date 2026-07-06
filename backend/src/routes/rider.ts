import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { bcrypt, jwt, sendEmail, authenticateToken, riderLimiter, User, Rider, Order, Notification } from '../helpers'

const router = Router()

router.post('/riders/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, vehicle, licenseNumber } = req.body

    if (!name || !email || !password || !phone || !vehicle) {
      return res.status(400).json({ message: 'All required fields must be provided' })
    }

    const existingRider = await Rider.findOne({ email: email.toLowerCase() })
    if (existingRider) {
      return res.status(400).json({ message: 'A rider with this email already exists' })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already registered as a customer' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const rider = new Rider({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      vehicle,
      licenseNumber,
      status: 'offline'
    })
    await rider.save()

    const token = jwt.sign({ riderId: rider._id, email: rider.email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    res.status(201).json({
      token,
      rider: {
        id: rider._id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        vehicle: rider.vehicle,
        status: rider.status
      }
    })
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A rider with this email already exists' })
    }
    console.error('Error registering rider:', error)
    res.status(500).json({ message: 'Error registering rider', error: error.message })
  }
})

router.post('/riders/login', riderLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    const rider = await Rider.findOne({ email })
    if (!rider) return res.status(400).json({ message: 'Invalid credentials' })

    const isMatch = await bcrypt.compare(password, rider.password)
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })

    const token = jwt.sign({ riderId: rider._id, email: rider.email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    res.json({
      token,
      rider: {
        id: rider._id,
        name: rider.name,
        email: rider.email,
        phone: rider.phone,
        vehicle: rider.vehicle,
        photo: rider.photo,
        rating: rider.rating,
        status: rider.status
      }
    })
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error })
  }
})

router.post('/riders/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const rider = await Rider.findOne({ email: email.toLowerCase() })
    if (!rider) return res.status(200).json({ message: 'If the email exists, a reset link has been sent' })

    const resetToken = crypto.randomBytes(32).toString('hex')
    rider.resetPasswordToken = resetToken
    rider.resetPasswordExpires = new Date(Date.now() + 3600000)
    await rider.save()

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/rider/reset-password?token=${resetToken}`
    await sendEmail(
      rider.email,
      'FlikRider - Reset your password',
      `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;background:#f9fafb;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#f97316;font-size:24px;margin:0;">FlikRider</h1>
          <p style="color:#6b7280;font-size:14px;">Reset your password</p>
        </div>
        <div style="background:#fff;padding:24px;border-radius:12px;">
          <p style="color:#374151;font-size:14px;line-height:1.6;">We received a request to reset your FlikRider account password.</p>
          <p style="color:#374151;font-size:14px;line-height:1.6;">Click the button below to set a new password. This link expires in 1 hour.</p>
          <a href="${resetUrl}" style="display:block;width:100%;padding:14px;background:linear-gradient(135deg,#f97316,#ea580c);color:#fff;text-align:center;text-decoration:none;border-radius:10px;font-weight:bold;font-size:15px;margin:20px 0;">
            Reset Password
          </a>
          <p style="color:#9ca3af;font-size:12px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>`
    )

    res.json({ message: 'If the email exists, a reset link has been sent' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ message: 'Error processing request' })
  }
})

router.post('/riders/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const rider = await Rider.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    })
    if (!rider) return res.status(400).json({ message: 'Invalid or expired reset token' })

    rider.password = await bcrypt.hash(password, 10)
    rider.resetPasswordToken = undefined
    rider.resetPasswordExpires = undefined
    await rider.save()

    res.json({ message: 'Password reset successful. You can now login.' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ message: 'Error resetting password' })
  }
})

router.get('/riders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const riders = await Rider.find().select('-password')
    res.json(riders)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching riders', error })
  }
})

router.get('/riders/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    const rider = await Rider.findById(req.user.riderId).select('-password')
    if (!rider) return res.status(404).json({ message: 'Rider not found' })
    res.json(rider)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rider profile', error })
  }
})

router.put('/riders/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    const { name, phone, vehicle } = req.body
    const updateData: any = {}
    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (vehicle) updateData.vehicle = vehicle

    const rider = await Rider.findByIdAndUpdate(
      req.user.riderId,
      updateData,
      { new: true }
    ).select('-password')

    if (!rider) return res.status(404).json({ message: 'Rider not found' })
    res.json({ message: 'Profile updated', rider })
  } catch (error) {
    res.status(500).json({ message: 'Error updating rider profile', error })
  }
})

router.put('/riders/location', authenticateToken, async (req: any, res: Response) => {
  try {
    const { lat, lng } = req.body
    const rider = await Rider.findByIdAndUpdate(
      req.user.riderId,
      {
        currentLocation: { lat, lng, updatedAt: new Date() },
        status: 'active'
      },
      { new: true }
    )
    res.json({ message: 'Location updated', location: rider?.currentLocation })
  } catch (error) {
    res.status(500).json({ message: 'Error updating location', error })
  }
})

router.get('/riders/orders', authenticateToken, async (req: any, res: Response) => {
  try {
    const orders = await Order.find({ riderId: req.user.riderId }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rider orders', error })
  }
})

router.put('/rider/accept-order', authenticateToken, async (req: any, res: Response) => {
  try {
    const { orderId } = req.body

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' })
    }

    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.riderId?.toString() !== req.user.riderId) {
      return res.status(403).json({ message: 'This order is not assigned to you' })
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        status: 'Out for Delivery',
        outForDeliveryAt: new Date(),
        statusUpdatedAt: new Date()
      },
      { new: true }
    )

    await Rider.findByIdAndUpdate(req.user.riderId, {
      status: 'busy'
    })

    res.json({
      message: 'Order accepted and marked as Out for Delivery',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Error accepting order:', error)
    res.status(500).json({ message: 'Error accepting order', error })
  }
})

router.put('/rider/update-location', authenticateToken, async (req: any, res: Response) => {
  try {
    const { latitude, longitude } = req.body

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: 'Latitude and longitude are required' })
    }

    const locationData = {
      lat: latitude,
      lng: longitude,
      updatedAt: new Date()
    }

    const rider = await Rider.findByIdAndUpdate(
      req.user.riderId,
      {
        currentLocation: locationData,
        status: 'active'
      },
      { new: true }
    )

    await Order.updateMany(
      {
        riderId: req.user.riderId,
        status: { $in: ['Out for Delivery', 'Assigned to Rider'] }
      },
      {
        riderLocation: locationData
      }
    )

    res.json({
      message: 'Location updated successfully',
      location: locationData
    })
  } catch (error) {
    console.error('Error updating location:', error)
    res.status(500).json({ message: 'Error updating location', error })
  }
})

router.get('/rider/my-orders', authenticateToken, async (req: any, res: Response) => {
  try {
    const { status } = req.query
    let query: any = { riderId: req.user.riderId }

    if (status) {
      query.status = status
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean()

    res.json(orders)
  } catch (error) {
    console.error('Error fetching rider orders:', error)
    res.status(500).json({ message: 'Error fetching orders', error })
  }
})

router.put('/rider/mark-delivered', authenticateToken, async (req: any, res: Response) => {
  try {
    const { orderId, deliveryNotes, photo, paymentReceived } = req.body

    if (!orderId) {
      return res.status(400).json({ message: 'Order ID is required' })
    }

    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.riderId?.toString() !== req.user.riderId) {
      return res.status(403).json({ message: 'This order is not assigned to you' })
    }

    const isCOD = order.paymentMethod === 'cod'
    const paymentStatus = (isCOD && paymentReceived) ? 'verified' : order.paymentResult?.status

    const updateData: any = {
      status: 'Delivered',
      isDelivered: true,
      deliveredAt: new Date(),
      statusUpdatedAt: new Date(),
      deliveryProof: {
        photo: photo || '',
        deliveryNotes: deliveryNotes || '',
        deliveredAt: new Date()
      }
    }

    if (isCOD && paymentReceived) {
      updateData.isPaid = true
      updateData.paidAt = new Date()
      updateData.paymentResult = {
        ...order.paymentResult,
        status: 'verified',
        paymentReceivedBy: req.user.riderId,
        paymentReceivedAt: new Date()
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true }
    )

    const deliveryFee = Math.round(order.totalPrice * 0.05)
    await Rider.findByIdAndUpdate(req.user.riderId, {
      $inc: { totalDeliveries: 1, totalEarnings: deliveryFee },
      status: 'active'
    })

    res.json({
      message: 'Order marked as delivered',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Error marking delivered:', error)
    res.status(500).json({ message: 'Error marking order as delivered', error })
  }
})

router.get('/rider/earnings', authenticateToken, async (req: any, res: Response) => {
  try {
    const orders = await Order.find({
      riderId: req.user.riderId,
      status: 'Delivered'
    }).sort({ deliveredAt: -1 }).lean()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const daily = orders.filter((o: any) => o.deliveredAt && new Date(o.deliveredAt) >= today)
    const weekly = orders.filter((o: any) => o.deliveredAt && new Date(o.deliveredAt) >= weekStart)
    const monthly = orders.filter((o: any) => o.deliveredAt && new Date(o.deliveredAt) >= monthStart)

    const calcEarnings = (arr: any[]) => arr.reduce((sum: number, o: any) => sum + Math.round(o.totalPrice * 0.05), 0)

    res.json({
      totalEarnings: calcEarnings(orders),
      dailyEarnings: calcEarnings(daily),
      weeklyEarnings: calcEarnings(weekly),
      monthlyEarnings: calcEarnings(monthly),
      totalDeliveries: orders.length,
      dailyDeliveries: daily.length,
      weeklyDeliveries: weekly.length,
      monthlyDeliveries: monthly.length,
      recentEarnings: orders.slice(0, 20).map((o: any) => ({
        trackingId: o.trackingId,
        amount: Math.round(o.totalPrice * 0.05),
        totalPrice: o.totalPrice,
        deliveredAt: o.deliveredAt,
        customerName: o.shippingAddress?.fullName
      }))
    })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching earnings', error })
  }
})

router.get('/rider/optimized-route', authenticateToken, async (req: any, res: Response) => {
  try {
    const orders = await Order.find({
      riderId: req.user.riderId,
      status: { $in: ['Out for Delivery', 'Assigned to Rider'] }
    }).select('shippingAddress trackingId riderLocation').lean()

    const rider = await Rider.findById(req.user.riderId).select('currentLocation')
    if (!rider?.currentLocation?.lat) {
      return res.json({ orders, note: 'Enable location sharing for route optimization' })
    }
    const { lat: rLat, lng: rLng } = rider.currentLocation
    const sorted = orders.sort((a: any, b: any) => {
      const dA = a.riderLocation?.lat ? Math.abs(a.riderLocation.lat - rLat) + Math.abs(a.riderLocation.lng - rLng) : 999
      const dB = b.riderLocation?.lat ? Math.abs(b.riderLocation.lat - rLat) + Math.abs(b.riderLocation.lng - rLng) : 999
      return dA - dB
    })
    res.json({ orders: sorted, optimized: true })
  } catch { res.status(500).json({ message: 'Error optimizing route' }) }
})

export default router
