import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { bcrypt, jwt, sendEmail, generateOTP, saveOtp, verifyOtp, getOtpData, authenticateToken, userAuthLimiter, otpLimiter, User, Product, Otp } from '../helpers'

const router = Router()

router.post('/auth/send-otp', otpLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    const otp = generateOTP()
    await saveOtp(email, otp)

    await sendEmail(
      email,
      'FlikCart - Email Verification Code',
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #FF6B00; padding: 20px; text-align: center;"><h1 style="color: white; margin: 0;">FlikCart</h1></div><div style="padding: 30px; background: #f8f9fa;"><h2 style="color: #333;">Email Verification</h2><p style="color: #666;">Your verification code is:</p><div style="background: #fff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;"><span style="font-size: 32px; font-weight: bold; color: #FF6B00; letter-spacing: 8px;">${otp}</span></div><p style="color: #999; font-size: 14px;">This code will expire in 10 minutes.</p></div></div>`
    )
    res.json({ message: 'OTP sent successfully' })
  } catch (error) {
    console.error('Error sending OTP:', error)
    res.status(500).json({ message: 'Error sending OTP. Check email configuration.' })
  }
})

router.post('/auth/resend-otp', otpLimiter, async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    const otp = generateOTP()
    await saveOtp(email, otp)

    await sendEmail(
      email,
      'FlikCart - New Verification Code',
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: #FF6B00; padding: 20px; text-align: center;"><h1 style="color: white; margin: 0;">FlikCart</h1></div><div style="padding: 30px; background: #f8f9fa;"><h2 style="color: #333;">New Verification Code</h2><p style="color: #666;">Your new verification code is:</p><div style="background: #fff; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;"><span style="font-size: 32px; font-weight: bold; color: #FF6B00; letter-spacing: 8px;">${otp}</span></div><p style="color: #999; font-size: 14px;">This code will expire in 10 minutes.</p></div></div>`
    )
    res.json({ message: 'New OTP sent successfully' })
  } catch (error) {
    console.error('Error resending OTP:', error)
    res.status(500).json({ message: 'Error resending OTP. Check email configuration.' })
  }
})

router.post('/auth/verify-otp', otpLimiter, async (req: Request, res: Response) => {
  try {
    const { email, otp, name, password } = req.body
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be a 6-digit number' })
    }

    const record = await getOtpData(email)
    if (!record) return res.status(400).json({ message: 'OTP not found or expired' })
    if (Date.now() > record.expiresAt.getTime()) {
      await Otp.deleteMany({ email })
      return res.status(400).json({ message: 'OTP has expired' })
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' })

    if (name && password) {
      const existingUser = await User.findOne({ email })
      if (existingUser) return res.status(400).json({ message: 'User already exists' })

      const hashedPassword = await bcrypt.hash(password, 10)
      const user = new User({ name, email, password: hashedPassword })
      await user.save()
      await Otp.deleteMany({ email })

      const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
      return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } })
    }

    res.json({ message: 'OTP verified successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error })
  }
})

router.post('/auth/login-with-otp', userAuthLimiter, async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: 'OTP must be a 6-digit number' })
    }

    const record = await getOtpData(email)
    if (!record) return res.status(400).json({ message: 'OTP not found or expired' })
    if (Date.now() > record.expiresAt.getTime()) {
      await Otp.deleteMany({ email })
      return res.status(400).json({ message: 'OTP has expired' })
    }
    if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' })

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'User not found' })

    await Otp.deleteMany({ email })
    const token = jwt.sign({ userId: user._id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } })
  } catch (error) {
    res.status(500).json({ message: 'Error logging in with OTP', error })
  }
})

router.post('/auth/register', userAuthLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ message: 'Name must be between 2 and 50 characters' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    const existingUser = await User.findOne({ email })
    if (existingUser) return res.status(400).json({ message: 'User already exists' })
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({ name, email, password: hashedPassword })
    await user.save()
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } })
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error })
  }
})

router.post('/auth/login', userAuthLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'Invalid credentials' })
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' })
    const token = jwt.sign({ userId: user._id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET!, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } })
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error })
  }
})

router.get('/auth/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error })
  }
})

router.put('/auth/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    const { name, phone, avatar } = req.body
    const user = await User.findByIdAndUpdate(req.user.userId, { name, phone, avatar }, { new: true }).select('-password')
    res.json(user)
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error })
  }
})

router.put('/auth/change-password', authenticateToken, async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' })
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()
    res.json({ message: 'Password changed successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error })
  }
})

router.get('/auth/addresses', authenticateToken, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.userId).select('addresses')
    res.json(user?.addresses || [])
  } catch (error) {
    res.status(500).json({ message: 'Error fetching addresses', error })
  }
})

router.post('/auth/addresses', authenticateToken, async (req: any, res: Response) => {
  try {
    const { fullName, address, city, state, zipCode, country, phone, isDefault } = req.body
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const newAddress = {
      _id: new mongoose.Types.ObjectId(),
      fullName, address, city, state, zipCode, country, phone, isDefault: isDefault || false
    }
    if (isDefault && user.addresses) {
      user.addresses = user.addresses.map((addr: any) => ({ ...addr.toObject(), isDefault: false }))
    }
    user.addresses = user.addresses ? [...user.addresses, newAddress] : [newAddress]
    await user.save()
    res.status(201).json(newAddress)
  } catch (error) {
    res.status(500).json({ message: 'Error adding address', error })
  }
})

router.put('/auth/addresses/:addressId', authenticateToken, async (req: any, res: Response) => {
  try {
    const { fullName, address, city, state, zipCode, country, phone, isDefault } = req.body
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    const addressIndex = user.addresses?.findIndex((addr: any) => addr._id.toString() === req.params.addressId)
    if (addressIndex === -1) return res.status(404).json({ message: 'Address not found' })
    if (isDefault && user.addresses) {
      user.addresses = user.addresses.map((addr: any) => ({ ...addr.toObject(), isDefault: false }))
    }
    user.addresses[addressIndex] = { ...user.addresses[addressIndex].toObject(), fullName, address, city, state, zipCode, country, phone, isDefault: isDefault || false }
    await user.save()
    res.json(user.addresses[addressIndex])
  } catch (error) {
    res.status(500).json({ message: 'Error updating address', error })
  }
})

router.delete('/auth/addresses/:addressId', authenticateToken, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    user.addresses = user.addresses?.filter((addr: any) => addr._id.toString() !== req.params.addressId) || []
    await user.save()
    res.json({ message: 'Address deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting address', error })
  }
})

router.get('/user/profile', authenticateToken, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch { res.status(500).json({ message: 'Error fetching profile' }) }
})

router.get('/wishlist', authenticateToken, async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist')
    res.json(user?.wishlist || [])
  } catch { res.status(500).json({ message: 'Error fetching wishlist' }) }
})

router.post('/wishlist', authenticateToken, async (req: any, res: Response) => {
  try {
    const { productId } = req.body
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { wishlist: productId } })
    res.json({ message: 'Added to wishlist' })
  } catch { res.status(500).json({ message: 'Error adding to wishlist' }) }
})

router.delete('/wishlist', authenticateToken, async (req: any, res: Response) => {
  try {
    const { productId } = req.body
    await User.findByIdAndUpdate(req.user.id, { $pull: { wishlist: productId } })
    res.json({ message: 'Removed from wishlist' })
  } catch { res.status(500).json({ message: 'Error removing from wishlist' }) }
})

router.put('/wishlist/share', authenticateToken, async (req: any, res: Response) => {
  try {
    const { share } = req.body
    await User.findByIdAndUpdate(req.user.id, { wishlistSharePublic: share })
    res.json({ message: 'Wishlist share updated', share })
  } catch { res.status(500).json({ message: 'Error updating wishlist share' }) }
})

router.get('/wishlist/share/:id', async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('wishlist wishlistSharePublic name')
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (!user.wishlistSharePublic) return res.status(403).json({ message: 'Wishlist is private' })
    const products = await Product.find({ _id: { $in: user.wishlist } }).select('name price images category rating')
    res.json({ user: user.name, products })
  } catch { res.status(500).json({ message: 'Error fetching wishlist' }) }
})

export default router
