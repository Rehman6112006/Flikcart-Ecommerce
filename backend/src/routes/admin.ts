import { Router, Request, Response } from 'express'
import { bcrypt, jwt, authenticateToken, adminLimiter, Admin, User, Product, Order, Rider, Coupon, Banner, Review, Return, Notification, createNotification } from '../helpers'

const router = Router()

router.post('/admin/login', adminLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' })
    }

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' })
    }

    const token = jwt.sign(
      { adminId: admin._id, email: admin.email, isAdmin: true },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email
      }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ message: 'Error during admin login', error })
  }
})

router.get('/admin/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const admin = await Admin.findById(req.user.adminId).select('-password')
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' })
    }

    res.json(admin)
  } catch (error) {
    console.error('Error fetching admin profile:', error)
    res.status(500).json({ message: 'Error fetching profile', error })
  }
})

router.put('/admin/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { name, email } = req.body
    const admin = await Admin.findByIdAndUpdate(
      req.user.adminId,
      { name, email },
      { new: true }
    ).select('-password')

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' })
    }

    res.json(admin)
  } catch (error) {
    console.error('Error updating admin profile:', error)
    res.status(500).json({ message: 'Error updating profile', error })
  }
})

router.put('/admin/change-password', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { currentPassword, newPassword } = req.body

    const admin = await Admin.findById(req.user.adminId)
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' })
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    admin.password = hashedPassword
    await admin.save()

    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    res.status(500).json({ message: 'Error changing password', error })
  }
})

router.get('/admin/users', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { search, page = 1, limit = 20 } = req.query
    let query: any = { isAdmin: { $ne: true } }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
    const total = await User.countDocuments(query)

    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ user: user._id.toString() })
        return { ...user.toObject(), orderCount }
      })
    )

    res.json({
      users: usersWithOrders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ message: 'Error fetching users', error })
  }
})

router.get('/admin/users/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const user = await User.findById(req.params.id).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 })

    res.json({ user, orders })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ message: 'Error fetching user', error })
  }
})

router.put('/admin/users/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { name, phone, addresses } = req.body
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, phone, addresses },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ message: 'Error updating user', error })
  }
})

router.put('/admin/users/:id/status', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { isActive } = req.body
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (error) {
    console.error('Error updating user status:', error)
    res.status(500).json({ message: 'Error updating user status', error })
  }
})

router.get('/admin/products', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { search, category, status, page = 1, limit = 20 } = req.query
    let query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }
    if (category && category !== 'all') {
      query.category = category
    }
    if (status) {
      query.isActive = status === 'active'
    }

    const skip = (Number(page) - 1) * Number(limit)
    const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit))
    const total = await Product.countDocuments(query)

    res.json({
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    })
  } catch (error) {
    console.error('Error fetching admin products:', error)
    res.status(500).json({ message: 'Error fetching products', error })
  }
})

router.post('/admin/products', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const product = new Product(req.body)
    await product.save()
    res.status(201).json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ message: 'Error creating product', error })
  }
})

router.post('/admin/products/bulk', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { products } = req.body
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: 'Products array is required' })
    }

    const results = { created: 0, errors: 0, errorsList: [] as string[] }
    for (let i = 0; i < products.length; i++) {
      try {
        const p = products[i]
        if (!p.name || !p.price || !p.category) {
          results.errors++
          results.errorsList.push(`Row ${i+1}: Missing required fields (name, price, category)`)
          continue
        }
        await Product.create({
          name: p.name,
          description: p.description || p.name,
          price: Number(p.price),
          originalPrice: Number(p.originalPrice || p.price),
          category: p.category,
          subcategory: p.subcategory || '',
          images: p.images ? (Array.isArray(p.images) ? p.images : [p.images]) : [],
          stock: Number(p.stock || 0),
          brand: p.brand || '',
          rating: 0, reviews: 0,
          isFeatured: p.isFeatured === 'true' || p.isFeatured === true,
          isNewArrival: p.isNewArrival === 'true' || p.isNewArrival === true,
          discount: Number(p.discount || 0)
        })
        results.created++
      } catch (err: any) {
        results.errors++
        results.errorsList.push(`Row ${i+1}: ${err.message}`)
      }
    }
    res.json(results)
  } catch (error) {
    res.status(500).json({ message: 'Error in bulk upload', error })
  }
})

router.put('/admin/products/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ message: 'Error updating product', error })
  }
})

router.delete('/admin/products/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ message: 'Error deleting product', error })
  }
})

router.get('/admin/categories', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const categories = await Product.distinct('category')
    res.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ message: 'Error fetching categories', error })
  }
})

router.get('/admin/orders/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const order = await Order.findById(req.params.id).populate('riderId', 'name phone photo vehicle')
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ message: 'Error fetching order', error })
  }
})

router.get('/admin/all-orders', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { status, page = 1, limit = 50 } = req.query
    let query: any = {}

    if (status && status !== 'all') {
      query.status = status
    }

    const skip = (Number(page) - 1) * Number(limit)
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean()

    const total = await Order.countDocuments(query)

    res.json({
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    })
  } catch (error) {
    console.error('Error fetching admin orders:', error)
    res.status(500).json({ message: 'Error fetching orders', error })
  }
})

router.put('/admin/update-order-status', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { orderId, newStatus, assignedRiderId, cancellationReason } = req.body

    if (!orderId || !newStatus) {
      return res.status(400).json({ message: 'Order ID and new status are required' })
    }

    const updateData: any = {
      status: newStatus,
      statusUpdatedAt: new Date()
    }

    switch (newStatus) {
      case 'Order Received':
        updateData.orderReceivedAt = new Date()
        break
      case 'Processing':
        updateData.processingAt = new Date()
        break
      case 'Shipped':
        updateData.shippedAt = new Date()
        break
      case 'Assigned to Rider':
        updateData.assignedToRiderAt = new Date()
        if (assignedRiderId) {
          const rider = await Rider.findById(assignedRiderId)
          if (rider) {
            updateData.riderId = rider._id
            updateData.riderName = rider.name
            updateData.riderPhone = rider.phone
            updateData.riderPhoto = rider.photo
            updateData.riderVehicle = rider.vehicle
          }
        }
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

    const order = await Order.findByIdAndUpdate(orderId, updateData, { new: true })

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    res.json({
      message: 'Order status updated successfully',
      order
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ message: 'Error updating order status', error })
  }
})

router.get('/admin/all-riders', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { status, isActive } = req.query
    let query: any = {}

    if (status) {
      query.status = status
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true'
    }

    const riders = await Rider.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()

    const ridersWithOrderCount = await Promise.all(
      riders.map(async (rider) => {
        const activeOrders = await Order.countDocuments({
          riderId: rider._id,
          status: { $nin: ['Delivered', 'Cancelled'] }
        })
        return {
          ...rider,
          activeOrders
        }
      })
    )

    res.json(ridersWithOrderCount)
  } catch (error) {
    console.error('Error fetching riders:', error)
    res.status(500).json({ message: 'Error fetching riders', error })
  }
})

router.post('/admin/riders', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { name, email, password, phone, vehicle, licenseNumber } = req.body

    if (!name || !email || !password || !phone || !vehicle) {
      return res.status(400).json({ message: 'All required fields must be provided' })
    }

    const existingRider = await Rider.findOne({ email: email.toLowerCase() })
    if (existingRider) {
      return res.status(400).json({ message: 'Rider with this email already exists' })
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
    res.status(201).json({ message: 'Rider created successfully', rider: { ...rider.toObject(), password: undefined } })
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Rider with this email already exists' })
    }
    console.error('Error creating rider:', error)
    res.status(500).json({ message: 'Error creating rider', error: error.message })
  }
})

router.put('/admin/riders/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { name, phone, vehicle, status, isActive } = req.body
    const rider = await Rider.findByIdAndUpdate(
      req.params.id,
      { name, phone, vehicle, status, isActive },
      { new: true }
    ).select('-password')

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' })
    }

    res.json(rider)
  } catch (error) {
    console.error('Error updating rider:', error)
    res.status(500).json({ message: 'Error updating rider', error })
  }
})

router.delete('/admin/riders/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const rider = await Rider.findByIdAndDelete(req.params.id)
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' })
    }

    res.json({ message: 'Rider deleted successfully' })
  } catch (error) {
    console.error('Error deleting rider:', error)
    res.status(500).json({ message: 'Error deleting rider', error })
  }
})

router.post('/admin/cleanup-riders', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const allRiders = await Rider.find({}).lean()

    const emailMap = new Map()
    for (const rider of allRiders) {
      const emailKey = rider.email?.toLowerCase()
      if (!emailKey) continue

      if (!emailMap.has(emailKey)) {
        emailMap.set(emailKey, [])
      }
      emailMap.get(emailKey).push(rider)
    }

    const ridersToDelete: any[] = []
    for (const [email, riders] of emailMap) {
      if (riders.length > 1) {
        const sortedRiders = riders.sort((a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        for (let i = 1; i < sortedRiders.length; i++) {
          ridersToDelete.push(sortedRiders[i]._id)
        }
        console.log(`Found duplicate rider with email ${email}, keeping oldest, deleting ${ridersToDelete.length} duplicates`)
      }
    }

    if (ridersToDelete.length > 0) {
      await Rider.deleteMany({ _id: { $in: ridersToDelete } })
    }

    await Rider.createIndexes()

    res.json({
      message: `Cleanup complete. Removed ${ridersToDelete.length} duplicate riders.`,
      deletedCount: ridersToDelete.length
    })
  } catch (error) {
    console.error('Error cleaning up riders:', error)
    res.status(500).json({ message: 'Error cleaning up riders', error })
  }
})

router.get('/admin/coupons', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const coupons = await Coupon.find().sort({ createdAt: -1 })
    res.json(coupons)
  } catch (error) {
    console.error('Error fetching coupons:', error)
    res.status(500).json({ message: 'Error fetching coupons', error })
  }
})

router.post('/admin/coupons', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { code, description, discountType, discountValue, minOrderAmount, maxUses, validUntil } = req.body

    if (!code || !discountType || !discountValue || !validUntil) {
      return res.status(400).json({ message: 'Code, discount type, value, and validity are required' })
    }

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() })
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' })
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      discountType,
      discountValue,
      minOrderAmount: minOrderAmount || 0,
      maxUses: maxUses || null,
      validUntil: new Date(validUntil)
    })

    await coupon.save()
    res.status(201).json(coupon)
  } catch (error) {
    console.error('Error creating coupon:', error)
    res.status(500).json({ message: 'Error creating coupon', error })
  }
})

router.put('/admin/coupons/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { isActive, discountValue, validUntil, maxUses } = req.body

    const coupon = await Coupon.findById(req.params.id)
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' })
    }

    if (isActive !== undefined) coupon.isActive = isActive
    if (discountValue !== undefined) coupon.discountValue = discountValue
    if (validUntil !== undefined) coupon.validUntil = new Date(validUntil)
    if (maxUses !== undefined) coupon.maxUses = maxUses

    await coupon.save()
    res.json(coupon)
  } catch (error) {
    console.error('Error updating coupon:', error)
    res.status(500).json({ message: 'Error updating coupon', error })
  }
})

router.delete('/admin/coupons/:id', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const coupon = await Coupon.findByIdAndDelete(req.params.id)
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' })
    }

    res.json({ message: 'Coupon deleted successfully' })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    res.status(500).json({ message: 'Error deleting coupon', error })
  }
})

router.get('/admin/banners', authenticateToken, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' })
  const banners = await Banner.find().sort({ order: 1 })
  res.json(banners)
})

router.post('/admin/banners', authenticateToken, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' })
  const banner = await Banner.create(req.body)
  res.status(201).json(banner)
})

router.put('/admin/banners/:id', authenticateToken, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' })
  const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true })
  res.json(banner)
})

router.delete('/admin/banners/:id', authenticateToken, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' })
  await Banner.findByIdAndDelete(req.params.id)
  res.json({ message: 'Banner deleted' })
})

router.get('/admin/pending-payments', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const allOrders = await Order.find({
      paymentMethod: { $in: ['card', 'cod'] }
    }).sort({ createdAt: -1 })

    res.json(allOrders)
  } catch (error) {
    console.error('Error fetching payments:', error)
    res.status(500).json({ message: 'Error fetching payments', error })
  }
})

router.put('/admin/verify-payment', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { orderId, status, transactionId } = req.body

    if (!orderId || !status) {
      return res.status(400).json({ message: 'Order ID and status are required' })
    }

    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.paymentMethod === 'cod') {
      if (status === 'verified') {
        order.isPaid = true
        order.paidAt = new Date()
        order.paymentResult = {
          ...order.paymentResult,
          status: 'verified',
          verifiedBy: 'admin',
          verifiedAt: new Date()
        }
        if (order.status !== 'Delivered') {
          order.status = 'Processing'
        }
      } else if (status === 'rejected') {
        order.paymentResult = {
          ...order.paymentResult,
          status: 'rejected'
        }
      }
    }

    await order.save()

    res.json({
      message: `Payment ${status}`,
      order
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    res.status(500).json({ message: 'Error verifying payment', error })
  }
})

router.get('/admin/analytics/sales', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const { period = 'week' } = req.query

    let startDate = new Date()
    switch (period) {
      case 'day':
        startDate.setHours(startDate.getHours() - 24)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    const orders = await Order.find({
      createdAt: { $gte: startDate },
      status: { $nin: ['Cancelled'] }
    })

    const salesByDate: Record<string, number> = {}
    orders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0]
      salesByDate[date] = (salesByDate[date] || 0) + order.totalPrice
    })

    const totalSales = orders.reduce((sum, o) => sum + o.totalPrice, 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    res.json({
      totalSales,
      totalOrders,
      averageOrderValue,
      salesByDate,
      period
    })
  } catch (error) {
    console.error('Error fetching sales analytics:', error)
    res.status(500).json({ message: 'Error fetching sales analytics', error })
  }
})

router.get('/admin/analytics/orders', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const totalOrders = await Order.countDocuments()
    const deliveredOrders = await Order.countDocuments({ status: 'Delivered' })
    const pendingOrders = await Order.countDocuments({ status: { $in: ['Order Received', 'Processing'] } })
    const cancelledOrders = await Order.countDocuments({ status: 'Cancelled' })
    const outForDelivery = await Order.countDocuments({ status: 'Out for Delivery' })

    const statusDistribution = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    res.json({
      totalOrders,
      deliveredOrders,
      pendingOrders,
      cancelledOrders,
      outForDelivery,
      statusDistribution: statusDistribution.map(s => ({ status: s._id, count: s.count }))
    })
  } catch (error) {
    console.error('Error fetching order analytics:', error)
    res.status(500).json({ message: 'Error fetching order analytics', error })
  }
})

router.get('/admin/analytics/products', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const totalProducts = await Product.countDocuments()
    const outOfStock = await Product.countDocuments({ stock: 0 })
    const lowStock = await Product.countDocuments({ stock: { $gt: 0, $lte: 10 } })
    const featuredProducts = await Product.countDocuments({ isFeatured: true })

    const lowStockProducts = await Product.find({ stock: { $gt: 0, $lte: 5 } })
      .select('name stock price category')
      .sort({ stock: 1 })
      .limit(10)
      .lean()

    const categoryDistribution = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])

    const topProducts = await Order.aggregate([
      { $match: { status: { $nin: ['Cancelled'] } } },
      { $unwind: '$orderItems' },
      { $group: { _id: '$orderItems.name', totalSold: { $sum: '$orderItems.quantity' }, totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ])

    res.json({
      totalProducts,
      outOfStock,
      lowStock,
      lowStockProducts,
      featuredProducts,
      categoryDistribution: categoryDistribution.map(c => ({ category: c._id, count: c.count })),
      topProducts
    })
  } catch (error) {
    console.error('Error fetching product analytics:', error)
    res.status(500).json({ message: 'Error fetching product analytics', error })
  }
})

router.get('/admin/analytics/users', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const totalUsers = await User.countDocuments()

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })

    const usersWithOrders = await Order.aggregate([
      { $group: { _id: '$user', orderCount: { $sum: 1 }, totalSpent: { $sum: '$totalPrice' } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ])

    res.json({
      totalUsers,
      newUsers,
      topBuyers: usersWithOrders
    })
  } catch (error) {
    console.error('Error fetching user analytics:', error)
    res.status(500).json({ message: 'Error fetching user analytics', error })
  }
})

router.get('/admin/analytics/riders', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    const totalRiders = await Rider.countDocuments()
    const activeRiders = await Rider.countDocuments({ status: 'active' })
    const busyRiders = await Rider.countDocuments({ status: 'busy' })

    const riderPerformance = await Rider.aggregate([
      { $match: { isActive: true } },
      { $sort: { totalDeliveries: -1 } },
      { $limit: 10 }
    ])

    res.json({
      totalRiders,
      activeRiders,
      busyRiders,
      riderPerformance
    })
  } catch (error) {
    console.error('Error fetching rider analytics:', error)
    res.status(500).json({ message: 'Error fetching rider analytics', error })
  }
})

const adminSettings: Record<string, any> = {
  storeName: 'FlikCart',
  storeEmail: 'support@flikcart.com',
  storePhone: '+92 300 1234567',
  storeAddress: '123 Commerce Street, Karachi, Pakistan',
  deliveryCharges: 150,
  freeDeliveryThreshold: 1000,
  returnPolicy: '7 days return policy',
  paymentMethods: ['Cash on Delivery', 'Online Payment'],
  taxRate: 18
}

router.get('/admin/settings', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    res.json(adminSettings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    res.status(500).json({ message: 'Error fetching settings', error })
  }
})

router.put('/admin/settings', authenticateToken, async (req: any, res: Response) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' })
    }

    Object.assign(adminSettings, req.body)
    res.json(adminSettings)
  } catch (error) {
    console.error('Error updating settings:', error)
    res.status(500).json({ message: 'Error updating settings', error })
  }
})

router.get('/admin/reports/sales', authenticateToken, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' })
  const { period } = req.query
  const now = new Date()
  let start: Date
  if (period === '7d') start = new Date(now.getTime() - 7 * 86400000)
  else if (period === '30d') start = new Date(now.getTime() - 30 * 86400000)
  else if (period === '90d') start = new Date(now.getTime() - 90 * 86400000)
  else if (period === '1y') start = new Date(now.getTime() - 365 * 86400000)
  else start = new Date(now.getTime() - 30 * 86400000)

  const orders = await Order.find({
    createdAt: { $gte: start },
    status: { $ne: 'Cancelled' }
  }).lean()

  const totalSales = orders.reduce((s, o) => s + (o.totalPrice || 0), 0)
  const totalOrders = orders.length
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  const daily: Record<string, number> = {}
  orders.forEach(o => {
    const d = new Date(o.createdAt).toISOString().split('T')[0]
    daily[d] = (daily[d] || 0) + (o.totalPrice || 0)
  })

  const categories: Record<string, { sales: number; count: number }> = {}
  orders.forEach((o: any) => {
    const orderItemsArray = o.orderItems || []
    orderItemsArray.forEach((item: any) => {
      const cat = item.category || 'Other'
      if (!categories[cat]) categories[cat] = { sales: 0, count: 0 }
      categories[cat].sales += (item.price || 0) * (item.quantity || 0)
      categories[cat].count += item.quantity || 0
    })
  })

  res.json({
    period: period || '30d',
    totalSales,
    totalOrders,
    averageOrderValue,
    dailyBreakdown: Object.entries(daily).map(([date, sales]) => ({ date, sales })),
    categoryBreakdown: Object.entries(categories).map(([name, data]) => ({ name, ...data }))
  })
})

router.get('/admin/reports/export', authenticateToken, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' })
  const orders = await Order.find().sort({ createdAt: -1 }).limit(1000).lean()
  const header = 'Tracking ID,Customer,Email,Total,Status,Date,Items\n'
  const rows = orders.map((o: any) => {
    const items = (o.orderItems || []).map((i: any) => `${i.name}x${i.quantity}`).join('; ')
    return `"${o.trackingId}","${o.shippingAddress?.fullName || ''}","${o.email || ''}",${o.totalPrice},"${o.status}","${new Date(o.createdAt).toISOString().split('T')[0]}","${items}"`
  }).join('\n')
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename=orders-export.csv')
  res.send(header + rows)
})

router.get('/admin/returns', authenticateToken, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' })
  const returns = await Return.find().populate('order', 'trackingId totalPrice').sort({ createdAt: -1 })
  res.json(returns)
})

router.put('/admin/returns/:id', authenticateToken, async (req: any, res: Response) => {
  if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin only' })
  const ret = await Return.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true })
  res.json(ret)
})

router.post('/admin/reseed-products', async (req: Request, res: Response) => {
  try {
    const { products } = req.body
    await Product.deleteMany({})
    await Product.insertMany(products)
    res.json({ message: 'Products reseeded successfully', count: products.length })
  } catch (error) {
    res.status(500).json({ message: 'Error reseeding products', error })
  }
})

router.get('/banners', async (req: Request, res: Response) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ order: 1 })
    res.json(banners)
  } catch { res.status(500).json({ message: 'Error fetching banners' }) }
})

router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to FlikCart API', version: '1.0.0', status: 'running' })
})

export default router
