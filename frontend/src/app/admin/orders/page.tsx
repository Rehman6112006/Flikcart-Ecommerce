'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  Users, 
  Truck, 
  RefreshCw, 
  Filter, 
  Eye,
  X,
  ShoppingBag
} from 'lucide-react'
import { API } from '@/lib/config'
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
  user: string
  shippingAddress: {
    fullName: string
    address: string
    city: string
    phone: string
  }
  riderId?: string
  riderName?: string
}

interface Rider {
  _id: string
  name: string
  email: string
  phone: string
  photo?: string
  vehicle: string
  status: string
  rating: number
  totalDeliveries: number
  activeOrders: number
  isActive: boolean
  createdAt: string
}

const ORDER_STATUSES = [
  'Order Received',
  'Processing',
  'Shipped',
  'Assigned to Rider',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
]

const RIDER_STATUSES = ['active', 'offline', 'busy', 'suspended']

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedRiderId, setSelectedRiderId] = useState('')
  const [assigning, setAssigning] = useState(false)

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null)

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const headers = { 
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }

      const ordersRes = await fetch(`${API.admin.orders}?status=${statusFilter}`, { headers })
      const ordersData = await ordersRes.json()
      setOrders(ordersData.orders || [])

      const ridersRes = await fetch(API.admin.riders, { headers })
      const ridersData = await ridersRes.json()
      setRiders(Array.isArray(ridersData) ? ridersData : [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${API.base}/api/admin/update-order-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderId, newStatus })
      })

      if (res.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const assignRider = async () => {
    if (!selectedOrder || !selectedRiderId) return

    setAssigning(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${API.base}/api/admin/update-order-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          orderId: selectedOrder._id, 
          newStatus: 'Assigned to Rider',
          assignedRiderId: selectedRiderId
        })
      })

      if (res.ok) {
        setShowAssignModal(false)
        setSelectedOrder(null)
        setSelectedRiderId('')
        fetchData()
      }
    } catch (error) {
      console.error('Error assigning rider:', error)
    } finally {
      setAssigning(false)
    }
  }

  const viewOrderDetails = (order: Order) => {
    setSelectedOrderDetails(order)
    setShowOrderModal(true)
  }

  const totalSales = orders.reduce((sum: number, order: Order) => sum + order.totalPrice, 0)
  const totalOrders = orders.length

  const availableRiders = Array.isArray(riders) ? riders.filter((r: Rider) => r.status === 'active' || r.status === 'offline') : []

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter((o: Order) => o.status === statusFilter)

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 bg-gray-50 min-h-screen"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage customer orders</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">Rs</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">Rs {totalSales.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Riders</p>
              <p className="text-xl font-bold text-gray-900">{riders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Riders</p>
              <p className="text-xl font-bold text-gray-900">
                {riders.filter((r: Rider) => r.status === 'active' || r.status === 'busy').length}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
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

      {/* Orders Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : filteredOrders.length === 0 ? null : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100 bg-gray-50">
                  <th className="p-4 font-medium">Tracking ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Rider</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-sm text-blue-600">{order.trackingId || order._id.slice(-8)}</td>
                    <td className="p-4 text-gray-900">
                      <div>
                        <p>{order.shippingAddress?.fullName || 'Guest'}</p>
                        <p className="text-xs text-gray-500">{order.shippingAddress?.city}</p>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">{order.orderItems?.length || 0} items</td>
                    <td className="p-4 font-semibold text-gray-900">Rs {order.totalPrice.toLocaleString()}</td>
                    <td className="p-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className="text-sm bg-gray-50 text-gray-900 border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500"
                      >
                        {ORDER_STATUSES.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      {order.riderName ? (
                        <span className="text-sm text-blue-600">{order.riderName}</span>
                      ) : (
                        <button
                          onClick={() => { setSelectedOrder(order); setShowAssignModal(true); }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Assign
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Assign Rider Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-100"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Rider</h3>
            <p className="text-gray-500 mb-4">
              Order: <span className="text-blue-600 font-mono">{selectedOrder.trackingId || selectedOrder._id.slice(-8)}</span>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Rider</label>
              <select
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a rider...</option>
                {availableRiders.map((rider) => (
                  <option key={rider._id} value={rider._id}>
                    {rider.name} - {rider.vehicle}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedOrder(null); setSelectedRiderId(''); }}
                className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={assignRider}
                disabled={!selectedRiderId || assigning}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
              >
                {assigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrderDetails && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-gray-500 text-sm">Tracking ID</p>
                <p className="text-gray-900 font-mono">{selectedOrderDetails.trackingId || selectedOrderDetails._id}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-gray-500 text-sm">Customer</p>
                <p className="text-gray-900">{selectedOrderDetails.shippingAddress?.fullName}</p>
                <p className="text-gray-500 text-sm">{selectedOrderDetails.shippingAddress?.address}, {selectedOrderDetails.shippingAddress?.city}</p>
                <p className="text-gray-500 text-sm">{selectedOrderDetails.shippingAddress?.phone}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-gray-500 text-sm mb-2">Items</p>
                {selectedOrderDetails.orderItems?.map((item, idx) => (
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
                  <p className="text-gray-900 font-bold">Rs {selectedOrderDetails.totalPrice.toLocaleString()}</p>
                </div>
              </div>

              {selectedOrderDetails.riderName && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-gray-500 text-sm">Assigned Rider</p>
                  <p className="text-gray-900">{selectedOrderDetails.riderName}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
