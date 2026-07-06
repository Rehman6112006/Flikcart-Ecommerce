'use client'

import { API } from '@/lib/config'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bike, Package, MapPin, Phone, LogOut, 
  Star, CheckCircle, Clock, Navigation,
  User, ChevronRight, AlertCircle, X,
  RefreshCw, Locate, DollarSign, TrendingUp,
  Camera
} from 'lucide-react'

interface Order {
  _id: string
  trackingId: string
  status: string
  shippingAddress: {
    fullName: string
    address: string
    city: string
    state: string
    phone: string
  }
  totalPrice: number
  orderItems: Array<{ name: string; quantity: number; price: number; image?: string }>
  riderLocation?: { lat: number; lng: number; updatedAt: string }
  estimatedDeliveryTime?: string
  createdAt: string
  paymentMethod?: string
}

interface Rider {
  id: string
  name: string
  email: string
  phone: string
  vehicle: string
  photo?: string
  rating: number
  totalDeliveries: number
  status: string
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function RiderDashboardPage() {
  const router = useRouter()
  const [rider, setRider] = useState<Rider | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationSharing, setLocationSharing] = useState(false)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [deliveryPhoto, setDeliveryPhoto] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('riderToken')
    if (!token) { router.push('/rider/login'); return }
    fetchRiderData()
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId) }
  }, [])

  const fetchRiderData = async () => {
    try {
      const riderToken = localStorage.getItem('riderToken')
      const headers = { 'Authorization': `Bearer ${riderToken}` }
      
      const profileRes = await fetch(`${API.base}/api/riders/profile`, { headers })
      if (!profileRes.ok) throw new Error('Failed to load profile')
      const riderData = await profileRes.json()
      setRider(riderData)

      const ordersRes = await fetch(`${API.base}/api/rider/my-orders`, { headers })
      if (ordersRes.ok) {
        const allOrders = await ordersRes.json()
        const ordersArr = Array.isArray(allOrders) ? allOrders : allOrders.orders || []
        setOrders(ordersArr)
        const active = ordersArr.find((o: Order) => 
          o.status === 'Assigned to Rider' || o.status === 'Out for Delivery'
        )
        setActiveOrder(active || null)
        setPendingOrders(ordersArr.filter((o: Order) => o.status === 'Assigned to Rider'))
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const startLocationSharing = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return }
    setLocationSharing(true)
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const riderToken = localStorage.getItem('riderToken')
        await fetch(`${API.base}/api/rider/update-location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${riderToken}` },
          body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        })
      },
      () => setLocationSharing(false),
      { enableHighAccuracy: true, maximumAge: 10000 }
    )
    setWatchId(id)
  }

  const stopLocationSharing = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    setLocationSharing(false)
    setWatchId(null)
  }

  const acceptOrder = async () => {
    if (!selectedOrder) return
    setActionLoading(true)
    try {
      const riderToken = localStorage.getItem('riderToken')
      const res = await fetch(`${API.base}/api/rider/accept-order`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${riderToken}` },
        body: JSON.stringify({ orderId: selectedOrder._id })
      })
      if (res.ok) {
        setActiveOrder(selectedOrder)
        setPendingOrders(pendingOrders.filter(o => o._id !== selectedOrder._id))
        setShowAcceptModal(false)
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to accept order')
      }
    } catch (err) {
      alert('Error accepting order')
    } finally {
      setActionLoading(false)
    }
  }

  const capturePhoto = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Camera not available on this device. You can use file upload instead.')
      fileInputRef.current?.click()
      return
    }
    fileInputRef.current?.click()
  }

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setDeliveryPhoto(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const markDelivered = async () => {
    if (!activeOrder) return
    const isCOD = activeOrder.paymentMethod === 'cod'
    const paymentReceived = isCOD ? confirm('Cash payment received from customer?') : true
    if (!paymentReceived) return

    setActionLoading(true)
    try {
      const riderToken = localStorage.getItem('riderToken')
      const res = await fetch(`${API.base}/api/rider/mark-delivered`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${riderToken}` },
        body: JSON.stringify({
          orderId: activeOrder._id,
          paymentReceived: isCOD,
          photo: deliveryPhoto || '',
          deliveryNotes: 'Delivered successfully'
        })
      })
      if (res.ok) {
        setActiveOrder(null)
        setDeliveryPhoto('')
        fetchRiderData()
      } else {
        const data = await res.json()
        alert(data.message || 'Failed to mark delivered')
      }
    } catch (err) {
      alert('Error marking delivered')
    } finally {
      setActionLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('riderToken')
    localStorage.removeItem('riderData')
    router.push('/rider/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="text-gray-500 mt-4">Loading dashboard...</p>
      </div>
    </div>
  )

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="min-h-screen bg-gray-50"
    >
      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Rider Dashboard</h1>
              <p className="text-xs text-gray-500">{rider?.name || 'Loading...'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchRiderData} className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200">
              <RefreshCw size={18} />
            </button>
            <button onClick={logout} className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all duration-200">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Rider Profile Card */}
        {rider && (
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                {rider.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{rider.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Bike size={14} className="text-blue-500" /> {rider.vehicle}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Star size={14} className="text-yellow-500" /> {rider.rating || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <CheckCircle size={14} className="text-green-500" /> {rider.totalDeliveries || 0} deliveries
                  </span>
                </div>
              </div>
              <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold ${
                rider.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {rider.status === 'active' ? '● Online' : '● Offline'}
              </span>
            </div>
          </motion.div>
        )}

        {/* Active Delivery */}
        {activeOrder ? (
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Navigation className="text-blue-600" size={20} />
                Active Delivery
              </h2>
              <span className="inline-flex px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold">
                In Progress
              </span>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-gray-900 font-semibold">{activeOrder.shippingAddress?.fullName}</p>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <MapPin size={14} /> {activeOrder.shippingAddress?.address}, {activeOrder.shippingAddress?.city}
                    </p>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                      <Phone size={14} /> {activeOrder.shippingAddress?.phone}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">Order Items</p>
                  {activeOrder.orderItems?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-gray-600">{item.name} × {item.quantity}</span>
                      <span className="text-gray-900 font-medium">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                    <span className="text-gray-900 font-bold">Total</span>
                    <span className="text-gray-900 font-bold">Rs. {activeOrder.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {/* Delivery Photo Proof */}
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" capture="environment" ref={fileInputRef}
                    onChange={handlePhotoCapture} className="hidden" />
                  <button onClick={capturePhoto}
                    className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 border ${
                      deliveryPhoto ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {deliveryPhoto ? <><Camera size={16} /> Photo Taken</> : <><Camera size={16} /> Add Photo Proof</>}
                  </button>
                  {deliveryPhoto && (
                    <button onClick={() => setDeliveryPhoto('')}
                      className="p-3 rounded-xl bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button onClick={markDelivered} disabled={actionLoading}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {actionLoading ? 'Processing...' : <><CheckCircle size={20} /> Mark as Delivered</>}
                </button>
                <div className="flex gap-3">
                  <button onClick={locationSharing ? stopLocationSharing : startLocationSharing}
                    className={`flex-1 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                      locationSharing ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}
                  >
                    <Locate size={16} />
                    {locationSharing ? 'Stop Sharing' : 'Share Location'}
                  </button>
                  <Link href={`/track-order?trackingId=${activeOrder.trackingId}`}
                    className="flex-1 py-3 rounded-xl font-medium text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 flex items-center justify-center gap-2 transition-all duration-200"
                  >
                    <MapPin size={16} /> Track
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Pending Orders */
          <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-yellow-500" />
              Available Orders ({pendingOrders.length})
            </h2>
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No pending orders available</p>
                <p className="text-gray-400 text-sm mt-1">Waiting for new orders...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingOrders.map((order) => (
                  <div key={order._id} className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-blue-200 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-gray-900 font-semibold">{order.shippingAddress?.fullName}</p>
                        <p className="text-gray-500 text-sm mt-1">{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">Rs. {order.totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Package size={14} /> {order.orderItems?.length} items</span>
                        <span className="flex items-center gap-1"><Phone size={14} /> {order.shippingAddress?.phone}</span>
                      </div>
                      <button onClick={() => { setSelectedOrder(order); setShowAcceptModal(true) }}
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 transition-all duration-200 shadow-sm"
                      >
                        Accept Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* All Orders */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Order History</h2>
            <Link href="/rider/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View All <ChevronRight size={16} />
            </Link>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No orders yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="text-left py-3 px-2 font-medium">Customer</th>
                    <th className="text-left py-3 px-2 font-medium">Amount</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2 text-gray-900">{order.shippingAddress?.fullName}</td>
                      <td className="py-3 px-2 text-gray-900 font-medium">Rs. {order.totalPrice.toLocaleString()}</td>
                      <td className="py-3 px-2">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'Out for Delivery' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{order.status}</span>
                      </td>
                      <td className="py-3 px-2 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-2">
                        <Link href={`/rider/orders`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Accept Modal */}
      <AnimatePresence>
        {showAcceptModal && selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Accept Order</h3>
                <button onClick={() => setShowAcceptModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              <div className="space-y-3 mb-6 text-sm">
                <p className="text-gray-600"><span className="text-gray-400">Customer:</span> {selectedOrder.shippingAddress?.fullName}</p>
                <p className="text-gray-600"><span className="text-gray-400">Address:</span> {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}</p>
                <p className="text-gray-600"><span className="text-gray-400">Amount:</span> Rs. {selectedOrder.totalPrice.toLocaleString()}</p>
                <p className="text-gray-600"><span className="text-gray-400">Items:</span> {selectedOrder.orderItems?.length}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAcceptModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200">Cancel</button>
                <button onClick={acceptOrder} disabled={actionLoading}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
                >
                  {actionLoading ? 'Accepting...' : 'Accept Order'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
