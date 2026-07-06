import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import { apiLimiter, User, Admin } from './helpers'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}))
app.use('/api/', apiLimiter)
app.use(express.json({ limit: '10kb' }))
app.use(morgan('dev'))

import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import orderRoutes from './routes/orders'
import riderRoutes from './routes/rider'
import adminRoutes from './routes/admin'

app.use('/api', authRoutes)
app.use('/api', productRoutes)
app.use('/api', orderRoutes)
app.use('/api', riderRoutes)
app.use('/api', adminRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error' })
})

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI is not set in .env file!')
  process.exit(1)
}

const seedAdminUser = async () => {
  const adminExists = await User.findOne({ email: 'abdulrehman6112006@gmail.com' })
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await User.create({
      name: 'Admin',
      email: 'abdulrehman6112006@gmail.com',
      password: hashedPassword,
      isAdmin: true,
    })
    await Admin.create({
      name: 'Admin',
      email: 'abdulrehman6112006@gmail.com',
      password: hashedPassword,
    })
    console.log('Default admin created: abdulrehman6112006@gmail.com / admin123')
  } else if (!adminExists.isAdmin) {
    await User.findByIdAndUpdate(adminExists._id, { isAdmin: true })
    const adminInAdmin = await Admin.findOne({ email: 'abdulrehman6112006@gmail.com' })
    if (!adminInAdmin) {
      await Admin.create({
        name: adminExists.name,
        email: adminExists.email,
        password: adminExists.password,
      })
    }
    console.log('Existing user promoted to admin')
  }
}

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully')
    await seedAdminUser()
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

export default app
