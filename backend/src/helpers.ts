import dotenv from 'dotenv'
dotenv.config()

import validator from 'validator'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import Stripe from 'stripe'
import rateLimit from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'

import { Admin } from './models/Admin'
import { Otp } from './models/Otp'
import { User } from './models/User'
import { Product } from './models/Product'
import { Order } from './models/Order'
import { Rider } from './models/Rider'
import { Coupon } from './models/Coupon'
import { Review } from './models/Review'
import { Notification } from './models/Notification'
import { Banner } from './models/Banner'
import { Return } from './models/Return'

const stripeKey = (process.env.STRIPE_SECRET_KEY || '').trim().replace(/^["']|["']$/g, '')
if (!stripeKey) {
  console.error('ERROR: STRIPE_SECRET_KEY is not set in .env file!')
  process.exit(1)
}
const stripe = new Stripe(stripeKey)

const RESEND_API_KEY = process.env.RESEND_API_KEY
let resendClient: Resend | null = null
if (RESEND_API_KEY) {
  resendClient = new Resend(RESEND_API_KEY)
} else {
  console.warn('WARNING: RESEND_API_KEY not set in .env. Falling back to nodemailer.')
}

const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : ''
let nodemailerTransporter: nodemailer.Transporter | null = null
if (EMAIL_USER && EMAIL_PASS) {
  nodemailerTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  })
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'abdulrehman6112006@gmail.com'
const FROM_NAME = process.env.EMAIL_FROM_NAME || 'FlikCart'

const sendEmail = async (to: string, subject: string, html: string) => {
  let lastError: Error | null = null

  if (resendClient) {
    try {
      await resendClient.emails.send({
        from: `${FROM_NAME} <onboarding@resend.dev>`,
        to, subject, html,
      })
      if (nodemailerTransporter) {
        nodemailerTransporter.sendMail({ from: `"${FROM_NAME}" <${FROM_EMAIL}>`, to, subject, html }).catch(() => {})
      }
      return
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn('Resend failed, trying nodemailer fallback:', err)
    }
  }

  if (nodemailerTransporter) {
    try {
      await nodemailerTransporter.sendMail({ from: `"${FROM_NAME}" <${FROM_EMAIL}>`, to, subject, html })
      return
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.error('Nodemailer also failed:', err)
    }
  }

  throw lastError || new Error('No email provider configured. Set RESEND_API_KEY or EMAIL_USER/EMAIL_PASS in .env')
}

const sendOrderStatusEmail = async (order: any, newStatus: string) => {
  const recipientEmail = order.email
  if (!recipientEmail) return

  const statusMessages: Record<string, string> = {
    'Order Received': 'Your order has been received and is being reviewed.',
    'Processing': 'Your order is now being processed in our warehouse.',
    'Shipped': 'Your order has been shipped and is on the way!',
    'Out for Delivery': 'Your order is out for delivery and will arrive soon!',
    'Delivered': 'Your order has been delivered. Enjoy!',
    'Cancelled': `Your order has been cancelled. ${order.cancellationReason ? 'Reason: ' + order.cancellationReason : ''}`,
  }

  const message = statusMessages[newStatus] || `Your order status has been updated to: ${newStatus}`
  const subject = newStatus === 'Cancelled' ? 'Order Cancelled - FlikCart' : `Order ${newStatus} - FlikCart`

  try {
    await sendEmail(
      recipientEmail,
      subject,
      `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><div style="background:#2563EB;padding:20px;text-align:center"><h1 style="color:white;margin:0">FlikCart</h1></div><div style="padding:30px;background:#f8f9fa"><h2 style="color:#333">${subject}</h2><p style="color:#666">${message}</p><p style="color:#666">Order #: ${order._id}</p><p style="color:#999;font-size:14px">Track your order: <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/track-order?trackingId=${order.trackingNumber || ''}" style="color:#2563EB">here</a></p></div></div>`
    )
  } catch (err) {
    console.error('Email notification failed:', err)
  }
}

const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const saveOtp = async (email: string, otp: string): Promise<void> => {
  await Otp.deleteMany({ email })
  await Otp.create({
    email, otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  })
}

const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
  const record = await Otp.findOne({ email })
  if (!record) return false
  const valid = record.otp === otp && record.expiresAt > new Date()
  await Otp.deleteMany({ email })
  return valid
}

const getOtpData = async (email: string) => {
  return Otp.findOne({ email })
}

const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Authentication required' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded
    next()
  } catch (err: any) {
    console.error('Auth error:', err.message)
    res.status(403).json({ message: 'Invalid or expired token. Please login again.' })
  }
}

const userAuthLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 10,
  message: { message: "Too many attempts. Try again after 5 minutes." },
  standardHeaders: true, legacyHeaders: false,
})

const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 10,
  message: { message: "Too many admin login attempts. Try again after 5 minutes." },
  standardHeaders: true, legacyHeaders: false,
})

const riderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 15,
  message: { message: "Too many rider login attempts. Try again after 5 minutes." },
  standardHeaders: true, legacyHeaders: false,
})

const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 100,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true, legacyHeaders: false,
})

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 5,
  message: { message: "Too many OTP requests. Try again after 5 minutes." },
  standardHeaders: true, legacyHeaders: false,
})

const orderLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 30,
  message: { message: "Too many order requests. Try again later." },
  standardHeaders: true, legacyHeaders: false,
})

const reviewLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 10,
  message: { message: "Too many review requests. Try again later." },
  standardHeaders: true, legacyHeaders: false,
})

const couponLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, max: 20,
  message: { message: "Too many coupon requests. Try again later." },
  standardHeaders: true, legacyHeaders: false,
})

const categoryImages: Record<string, string[]> = {
  'Electronics': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
    'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600',
    'https://images.unsplash.com/photo-1541140532154-b024d9a0dd04?w=600',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600',
    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=600',
  ],
  'Fashion': [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
    'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
  ],
  'Sports': [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600',
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600',
    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600',
    'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600',
    'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600',
  ],
  'Home & Living': [
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600',
    'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600',
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
    'https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=600',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600',
  ],
  'Beauty': [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600',
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600',
    'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600',
    'https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=600',
  ],
  'Toys & Games': [
    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600',
    'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=600',
    'https://images.unsplash.com/photo-1559715745-e1b33a271c8f?w=600',
    'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=600',
    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=600',
    'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=600',
    'https://images.unsplash.com/photo-1566576912329-b4f2d6c1c1c7?w=600',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600',
  ],
}

const generateProductImage = (category: string, index: number): string => {
  const images = categoryImages[category] || categoryImages['Electronics']
  return images[index % images.length]
}

const createNotification = async (data: any) => {
  try { await Notification.create(data) } catch {}
}

export {
  validator, crypto,
  bcrypt, jwt, stripe,
  sendEmail, sendOrderStatusEmail,
  authenticateToken,
  generateOTP, saveOtp, verifyOtp, getOtpData,
  categoryImages, generateProductImage, createNotification,
  userAuthLimiter, adminLimiter, riderLimiter, apiLimiter,
  otpLimiter, orderLimiter, reviewLimiter, couponLimiter,
  Admin, Otp, User, Product, Order, Rider, Coupon, Review, Notification, Banner, Return,
}
