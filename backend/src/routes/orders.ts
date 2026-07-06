import { Router, Request, Response } from 'express'
import { authenticateToken, stripe, sendOrderStatusEmail, createNotification, orderLimiter, couponLimiter, User, Order, Product, Coupon, Notification, Return, Rider } from '../helpers'

const router = Router()

router.post('/orders', orderLimiter, async (req: Request, res: Response) => {
  try {
    const { user, orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice } = req.body
    const order = new Order({
      user,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      status: 'Order Received',
      country: 'Pakistan',
      orderReceivedAt: new Date()
    })
    await order.save()
    res.status(201).json(order)
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error })
  }
})

router.get('/orders/user/:userId', async (req: Request, res: Response) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error })
  }
})

router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order', error })
  }
})

router.put('/orders/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status, trackingNumber, riderName, riderPhone, riderLocation, cancellationReason } = req.body
    const updateData: any = { status }

    switch (status) {
      case 'Processing':
        updateData.processingAt = new Date()
        break
      case 'Shipped':
        updateData.shippedAt = new Date()
        break
      case 'Out for Delivery':
        updateData.outForDeliveryAt = new Date()
        break
      case 'Delivered':
        updateData.deliveredAt = new Date()
        break
      case 'Cancelled':
        updateData.cancelledAt = new Date()
        updateData.cancellationReason = cancellationReason || ''
        break
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
    sendOrderStatusEmail(order, status)
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Error updating order', error })
  }
})

router.put('/orders/:id/rider', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { riderName, riderPhone, riderLocation } = req.body
    const order = await Order.findByIdAndUpdate(req.params.id, {
      riderName,
      riderPhone,
      riderLocation,
      status: 'Out for Delivery',
      outForDeliveryAt: new Date()
    }, { new: true })
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Error updating rider info', error })
  }
})

router.get('/orders', authenticateToken, async (req: Request, res: Response) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error })
  }
})

router.delete('/orders/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json({ message: 'Order cancelled successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling order', error })
  }
})

router.put('/orders/:id/cancel', authenticateToken, async (req: any, res: Response) => {
  try {
    const { cancellationReason } = req.body
    const orderId = req.params.id

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.status === 'Delivered' || order.status === 'Cancelled') {
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` })
    }

    order.status = 'Cancelled'
    order.cancelledAt = new Date()
    order.cancellationReason = cancellationReason || 'Cancelled by customer'

    await order.save()

    res.json({
      message: 'Order cancelled successfully',
      order
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    res.status(500).json({ message: 'Error cancelling order', error })
  }
})

router.get('/orders/guest/track', async (req: Request, res: Response) => {
  try {
    const { email, phone } = req.query

    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone is required' })
    }

    let query: any = {}

    if (email) {
      query.$or = [
        { user: 'guest', 'shippingAddress.email': email },
        { 'shippingAddress.phone': phone }
      ]
    } else if (phone) {
      query = { 'shippingAddress.phone': phone }
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(10)

    res.json(orders)
  } catch (error) {
    console.error('Error fetching guest orders:', error)
    res.status(500).json({ message: 'Error fetching orders', error })
  }
})

router.get('/orders/:id/invoice', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    let paymentStatusText = ''
    let paymentStatusColor = ''
    let orderStatusText = order.status
    let orderStatusColor = '#666'

    if (order.status === 'Cancelled') {
      orderStatusText = 'Cancelled'
      orderStatusColor = '#dc3545'
      paymentStatusText = 'Payment Cancelled'
      paymentStatusColor = '#dc3545'
    } else if (order.paymentMethod === 'cod') {
      paymentStatusText = 'Cash on Delivery - Pending'
      paymentStatusColor = '#FFA500'
    } else if (order.isPaid && (order.paymentResult?.status === 'verified' || order.paymentMethod === 'card')) {
      paymentStatusText = 'Payment Successful'
      paymentStatusColor = '#28a745'
    } else if (order.paymentResult?.status === 'rejected') {
      paymentStatusText = 'Payment Failed'
      paymentStatusColor = '#dc3545'
    } else {
      paymentStatusText = 'Payment Pending'
      paymentStatusColor = '#FFC107'
    }

    const invoiceHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order.trackingId}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 32px; font-weight: bold; color: #FF6B00; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .invoice-box { border: 1px solid #eee; padding: 20px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { background-color: #f9f9f9; }
    .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; }
    .footer { text-align: center; margin-top: 50px; color: #666; font-size: 12px; }
    .payment-status { display: inline-block; padding: 4px 12px; border-radius: 4px; color: white; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">FlikCart</div>
    <p>Invoice</p>
  </div>

  <div class="invoice-info">
    <div>
      <strong>Order ID:</strong> ${order._id}<br>
      <strong>Tracking ID:</strong> ${order.trackingId}<br>
      <strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}
    </div>
    <div>
      <strong>Status:</strong> <span class="payment-status" style="background-color: ${orderStatusColor}">${orderStatusText}</span><br>
      <strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'}<br>
      <strong>Payment:</strong> <span class="payment-status" style="background-color: ${paymentStatusColor}">${paymentStatusText}</span>
    </div>
  </div>

  <div class="invoice-box">
    <h3>Shipping Address</h3>
    <p>${order.shippingAddress.fullName}<br>
    ${order.shippingAddress.address}<br>
    ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
    ${order.shippingAddress.country}<br>
    Phone: ${order.shippingAddress.phone}</p>
  </div>

  <div class="invoice-box">
    <h3>Order Items</h3>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${order.orderItems.map((item: any) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>Rs. ${item.price.toFixed(2)}</td>
          <td>Rs. ${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="total">
      <p>Subtotal: Rs. ${order.itemsPrice.toFixed(2)}</p>
      <p>Shipping: Rs. ${order.shippingPrice.toFixed(2)}</p>
      <p>Tax: Rs. ${order.taxPrice.toFixed(2)}</p>
      <p>Total: Rs. ${order.totalPrice.toFixed(2)}</p>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with FlikCart!</p>
    <p>For any queries, contact: support@flikcart.com</p>
  </div>
</body>
</html>
    `

    res.json({
      invoiceHtml,
      orderId: order._id,
      trackingId: order.trackingId
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    res.status(500).json({ message: 'Error generating invoice', error })
  }
})

router.put('/orders/:id/assign-rider', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { riderId } = req.body
    const rider = await Rider.findById(riderId)
    if (!rider) return res.status(404).json({ message: 'Rider not found' })

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        riderId: rider._id,
        riderName: rider.name,
        riderPhone: rider.phone,
        riderPhoto: rider.photo,
        riderRating: rider.rating,
        riderVehicle: rider.vehicle,
        status: 'Out for Delivery',
        estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000),
        outForDeliveryAt: new Date()
      },
      { new: true }
    )
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Error assigning rider', error })
  }
})

router.put('/orders/:id/update-status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { status, riderLocation, cancellationReason } = req.body
    const updateData: any = { status }

    switch (status) {
      case 'Pending':
        updateData.pendingAt = new Date()
        break
      case 'Processing':
        updateData.processingAt = new Date()
        break
      case 'Shipped':
        updateData.shippedAt = new Date()
        break
      case 'Out for Delivery':
        updateData.outForDeliveryAt = new Date()
        break
      case 'Delivered':
        updateData.isDelivered = true
        updateData.deliveredAt = new Date()
        break
      case 'Cancelled':
        updateData.cancelledAt = new Date()
        updateData.cancellationReason = cancellationReason || ''
        break
    }

    if (riderLocation) {
      updateData.riderLocation = { ...riderLocation, updatedAt: new Date() }
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error })
  }
})

router.post('/orders/:id/delivery-proof', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { photo, signature, deliveryNotes, otp } = req.body
    const order = await Order.findById(req.params.id)

    if (!order) return res.status(404).json({ message: 'Order not found' })

    if (order.deliveryOTP && otp !== order.deliveryOTP) {
      return res.status(400).json({ message: 'Invalid delivery OTP' })
    }

    const updateData: any = {
      'deliveryProof.photo': photo,
      'deliveryProof.signature': signature,
      'deliveryProof.deliveryNotes': deliveryNotes,
      'deliveryProof.otpVerified': otp === order.deliveryOTP,
      'deliveryProof.deliveredAt': new Date(),
      isDelivered: true,
      deliveredAt: new Date(),
      status: 'Delivered'
    }

    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })

    if (order.riderId) {
      await Rider.findByIdAndUpdate(order.riderId, {
        $inc: { totalDeliveries: 1 },
        status: 'active'
      })
    }

    res.json(updatedOrder)
  } catch (error) {
    res.status(500).json({ message: 'Error submitting delivery proof', error })
  }
})

router.post('/orders/:id/generate-otp', authenticateToken, async (req: Request, res: Response) => {
  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString()
    const order = await Order.findByIdAndUpdate(req.params.id, { deliveryOTP: otp }, { new: true })
    res.json({ otp, message: 'Delivery OTP generated' })
  } catch (error) {
    res.status(500).json({ message: 'Error generating OTP', error })
  }
})

router.get('/orders/:id/track', async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id).select('-deliveryOTP')
    if (!order) return res.status(404).json({ message: 'Order not found' })

    let eta = null
    if (order.estimatedDeliveryTime) {
      eta = new Date(order.estimatedDeliveryTime).toLocaleTimeString()
    }

    res.json({ ...order.toObject(), eta })
  } catch (error) {
    res.status(500).json({ message: 'Error tracking order', error })
  }
})

router.get('/track-order', async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.query

    if (!trackingId) {
      return res.status(400).json({ message: 'Tracking ID is required' })
    }

    const order = await Order.findOne({ trackingId: trackingId as string })
      .select('-deliveryOTP -paymentResult')
      .lean() as any

    if (!order) {
      return res.status(404).json({ message: 'Order not found with this tracking ID' })
    }

    let riderInfo = null
    if (order.riderId) {
      const rider = await Rider.findById(order.riderId).select('name phone photo vehicle')
      if (rider) {
        riderInfo = {
          name: rider.name,
          phone: rider.phone,
          photo: rider.photo,
          vehicle: rider.vehicle
        }
      }
    }

    const response = {
      trackingId: order.trackingId,
      status: order.status,
      statusUpdatedAt: order.statusUpdatedAt,
      isDelivered: order.isDelivered,
      totalPrice: order.totalPrice,
      orderItems: order.orderItems,
      shippingAddress: order.shippingAddress,
      riderInfo,
      riderLocation: order.status === 'Out for Delivery' || order.status === 'Assigned to Rider'
        ? order.riderLocation
        : null,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      createdAt: order.createdAt,
      orderReceivedAt: order.orderReceivedAt,
      processingAt: order.processingAt,
      shippedAt: order.shippedAt,
      assignedToRiderAt: order.assignedToRiderAt,
      outForDeliveryAt: order.outForDeliveryAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt
    }

    res.json(response)
  } catch (error) {
    console.error('Error tracking order:', error)
    res.status(500).json({ message: 'Error tracking order', error })
  }
})

router.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { amount, orderId, email } = req.body

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Minimum amount must be PKR 100' })
    }

    const pkrToUsd = 280
    const usdCents = Math.round((amount / pkrToUsd) * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: usdCents,
      currency: 'usd',
      metadata: {
        orderId: orderId || '',
        integration_check: 'accept_a_payment',
      },
      receipt_email: email,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error creating payment intent:', error)
    res.status(500).json({ message: 'Error creating payment intent', error: msg })
  }
})

router.post('/update-payment-status', async (req: Request, res: Response) => {
  try {
    const { orderId, paymentIntentId, status } = req.body

    if (!orderId || !paymentIntentId) {
      return res.status(400).json({ message: 'Order ID and Payment Intent ID are required' })
    }

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (status === 'succeeded') {
      order.paymentResult = {
        id: paymentIntentId,
        status: 'verified',
        email: order.shippingAddress.email || order.shippingAddress.phone
      }
      order.isPaid = true
      order.paidAt = new Date()
      order.status = 'Processing'
    } else {
      order.paymentResult = {
        id: paymentIntentId,
        status: 'failed',
        email: order.shippingAddress.email || order.shippingAddress.phone
      }
      order.status = 'Payment Failed'
    }

    await order.save()

    res.json({
      message: 'Payment status updated',
      order
    })
  } catch (error: any) {
    console.error('Error updating payment status:', error)
    res.status(500).json({ message: 'Error updating payment status', error: error.message })
  }
})

router.get('/payment-status/:paymentIntentId', async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.params

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    res.status(500).json({ message: 'Error verifying payment', error: error.message })
  }
})

router.post('/coupons/validate', couponLimiter, async (req: Request, res: Response) => {
  try {
    const { code, orderAmount } = req.body

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' })
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() })

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' })
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'This coupon is no longer active' })
    }

    const now = new Date()
    if (now < coupon.validFrom) {
      return res.status(400).json({ message: 'This coupon is not yet valid' })
    }

    if (now > coupon.validUntil) {
      return res.status(400).json({ message: 'This coupon has expired' })
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ message: 'This coupon has reached its maximum usage limit' })
    }

    if (orderAmount !== undefined && orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount is Rs. ${coupon.minOrderAmount} to use this coupon` })
    }

    let discount = 0
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * coupon.discountValue) / 100
    } else {
      discount = coupon.discountValue
    }

    if (discount > orderAmount) {
      discount = orderAmount
    }

    res.json({
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      },
      discount: Math.round(discount)
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    res.status(500).json({ message: 'Error validating coupon', error })
  }
})

router.post('/coupons/apply', async (req: Request, res: Response) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' })
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() })

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' })
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: 'This coupon is no longer active' })
    }

    const now = new Date()
    if (now > coupon.validUntil) {
      return res.status(400).json({ message: 'This coupon has expired' })
    }

    coupon.usedCount += 1
    await coupon.save()

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue
      }
    })
  } catch (error) {
    console.error('Error applying coupon:', error)
    res.status(500).json({ message: 'Error applying coupon', error })
  }
})

router.get('/notifications', authenticateToken, async (req: any, res: Response) => {
  try {
    const query: any = {}
    if (req.user.isAdmin) query.userId = 'admin'
    else if (req.user.riderId) query.riderId = req.user.riderId
    else query.userId = req.user.id

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50)
    const unread = await Notification.countDocuments({ ...query, read: false })
    res.json({ notifications, unread })
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error })
  }
})

router.put('/notifications/read-all', authenticateToken, async (req: any, res: Response) => {
  try {
    const query: any = { read: false }
    if (req.user.isAdmin) query.userId = 'admin'
    else if (req.user.riderId) query.riderId = req.user.riderId
    else query.userId = req.user.id
    await Notification.updateMany(query, { read: true })
    res.json({ message: 'All marked as read' })
  } catch (error) {
    res.status(500).json({ message: 'Error', error })
  }
})

router.post('/returns', authenticateToken, async (req: any, res: Response) => {
  try {
    const { orderId, items, reason } = req.body
    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    const existing = await Return.findOne({ order: orderId, user: req.user.id, status: { $in: ['pending', 'approved'] } })
    if (existing) return res.status(400).json({ message: 'Return already requested' })
    const ret = await Return.create({ order: orderId, user: req.user.id, items, reason, refundAmount: order.totalPrice })
    res.status(201).json(ret)
  } catch (err) { res.status(500).json({ message: 'Error creating return', err }) }
})

router.get('/returns/:orderId', authenticateToken, async (req: any, res: Response) => {
  const ret = await Return.findOne({ order: req.params.orderId, user: req.user.id })
  res.json(ret)
})

router.get('/orders/delivered', authenticateToken, async (req: any, res: Response) => {
  try {
    const orders = await Order.find({ user: req.user.id, status: 'Delivered' }).sort({ createdAt: -1 })
    res.json(orders)
  } catch { res.status(500).json({ message: 'Error fetching delivered orders' }) }
})

router.post('/notify/whatsapp', async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body
    if (!phone || !message) return res.status(400).json({ message: 'Phone and message required' })
    console.log(`[WhatsApp] To: ${phone}, Message: ${message}`)
    res.json({ message: 'WhatsApp notification sent (simulated)', to: phone })
  } catch { res.status(500).json({ message: 'Error sending WhatsApp' }) }
})

export default router
