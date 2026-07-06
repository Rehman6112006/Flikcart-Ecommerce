'use client'

import { useState, useEffect } from 'react'
import { Check, X, Loader2, Search, RefreshCw, CreditCard } from 'lucide-react'
import { API } from '@/lib/config'
import { motion } from 'framer-motion'

interface Order {
  _id: string
  orderItems: Array<{
    name: string
    price: number
    quantity: number
    image?: string
  }>
  totalPrice: number
  status: string
  paymentMethod: string
  paymentResult?: {
    id: string
    status: string
    email?: string
  }
  shippingAddress: {
    fullName: string
    phone: string
    address: string
    city: string
  }
  createdAt: string
  trackingId: string
  isPaid?: boolean
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function PaymentsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'successful' | 'rejected'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [transactionId, setTransactionId] = useState('')

  useEffect(() => {
    fetchPendingPayments()
  }, [])

  const getToken = () => localStorage.getItem('adminToken')

  const fetchPendingPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API.base}/api/admin/pending-payments`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const verifyPayment = async (orderId: string, status: 'verified' | 'rejected') => {
    setProcessing(orderId)
    try {
      const res = await fetch(`${API.base}/api/admin/verify-payment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ orderId, status, transactionId: transactionId || undefined })
      })
      if (res.ok) {
        alert(`Payment ${status === 'verified' ? 'verified' : 'rejected'} successfully!`)
        setSelectedOrder(null)
        setTransactionId('')
        fetchPendingPayments()
      } else {
        const data = await res.json()
        alert(data.message || 'Error processing payment')
      }
    } catch (error) {
      alert('Error processing payment')
    } finally {
      setProcessing(null)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shippingAddress.phone.includes(searchTerm) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.paymentResult?.id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filter === 'all') return matchesSearch
    if (filter === 'pending') return matchesSearch && order.paymentMethod === 'cod' && !order.isPaid
    if (filter === 'successful') return matchesSearch && (order.paymentMethod === 'card' || order.isPaid)
    if (filter === 'rejected') return matchesSearch && order.paymentResult?.status === 'rejected'
    return matchesSearch
  })

    return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 lg:p-6 bg-gray-50 min-h-screen"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-500 mt-1">View and manage all payments (Card & COD)</p>
        </div>
        <button
          onClick={fetchPendingPayments}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-sm">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-sm">Card Payments</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {orders.filter(o => o.paymentMethod === 'card').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-sm">COD Pending</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {orders.filter(o => o.paymentMethod === 'cod' && !o.isPaid).length}
          </p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by order ID, tracking ID, transaction ID, name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'successful', 'rejected'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-medium capitalize transition-all duration-200 ${
                filter === f 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredOrders.length === 0 ? null : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <motion.div key={order._id} variants={itemVariants} className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-gray-400">#{order._id.slice(-8)}</span>
                    {order.trackingId && (
                      <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                        {order.trackingId}
                      </span>
                    )}
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'Payment Verification Pending' ? 'bg-yellow-100 text-yellow-700' :
                      order.paymentResult?.status === 'verified' ? 'bg-green-100 text-green-700' :
                      order.paymentResult?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {order.status === 'Payment Verification Pending' ? 'Pending' : order.paymentResult?.status || order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      {order.paymentMethod === 'card' ? <CreditCard size={14} /> : null}
                      {order.paymentMethod === 'card' ? 'Card' : 'COD'}
                    </span>
                    <span>{order.shippingAddress.fullName}</span>
                    <span>{order.shippingAddress.phone}</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                  {order.paymentResult?.id && (
                    <p className="text-sm text-gray-400 mt-1">
                      Transaction ID: <span className="font-mono">{order.paymentResult.id}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl lg:text-2xl font-bold text-gray-900">Rs. {order.totalPrice.toFixed(2)}</p>
                    <p className="text-sm text-gray-500">{order.orderItems.length} items</p>
                  </div>
                  
                  {order.paymentMethod === 'cod' && !order.isPaid && order.status !== 'Delivered' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => verifyPayment(order._id, 'verified')}
                        disabled={processing === order._id}
                        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50 transition-all duration-200"
                      >
                        <Check size={16} /> Mark Paid
                      </button>
                    </div>
                  )}
                  
                  {order.paymentMethod === 'card' && (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-medium">
                      ✓ Paid (Card)
                    </span>
                  )}
                  {order.paymentMethod === 'cod' && order.isPaid && (
                    <span className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-medium">
                      ✓ Paid (COD)
                    </span>
                  )}
                  {order.paymentMethod === 'cod' && !order.isPaid && (
                    <span className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl font-medium">
                      ⏳ Pending (COD)
                    </span>
                  )}
                  {order.paymentResult?.status === 'rejected' && (
                    <span className="px-4 py-2 bg-red-100 text-red-700 rounded-xl font-medium">
                      ✗ Rejected
                    </span>
                  )}
                  {order.paymentMethod === 'cod' && (
                    <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium">
                      COD
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {order.orderItems.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                      <span className="text-gray-900 text-sm truncate max-w-[150px]">{item.name}</span>
                      <span className="text-gray-500 text-xs">x{item.quantity}</span>
                    </div>
                  ))}
                  {order.orderItems.length > 4 && (
                    <div className="bg-gray-50 rounded-lg px-3 py-1.5 text-gray-500 text-sm">
                      +{order.orderItems.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full border border-gray-100 shadow-xl"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Verify Payment</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order ID</span>
                <span className="text-gray-900 font-mono">#{selectedOrder._id.slice(-8)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer</span>
                <span className="text-gray-900">{selectedOrder.shippingAddress.fullName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone</span>
                <span className="text-gray-900">{selectedOrder.shippingAddress.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="text-gray-900 font-bold">Rs. {selectedOrder.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Transaction ID</span>
                <span className="text-gray-900 font-mono">{selectedOrder.paymentResult?.id || 'Not provided'}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction ID (Optional - for reference)
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID if not provided"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setSelectedOrder(null); setTransactionId('') }}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium flex items-center justify-center gap-2 transition-all duration-200"
              >
                <X size={18} /> Cancel
              </button>
              <button
                onClick={() => verifyPayment(selectedOrder._id, 'rejected')}
                disabled={processing === selectedOrder._id}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200"
              >
                {processing === selectedOrder._id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <X size={18} />
                )} Reject
              </button>
              <button
                onClick={() => verifyPayment(selectedOrder._id, 'verified')}
                disabled={processing === selectedOrder._id}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-all duration-200"
              >
                {processing === selectedOrder._id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )} Verify
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
