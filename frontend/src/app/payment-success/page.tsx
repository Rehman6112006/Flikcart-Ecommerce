'use client'

import { API } from '@/lib/config'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check, Home, Package, ShoppingBag, Clock, AlertCircle } from 'lucide-react'

export default function PaymentSuccessPage() {
  const [orderId, setOrderId] = useState('')
  const [orderData, setOrderData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const orderIdFromUrl = urlParams.get('orderId')
    if (orderIdFromUrl) {
      setOrderId(orderIdFromUrl)
      fetchOrderDetails(orderIdFromUrl)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchOrderDetails = async (id: string) => {
    try {
      const res = await fetch(`${API.orders.details(id)}`)
      if (res.ok) {
        const data = await res.json()
        setOrderData(data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  // For card: always show verified if order exists
  // For COD: show pending until delivered
  const isVerified = orderData && (
    orderData.paymentMethod === 'card' || 
    orderData.isPaid === true
  )
  
  const isPending = orderData?.paymentMethod === 'cod' && orderData?.status !== 'Delivered'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl p-6 lg:p-12 max-w-lg w-full text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${
            isVerified 
              ? 'bg-gradient-to-br from-green-400 to-green-600' 
              : 'bg-gradient-to-br from-yellow-400 to-orange-500'
          }`}
        >
          {isVerified ? (
            <Check className="w-12 h-12 text-white" strokeWidth={4} />
          ) : (
            <Clock className="w-12 h-12 text-white" strokeWidth={4} />
          )}
        </motion.div>

        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3"
        >
          {isPending 
            ? 'Order Placed - Cash on Delivery' 
            : isVerified 
            ? 'Payment Successful!' 
            : 'Order Placed - Awaiting Verification'}
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-2"
        >
          {isPending 
            ? 'You will pay when your order is delivered' 
            : isVerified 
            ? 'Thank you for your payment' 
            : 'Your order has been placed and is awaiting verification'}
        </motion.p>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="text-sm text-gray-500 mb-6"
        >
          {isPending
            ? 'Pay cash to rider when order is delivered'
            : isVerified
            ? 'Your order is being processed'
            : 'You will be notified once payment is verified'}
        </motion.p>

        {isPending ? (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-center gap-2 text-purple-700">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">Cash on Delivery</span>
            </div>
            <p className="text-xs text-purple-600 mt-2">
              Please pay cash to the rider when your order is delivered
            </p>
          </motion.div>
        ) : !isVerified && !loading && orderData && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-center gap-2 text-yellow-700">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">Payment verification pending</span>
            </div>
            <p className="text-xs text-yellow-600 mt-2">
              Your order will be processed after admin verifies your payment
            </p>
          </motion.div>
        )}

        {orderId && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="bg-gray-50 rounded-xl p-4 mb-6"
          >
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-mono text-lg font-bold text-gray-800">{orderId.slice(-8).toUpperCase()}</p>
            {orderData?.trackingId && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">Tracking ID</p>
                <p className="font-mono text-lg font-bold text-blue-600">{orderData.trackingId}</p>
              </div>
            )}
            {orderData?.paymentResult?.id && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">Transaction ID</p>
                <p className="font-mono text-sm font-bold text-gray-800">{orderData.paymentResult.id}</p>
              </div>
            )}
          </motion.div>
        )}

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-3 mb-8"
        >
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Package size={18} className={isVerified || isPending ? "text-green-500" : "text-yellow-500"} />
            <span className="text-sm">
              {isPending 
                ? 'Pay cash to rider when order is delivered'
                : isVerified 
                ? 'Order will be delivered within 3-5 business days'
                : 'Order processing starts after payment verification'}
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Check size={18} className={isVerified || isPending ? "text-green-500" : "text-yellow-500"} />
            <span className="text-sm">
              {orderData?.paymentMethod === 'cod' 
                ? 'Cash on Delivery - Pay when you receive'
                : isVerified
                ? 'Card payment verified'
                : 'Payment awaiting verification'}
            </span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <Link 
            href="/dashboard" 
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
          >
            <Package size={20} />
            View My Orders
          </Link>
          <Link 
            href="/products" 
            className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
          >
            <ShoppingBag size={20} />
            Continue Shopping
          </Link>
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-all"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
