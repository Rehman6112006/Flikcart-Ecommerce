'use client'

import { API } from '@/lib/config'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, Package, MapPin, Phone, Clock, 
  CheckCircle, Truck, User, RefreshCw, Home,
  Bike, Navigation, Zap
} from 'lucide-react'

interface OrderData {
  trackingId: string
  status: string
  statusUpdatedAt: string
  isDelivered: boolean
  totalPrice: number
  orderItems: Array<{ name: string; quantity: number; price: number; image?: string }>
  shippingAddress: { fullName: string; address: string; city: string; state: string; phone: string }
  riderInfo?: { name: string; phone: string; photo?: string; vehicle?: string } | null
  riderLocation?: { lat: number; lng: number; updatedAt: string } | null
  estimatedDeliveryTime?: string
  createdAt: string
  orderReceivedAt?: string; processingAt?: string; shippedAt?: string
  assignedToRiderAt?: string; outForDeliveryAt?: string; deliveredAt?: string; cancelledAt?: string
}

interface StatusStep {
  label: string; completed: boolean; current: boolean; timestamp?: string
}

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const [trackingId, setTrackingId] = useState('')
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const urlTrackingId = searchParams.get('trackingId')
    if (urlTrackingId) { setTrackingId(urlTrackingId); fetchOrder(urlTrackingId) }
  }, [searchParams])

  const fetchOrder = async (trackId: string) => {
    if (!trackId.trim()) { setError('Please enter a tracking ID'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API.orders.track}?trackingId=${encodeURIComponent(trackId.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to fetch order')
      setOrderData(data); setLastUpdated(new Date())
    } catch (err: any) { setError(err.message); setOrderData(null) }
    finally { setLoading(false) }
  }

  const handleTrack = (e: React.FormEvent) => { e.preventDefault(); fetchOrder(trackingId) }

  useEffect(() => {
    if (orderData && (orderData.status === 'Out for Delivery' || orderData.status === 'Assigned to Rider')) {
      const interval = setInterval(() => fetchOrder(orderData.trackingId), 15000)
      return () => clearInterval(interval)
    }
  }, [orderData?.status, orderData?.trackingId])

  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      Delivered: 'bg-green-500', 'Out for Delivery': 'bg-orange-500',
      'Assigned to Rider': 'bg-blue-500', Shipped: 'bg-purple-500',
      Processing: 'bg-yellow-500', Cancelled: 'bg-red-500'
    }
    return colors[s] || 'bg-gray-500'
  }

  const getStatusSteps = (): StatusStep[] => {
    if (!orderData) return []
    const s = orderData.status
    const steps: StatusStep[] = [
      { label: 'Order Received', completed: true, current: s === 'Order Received', timestamp: orderData.orderReceivedAt },
      { label: 'Processing', completed: ['Processing', 'Shipped', 'Assigned to Rider', 'Out for Delivery', 'Delivered'].includes(s), current: s === 'Processing', timestamp: orderData.processingAt },
      { label: 'Shipped', completed: ['Shipped', 'Assigned to Rider', 'Out for Delivery', 'Delivered'].includes(s), current: s === 'Shipped', timestamp: orderData.shippedAt },
      { label: 'Out for Delivery', completed: ['Out for Delivery', 'Delivered'].includes(s), current: s === 'Out for Delivery', timestamp: orderData.outForDeliveryAt },
      { label: 'Delivered', completed: s === 'Delivered', current: s === 'Delivered', timestamp: orderData.deliveredAt }
    ]
    if (s === 'Cancelled') steps.push({ label: 'Cancelled', completed: true, current: true, timestamp: orderData.cancelledAt })
    return steps
  }

  const formatDate = (d?: string) => d ? new Date(d).toLocaleString() : ''

  const formatTime = (d?: string) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''

  const isLive = orderData?.status === 'Out for Delivery' || orderData?.status === 'Assigned to Rider'

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">FlikCart</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors">
              <Home size={20} /><span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
            <p className="text-gray-600">Enter your tracking ID to get real-time updates</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <form onSubmit={handleTrack} className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  placeholder="Enter Tracking ID (e.g., TRK-ABC123)"
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                />
              </div>
              <button type="submit" disabled={loading}
                className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                Track
              </button>
            </form>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
              <p className="text-red-600 flex items-center gap-2"><Package className="w-5 h-5" />{error}</p>
            </div>
          )}

          {orderData && (
            <div className="space-y-6">
              {/* ===== LIVE DELIVERY TRACKING (Rider out for delivery) ===== */}
              {isLive && orderData.riderInfo && (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-orange-200">
                  {/* Animated Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 text-white relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white rounded-full animate-ping" style={{ animationDuration: '4s' }} />
                    </div>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <Bike className="w-8 h-8 text-white" />
                          </div>
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-orange-500 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold">Rider is on the way!</h2>
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                              <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                              LIVE
                            </span>
                          </div>
                          <p className="text-orange-100 text-sm">Your order is out for delivery</p>
                        </div>
                      </div>
                      <button onClick={() => fetchOrder(orderData.trackingId)}
                        className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition" title="Refresh">
                        <RefreshCw className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Animated Bike Delivery Visual */}
                  <div className="px-6 pt-6 pb-2">
                    <div className="relative h-24 bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 rounded-2xl overflow-hidden border border-orange-100">
                      {/* Road */}
                      <div className="absolute bottom-4 left-0 right-0 h-2 bg-gray-300">
                        <div className="h-full w-full" style={{
                          background: 'repeating-linear-gradient(90deg, #f97316 0px, #f97316 12px, transparent 12px, transparent 24px)',
                          animation: 'moveRoad 1s linear infinite'
                        }} />
                      </div>

                      {/* Animated Bike */}
                      <div className="absolute bottom-5 left-0 animate-bikeMove" style={{
                        animation: 'bikeMove 8s linear infinite'
                      }}>
                        <div className="relative">
                          {/* Bike SVG */}
                          <svg width="48" height="36" viewBox="0 0 48 36" fill="none" className="drop-shadow-lg">
                            {/* Rear wheel */}
                            <circle cx="14" cy="28" r="7" stroke="#f97316" strokeWidth="2.5" fill="white" />
                            <circle cx="14" cy="28" r="2" fill="#f97316" />
                            {/* Front wheel */}
                            <circle cx="38" cy="28" r="7" stroke="#f97316" strokeWidth="2.5" fill="white" />
                            <circle cx="38" cy="28" r="2" fill="#f97316" />
                            {/* Frame */}
                            <line x1="14" y1="28" x2="22" y2="14" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="22" y1="14" x2="38" y2="28" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                            <line x1="22" y1="14" x2="29" y2="28" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                            {/* Handlebars */}
                            <line x1="38" y1="22" x2="42" y2="14" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
                            {/* Seat */}
                            <line x1="18" y1="12" x2="26" y2="12" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
                            {/* Rider body */}
                            <circle cx="24" cy="8" r="4" fill="#1e293b" />
                          </svg>
                          {/* Movement trail */}
                          <div className="absolute -bottom-1 left-6 w-8 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full animate-pulse" />
                        </div>
                      </div>

                      {/* Start Point */}
                      <div className="absolute bottom-5 left-3 flex flex-col items-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full border-2 border-gray-300" />
                        <span className="text-[10px] text-gray-400 mt-6">Store</span>
                      </div>

                      {/* End Point (Your Location) */}
                      <div className="absolute bottom-5 right-3 flex flex-col items-center">
                        <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-orange-200 shadow-lg animate-pulse" />
                        <span className="text-[10px] text-orange-500 font-semibold mt-6">You</span>
                      </div>
                    </div>
                  </div>

                  {/* Rider Info + Map */}
                  <div className="p-6 pt-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-3 bg-orange-50 rounded-xl">
                        <Bike className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">{orderData.riderInfo.vehicle || 'Motorcycle'}</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-xl">
                        <Navigation className="w-5 h-5 text-green-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">En Route</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-xl">
                        <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">
                          {orderData.estimatedDeliveryTime ? formatTime(orderData.estimatedDeliveryTime) : 'Today'}
                        </p>
                      </div>
                    </div>

                    {/* Rider Card */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm flex-shrink-0">
                        {orderData.riderInfo.photo
                          ? <img src={orderData.riderInfo.photo} alt="" className="w-full h-full rounded-full object-cover" />
                          : orderData.riderInfo.name.charAt(0)
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">{orderData.riderInfo.name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1"><Bike size={14} /> {orderData.riderInfo.vehicle || 'Motorcycle'}</span>
                          <span className="flex items-center gap-1"><Zap size={14} className="text-green-500" /> Delivering</span>
                        </div>
                      </div>
                      <a href={`tel:${orderData.riderInfo.phone}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition font-medium text-sm shadow-sm"
                      >
                        <Phone size={16} /> Call
                      </a>
                    </div>

                    {/* Map */}
                    {orderData.riderLocation && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
                        <div className="relative">
                          <iframe
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${orderData.riderLocation.lng - 0.008},${orderData.riderLocation.lat - 0.008},${orderData.riderLocation.lng + 0.008},${orderData.riderLocation.lat + 0.008}&layer=mapnik&marker=${orderData.riderLocation.lat},${orderData.riderLocation.lng}`}
                            className="w-full h-56"
                            style={{ border: 0 }}
                            loading="lazy"
                            title="Rider Location"
                          />
                          {/* Floating overlay */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg flex items-center gap-2">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs font-medium text-gray-700">Live</span>
                            </div>
                            <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
                              <span className="text-xs text-gray-500">Updated {formatTime(orderData.riderLocation.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== STATUS PROGRESS ===== */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className={`${getStatusColor(orderData.status)} px-6 py-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {orderData.status === 'Delivered' ? <CheckCircle className="w-8 h-8 text-white" />
                        : isLive ? <Truck className="w-8 h-8 text-white" />
                        : <Package className="w-8 h-8 text-white" />}
                      <div>
                        <h2 className="text-xl font-bold text-white">{orderData.status}</h2>
                        <p className="text-white/80 text-sm">Tracking ID: {orderData.trackingId}</p>
                      </div>
                    </div>
                    <button onClick={() => fetchOrder(orderData.trackingId)}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition" title="Refresh">
                      <RefreshCw className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
                      <div className="h-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${((getStatusSteps().findIndex(s => s.current) || 0) / (getStatusSteps().length - 1)) * 100}%` }} />
                    </div>
                    {getStatusSteps().map((step, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${step.completed ? 'bg-orange-500 text-white' : step.current ? 'bg-orange-100 text-orange-500 border-2 border-orange-500' : 'bg-gray-200 text-gray-400'}`}>
                          {step.completed ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-semibold">{index + 1}</span>}
                        </div>
                        <span className={`text-xs mt-2 text-center ${step.current ? 'font-semibold text-orange-600' : 'text-gray-500'}`}>{step.label}</span>
                        {step.timestamp && <span className="text-xs text-gray-400">{new Date(step.timestamp).toLocaleDateString()}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ===== ORDER INFO ===== */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Details</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="text-2xl font-bold text-orange-600">Rs. {orderData.totalPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Order Date</p>
                      <p className="font-medium">{formatDate(orderData.createdAt)}</p>
                    </div>
                    {orderData.estimatedDeliveryTime && (
                      <div>
                        <p className="text-sm text-gray-500">Estimated Delivery</p>
                        <p className="font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-orange-500" />{formatDate(orderData.estimatedDeliveryTime)}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-3">Items</p>
                    <div className="space-y-2">
                      {orderData.orderItems.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.name}</span>
                          <span className="font-medium">Rs. {item.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery Address</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">{orderData.shippingAddress.fullName}</p>
                        <p className="text-sm text-gray-500">{orderData.shippingAddress.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-gray-600">{orderData.shippingAddress.address}</p>
                        <p className="text-gray-600">{orderData.shippingAddress.city}, {orderData.shippingAddress.state}</p>
                      </div>
                    </div>
                  </div>

                  {/* Rider info for non-live statuses */}
                  {!isLive && orderData.riderInfo && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3">Delivery Rider</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {orderData.riderInfo.photo ? <img src={orderData.riderInfo.photo} alt="" className="w-full h-full rounded-full object-cover" /> : orderData.riderInfo.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{orderData.riderInfo.name}</p>
                          {orderData.riderInfo.vehicle && <p className="text-sm text-gray-500">{orderData.riderInfo.vehicle}</p>}
                        </div>
                        <a href={`tel:${orderData.riderInfo.phone}`} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition">
                          <Phone className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {lastUpdated && <p className="text-center text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
            </div>
          )}
        </div>
      </main>

      {/* Bike animation keyframes */}
      <style>{`
        @keyframes bikeMove {
          0% { left: 5%; }
          50% { left: 75%; }
          100% { left: 5%; }
        }
        @keyframes moveRoad {
          0% { background-position: 0 0; }
          100% { background-position: 24px 0; }
        }
      `}</style>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TrackOrderContent />
    </Suspense>
  )
}
