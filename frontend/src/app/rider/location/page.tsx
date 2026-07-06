'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MapPin, Navigation, Locate, LocateFixed, 
  RefreshCw, Truck, Clock, CheckCircle,
  Play, Square, ExternalLink
} from 'lucide-react'

interface RiderProfile {
  _id: string
  name: string
  status: string
  currentLocation?: {
    lat: number
    lng: number
    updatedAt: string
  }
}

interface Order {
  _id: string
  trackingId: string
  status: string
  shippingAddress: {
    fullName: string
    address: string
    city: string
    phone: string
  }
  riderLocation?: {
    lat: number
    lng: number
    updatedAt: string
  }
}

export default function RiderLocationPage() {
  const [rider, setRider] = useState<RiderProfile | null>(null)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationSharing, setLocationSharing] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [stats, setStats] = useState({ totalUpdates: 0, totalOrders: 0 })

  useEffect(() => {
    fetchData()
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId) }
  }, [])

  const fetchData = async () => {
    try {
      const riderToken = localStorage.getItem('riderToken')
      const headers = { 'Authorization': `Bearer ${riderToken}` }

      const profileRes = await fetch(`${API.base}/api/riders/profile`, { headers })
      if (!profileRes.ok) return
      const profileData = await profileRes.json()
      setRider(profileData)
      if (profileData.currentLocation?.lat) {
        setCurrentPos({ lat: profileData.currentLocation.lat, lng: profileData.currentLocation.lng })
      }

      const ordersRes = await fetch(`${API.base}/api/rider/my-orders`, { headers })
      if (ordersRes.ok) {
        const orders = await ordersRes.json()
        const ordersArr = Array.isArray(orders) ? orders : orders.orders || []
        setStats(prev => ({ ...prev, totalOrders: ordersArr.length }))
        const active = ordersArr.find((o: Order) => 
          o.status === 'Out for Delivery' || o.status === 'Assigned to Rider'
        )
        setActiveOrder(active || null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const startSharing = () => {
    if (!navigator.geolocation) { alert('Geolocation not supported'); return }
    setLocationSharing(true)
    let updateCount = 0
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        setCurrentPos({ lat: latitude, lng: longitude })
        setLastUpdated(new Date().toLocaleTimeString())
        updateCount++
        setStats(prev => ({ ...prev, totalUpdates: updateCount }))

        const riderToken = localStorage.getItem('riderToken')
        await fetch(`${API.base}/api/rider/update-location`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${riderToken}` },
          body: JSON.stringify({ latitude, longitude })
        })
      },
      (err) => {
        console.error('Geolocation error:', err)
        setLocationSharing(false)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )
    setWatchId(id)
  }

  const stopSharing = () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId)
    setLocationSharing(false)
    setWatchId(null)
  }

  const mapUrl = currentPos
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${currentPos.lng - 0.01},${currentPos.lat - 0.01},${currentPos.lng + 0.01},${currentPos.lat + 0.01}&layer=mapnik&marker=${currentPos.lat},${currentPos.lng}`
    : ''

  const directionUrl = activeOrder?.shippingAddress
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeOrder.shippingAddress.address + ', ' + activeOrder.shippingAddress.city)}`
    : '#'

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Live Location</h1>
              <p className="text-xs text-gray-500">{locationSharing ? 'Sharing in real-time' : 'Not sharing'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {locationSharing && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-xl text-xs font-bold">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
            <button onClick={fetchData} className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-3 gap-6">
        {/* Left - Stats & Controls */}
        <div className="space-y-6">
          {/* Status Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Location Status</h2>
              <div className={`w-3 h-3 rounded-full ${locationSharing ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-medium ${rider?.status === 'active' ? 'text-green-600' : rider?.status === 'busy' ? 'text-yellow-600' : 'text-gray-500'}`}>
                  {rider?.status || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Total Updates</span>
                <span className="text-sm font-bold text-gray-900">{stats.totalUpdates}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm text-gray-900">{lastUpdated || 'N/A'}</span>
              </div>
              {currentPos && (
                <div className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-xs text-blue-500 mb-1">Current Coordinates</p>
                  <p className="text-sm font-mono text-blue-700">
                    {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={locationSharing ? stopSharing : startSharing}
              className={`w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                locationSharing 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {locationSharing ? <Square size={18} /> : <Play size={18} />}
              {locationSharing ? 'Stop Sharing' : 'Start Sharing'}
            </button>
          </motion.div>

          {/* Active Delivery */}
          {activeOrder && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6"
            >
              <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5 text-blue-600" />
                Active Delivery
              </h2>
              <div className="space-y-3">
                <p className="font-semibold text-gray-900">{activeOrder.shippingAddress?.fullName}</p>
                <p className="text-sm text-gray-500">{activeOrder.shippingAddress?.address}, {activeOrder.shippingAddress?.city}</p>
                <p className="text-sm text-gray-500">{activeOrder.shippingAddress?.phone}</p>
                <a href={directionUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-medium text-sm justify-center hover:bg-blue-100 transition-all"
                >
                  <Navigation size={16} /> Get Directions
                </a>
              </div>
            </motion.div>
          )}

          {/* Quick Stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="font-bold text-gray-900 mb-4">Tracking Summary</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <LocateFixed className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.totalUpdates}</p>
                <p className="text-xs text-gray-500">Updates</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Truck className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-xs text-gray-500">Orders</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{rider?.status === 'active' ? 'Online' : rider?.status === 'busy' ? 'Busy' : 'Offline'}</p>
                <p className="text-xs text-gray-500">Status</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <MapPin className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{currentPos ? 'Live' : 'N/A'}</p>
                <p className="text-xs text-gray-500">Signal</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right - Map */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                {currentPos ? 'Your Location' : 'Location Unavailable'}
              </h2>
              {currentPos && (
                <a href={`https://www.openstreetmap.org/?mlat=${currentPos.lat}&mlon=${currentPos.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink size={14} /> Open Map
                </a>
              )}
            </div>
            <div className="relative">
              {currentPos ? (
                <iframe
                  src={mapUrl}
                  className="w-full h-[500px] lg:h-[600px]"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Rider Location Map"
                />
              ) : (
                <div className="h-[500px] lg:h-[600px] flex flex-col items-center justify-center bg-gray-50">
                  <MapPin className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No location data</p>
                  <p className="text-gray-400 text-sm mt-1">Click "Start Sharing" to begin tracking</p>
                </div>
              )}
              {locationSharing && (
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">Tracking Active</span>
                </div>
              )}
              {activeOrder?.shippingAddress && (
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg max-w-xs">
                  <p className="text-xs text-gray-500">Delivery Destination</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{activeOrder.shippingAddress.fullName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activeOrder.shippingAddress.address}, {activeOrder.shippingAddress.city}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
