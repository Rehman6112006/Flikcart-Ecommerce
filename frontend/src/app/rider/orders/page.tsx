'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { 
  Package, 
  MapPin, 
  Clock,
  CheckCircle,
  Truck,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Save,
  X
} from 'lucide-react'
import { motion } from 'framer-motion'

interface Order {
  _id: string
  trackingId: string
  orderItems: Array<{
    name: string
    price: number
    quantity: number
    image: string
  }>
  totalPrice: number
  status: string
  createdAt: string
  shippingAddress: {
    fullName: string
    address: string
    city: string
    phone: string
  }
  paymentMethod?: string
}

interface RiderProfile {
  _id: string
  name: string
  email: string
  phone: string
  photo?: string
  vehicle: string
  rating: number
  totalDeliveries: number
  status: string
}

const ORDER_STATUSES = ['Assigned to Rider', 'Out for Delivery', 'Delivered', 'Cancelled']

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function RiderOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [profile, setProfile] = useState<RiderProfile | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const riderToken = localStorage.getItem('riderToken')
      const headers = { 
        'Authorization': `Bearer ${riderToken}`,
        'Content-Type': 'application/json'
      }

      const profileRes = await fetch(`${API.base}/api/riders/profile`, { headers })
      const profileData = await profileRes.json()
      setProfile(profileData)

      const ordersRes = await fetch(`${API.base}/api/riders/orders`, { headers })
      const ordersData = await ordersRes.json()
      setOrders(ordersData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const acceptOrder = async (orderId: string) => {
    setUpdating(true)
    try {
      const riderToken = localStorage.getItem('riderToken')
      const res = await fetch(`${API.base}/api/rider/accept-order`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${riderToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error accepting order:', error)
    } finally {
      setUpdating(false)
    }
  }

  const markDelivered = async (orderId: string, paymentReceived: boolean = false) => {
    setUpdating(true)
    try {
      const riderToken = localStorage.getItem('riderToken')
      const res = await fetch(`${API.base}/api/rider/mark-delivered`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${riderToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          orderId, 
          deliveryNotes: 'Delivered successfully',
          paymentReceived: paymentReceived
        })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error marking delivered:', error)
    } finally {
      setUpdating(false)
    }
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderModal(true)
  }

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter((o: Order) => o.status === statusFilter)

  const pendingOrders = orders.filter((o: Order) => o.status === 'Out for Delivery' || o.status === 'Assigned to Rider')
  const deliveredOrders = orders.filter((o: Order) => o.status === 'Delivered')

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 bg-gray-50 min-h-screen"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-gray-500">Manage your delivery orders</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-gray-900">{pendingOrders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-xl font-bold text-gray-900">{deliveredOrders.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Orders</option>
            {ORDER_STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div variants={itemVariants} className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No orders found</p>
          </motion.div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div key={order._id} variants={itemVariants} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-sm text-blue-600">{order.trackingId}</span>
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                      order.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-gray-900 font-medium">{order.shippingAddress?.fullName}</p>
                  <p className="text-gray-500 text-sm">{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
                  <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" /> {order.shippingAddress?.phone}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-blue-600 font-bold">Rs {order.totalPrice.toLocaleString()}</p>
                    <p className="text-gray-500 text-sm">{order.orderItems?.length || 0} items</p>
                    <p className="text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => viewOrderDetails(order)}
                      className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm hover:bg-gray-100 border border-gray-200 transition-all duration-200"
                    >
                      Details
                    </button>
                    {order.status === 'Assigned to Rider' && (
                      <button
                        onClick={() => acceptOrder(order._id)}
                        disabled={updating}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
                      >
                        {updating ? 'Accepting...' : 'Accept'}
                      </button>
                    )}
                    {order.status === 'Out for Delivery' && (
                      <button
                        onClick={() => {
                          if (order.paymentMethod === 'cod') {
                            if (confirm('Did you receive cash payment from customer?')) {
                              markDelivered(order._id, true)
                            }
                          } else {
                            markDelivered(order._id, false)
                          }
                        }}
                        disabled={updating}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 transition-all duration-200"
                      >
                        {updating ? 'Delivering...' : 'Mark Delivered'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-gray-500 text-sm">Tracking ID</p>
                <p className="text-gray-900 font-mono">{selectedOrder.trackingId}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-gray-500 text-sm">Delivery Address</p>
                <p className="text-gray-900">{selectedOrder.shippingAddress?.fullName}</p>
                <p className="text-gray-500 text-sm">{selectedOrder.shippingAddress?.address}</p>
                <p className="text-gray-500 text-sm">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.phone}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-gray-500 text-sm mb-2">Items</p>
                {selectedOrder.orderItems?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2 border-b border-gray-200 last:border-0">
                    <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm">{item.name}</p>
                      <p className="text-gray-500 text-xs">Qty: {item.quantity} × Rs {item.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between">
                  <p className="text-gray-500">Total</p>
                  <p className="text-blue-600 font-bold">Rs {selectedOrder.totalPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
