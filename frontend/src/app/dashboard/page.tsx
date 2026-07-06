'use client'

import { API } from '@/lib/config'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package, User, Settings, EyeOff, Save, Trash2, Menu, X, ChevronDown, ChevronUp, FileText, RotateCcw, AlertTriangle } from 'lucide-react'

interface OrderItem {
  product: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface ShippingAddress {
  _id?: string
  fullName: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

interface Order {
  _id: string
  orderItems: OrderItem[]
  totalPrice: number
  status: string
  createdAt: string
  shippingAddress: ShippingAddress
  paymentMethod: string
  trackingNumber?: string
  trackingId?: string
  riderId?: string
  riderName?: string
  riderPhone?: string
  riderLocation?: {
    lat: number
    lng: number
    updatedAt: string
  }
  estimatedDeliveryTime?: string
  paymentResult?: {
    id: string
    status: string
    email?: string
  }
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState('orders')
  const [loading, setLoading] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')

  // Cancel order modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (!userStr) {
      router.push('/login')
      return
    }
    const userData = JSON.parse(userStr)
    setUser(userData)
    setName(userData.name || '')
    setPhone(userData.phone || '')
    fetchOrders()
    
    const tab = searchParams.get('tab')
    if (tab === 'settings' || tab === 'profile') {
      setActiveTab(tab)
    }
  }, [searchParams, router])

  const getToken = () => localStorage.getItem('token')

  const fetchOrders = async () => {
    try {
      const userStr = localStorage.getItem('user')
      const userData = userStr ? JSON.parse(userStr) : null
      if (!userData) return
      
      const token = getToken()
      const userId = userData.id || userData._id
      
      const res = await fetch(API.orders.user(userId), {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    setOrderToCancel(orderId)
    setCancelModalOpen(true)
  }

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return
    setCancelLoading(true)
    try {
      const token = getToken()
      const res = await fetch(`${API.base}/api/orders/${orderToCancel}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cancellationReason: cancelReason })
      })
      if (res.ok) {
        fetchOrders()
      } else if (res.status === 403) {
        alert('Session expired. Please login again.')
        localStorage.clear()
        window.location.href = '/login'
      } else {
        const data = await res.json()
        alert(data.message || 'Error cancelling order')
      }
    } catch (error) {
      alert('Error cancelling order')
    } finally {
      setCancelLoading(false)
      setCancelModalOpen(false)
      setOrderToCancel(null)
      setCancelReason('')
    }
  }

  const handleRemoveOrder = async (orderId: string) => {
    try {
      const token = getToken()
      const res = await fetch(`${API.base}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error removing order:', error)
    }
  }

  const handleViewInvoice = async (orderId: string) => {
    try {
      const res = await fetch(`${API.base}/api/orders/${orderId}/invoice`)
      if (res.ok) {
        const data = await res.json()
        // Open invoice in new window
        const invoiceWindow = window.open('', '_blank')
        if (invoiceWindow) {
          invoiceWindow.document.write(data.invoiceHtml)
          invoiceWindow.document.close()
        }
      } else {
        alert('Error generating invoice')
      }
    } catch (error) {
      alert('Error generating invoice')
    }
  }

  const handleRetryPayment = (orderId: string) => {
    // Store the order ID for retry and redirect to checkout
    localStorage.setItem('retryOrderId', orderId)
    window.location.href = '/checkout?retry=true'
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg('')
    if (name.length < 2 || phone.length < 10) {
      setProfileMsg('Please fill all fields correctly')
      return
    }
    setProfileLoading(true)
    try {
      const token = getToken()
      const res = await fetch(API.auth.profile, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone })
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('user', JSON.stringify(data))
        setUser(data)
        setProfileMsg('Profile updated successfully!')
      } else {
        setProfileMsg('Failed to update profile')
      }
    } catch (error) {
      setProfileMsg('Error updating profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsMsg('')
    if (newPassword !== confirmPassword) {
      setSettingsMsg('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setSettingsMsg('Password must be at least 6 characters')
      return
    }
    setSettingsLoading(true)
    try {
      const token = getToken()
      const res = await fetch(API.auth.changePassword, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to change password')
      setSettingsMsg('Password changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setSettingsMsg(err.message)
    } finally {
      setSettingsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  const handleProductClick = (productId: string) => {
    router.push(`/product/${productId}`)
  }

  const calculateOrderTotals = (order: Order) => {
    const subtotal = order.orderItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
    const shipping = subtotal > 5000 ? 0 : 250
    const total = subtotal + shipping
    return { subtotal, shipping, total }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm lg:hidden sticky top-14 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{user?.name}</h1>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        
        {/* Mobile Tab Navigation */}
        {mobileMenuOpen && (
          <div className="border-t bg-white">
            <nav className="flex">
              <button onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false) }} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                <Package size={18} /> Orders
              </button>
              <button onClick={() => { setActiveTab('profile'); setMobileMenuOpen(false) }} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                <User size={18} /> Profile
              </button>
              <button onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false) }} className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                <Settings size={18} /> Settings
              </button>
            </nav>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Desktop Header */}
        <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6 mb-4 lg:mb-6 hidden lg:block">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                <p className="text-gray-500">{user?.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Desktop Sidebar */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
              <nav className="space-y-2">
                <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'orders' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <Package size={20} /> My Orders
                </button>
                <button onClick={() => setActiveTab('profile')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'profile' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <User size={20} /> My Profile
                </button>
                <button onClick={() => setActiveTab('settings')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${activeTab === 'settings' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <Settings size={20} /> Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">My Orders</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-8 lg:py-12">
                    <div className="text-5xl lg:text-6xl mb-4">📦</div>
                    <p className="text-gray-500 text-lg">No orders yet</p>
                    <Link href="/products" className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="border-2 border-gray-100 rounded-xl lg:rounded-2xl p-4 lg:p-5 hover:border-blue-200 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 lg:mb-4">
                          <div className="order-2 sm:order-1">
                            <p className="font-mono text-sm text-gray-500">
                              Order #{order._id.slice(-8)}
                              {order.trackingId && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  TRK: {order.trackingId}
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()} • {order.paymentMethod?.toUpperCase() || 'CARD'}</p>
                            {/* Payment Status Badge */}
                            {order.paymentResult?.status === 'verified' && (
                              <p className="text-xs text-green-600 font-medium mt-1">✓ Payment Verified</p>
                            )}
                            {order.paymentResult?.status === 'rejected' && (
                              <p className="text-xs text-red-600 font-medium mt-1">✗ Payment Rejected</p>
                            )}
                          </div>
                          <div className="order-1 sm:order-2 text-left sm:text-right">
                            <p className="font-bold text-lg lg:text-xl text-gray-900">Rs. {order.totalPrice?.toFixed(2)}</p>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
                              order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                              order.status === 'Out for Delivery' ? 'bg-orange-100 text-orange-700' :
                              order.status === 'Assigned to Rider' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                              order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              order.status === 'Payment Verification Pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status || 'Processing'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Order Items */}
                        <div className="mb-3 lg:mb-4">
                          <button 
                            onClick={() => toggleOrderDetails(order._id)}
                            className="flex items-center justify-between w-full text-left mb-2"
                          >
                            <span className="text-sm font-medium text-gray-600">
                              {order.orderItems?.length} {order.orderItems?.length === 1 ? 'item' : 'items'}
                            </span>
                            <span className="text-blue-600 text-sm flex items-center gap-1">
                              {expandedOrder === order._id ? <><ChevronUp size={16} /> Hide</> : <><ChevronDown size={16} /> View</>}
                            </span>
                          </button>
                          
                          <div className="flex flex-wrap gap-2">
                            {order.orderItems?.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                                <div className="relative w-10 h-10 lg:w-12 lg:h-12 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                  {item.image ? (
                                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500">x{item.quantity}</span>
                              </div>
                            ))}
                            {order.orderItems && order.orderItems.length > 3 && (
                              <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-lg text-xs font-medium text-gray-500">
                                +{order.orderItems.length - 3}
                              </div>
                            )}
                          </div>

                          {expandedOrder === order._id && (
                            <div className="mt-4 p-3 lg:p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <h4 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base">Order Items</h4>
                              <div className="space-y-3 mb-4">
                                {order.orderItems?.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 lg:gap-3 cursor-pointer hover:bg-white p-1 -m-1 rounded-lg flex-1 min-w-0" onClick={() => handleProductClick(item.product)}>
                                      <div className="relative w-12 lg:w-16 h-12 lg:h-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                        {item.image ? (
                                          <Image src={item.image} alt={item.name} fill className="object-cover hover:scale-110 transition-transform" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-gray-800 hover:text-blue-600 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">Qty: {item.quantity} × Rs.{item.price.toFixed(2)}</p>
                                      </div>
                                    </div>
                                    <p className="font-semibold text-gray-900 text-sm whitespace-nowrap ml-2">Rs.{(item.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-gray-200 pt-3 space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Subtotal</span>
                                  <span className="text-gray-800">Rs.{calculateOrderTotals(order).subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Shipping</span>
                                  <span className={calculateOrderTotals(order).shipping === 0 ? 'text-green-600' : 'text-gray-800'}>
                                    {calculateOrderTotals(order).shipping === 0 ? 'FREE' : `Rs.${calculateOrderTotals(order).shipping.toFixed(2)}`}
                                  </span>
                                </div>
                                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                                  <span>Total</span>
                                  <span className="text-blue-600">Rs.{calculateOrderTotals(order).total.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          {order.trackingId && (
                            <Link 
                              href={`/track-order?trackingId=${order.trackingId}`}
                              className="flex-1 py-2.5 lg:py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 flex items-center justify-center gap-2 font-semibold text-sm"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Track Order
                            </Link>
                          )}
                          <button 
                            onClick={() => handleViewInvoice(order._id)}
                            className="flex-1 py-2.5 lg:py-3 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 flex items-center justify-center gap-2 font-semibold text-sm"
                          >
                            <FileText size={16} /> Invoice
                          </button>
                          {(order.status === 'Payment Failed' || order.status === 'Payment Verification Pending') && (
                            <button 
                              onClick={() => handleRetryPayment(order._id)}
                              className="flex-1 py-2.5 lg:py-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 flex items-center justify-center gap-2 font-semibold text-sm"
                            >
                              <RotateCcw size={16} /> Retry
                            </button>
                          )}
                          {order.status !== 'Cancelled' && order.status !== 'Delivered' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleDeleteOrder(order._id)} className="py-2.5 lg:py-3 px-4 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-100 flex items-center justify-center gap-2 font-semibold text-sm">
                                <Trash2 size={16} /> Cancel
                              </button>
                              {order.status === 'Cancelled' && (
                                <button onClick={() => handleRemoveOrder(order._id)} className="py-2.5 lg:py-3 px-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 font-semibold text-sm">
                                  <X size={16} /> Remove
                                </button>
                              )}
                            </div>
                          )}
                          {order.status === 'Cancelled' && (
                            <button onClick={() => handleRemoveOrder(order._id)} className="py-2.5 lg:py-3 px-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 flex items-center justify-center gap-2 font-semibold text-sm">
                              <X size={16} /> Remove Order
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">My Profile</h2>
                {profileMsg && <div className={`mb-4 p-3 lg:p-4 rounded-xl text-sm ${profileMsg.includes('success') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{profileMsg}</div>}
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" value={user?.email || ''} className="w-full px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl bg-gray-50 text-base" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" placeholder="Enter phone number" required />
                  </div>
                  <button type="submit" disabled={profileLoading} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                    <Save size={18} /> {profileLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl shadow-sm p-4 lg:p-6">
                <h2 className="text-lg lg:text-xl font-semibold mb-4 lg:mb-6">Account Settings</h2>
                <div className="max-w-md">
                  <h3 className="text-base lg:text-lg font-medium mb-4">Change Password</h3>
                  {settingsMsg && <div className={`mb-4 p-3 lg:p-4 rounded-xl text-sm ${settingsMsg.includes('success') ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{settingsMsg}</div>}
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base pr-12" required />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          <EyeOff size={18} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2.5 lg:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base" required />
                    </div>
                    <button type="submit" disabled={settingsLoading} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-semibold disabled:opacity-50">
                      {settingsLoading ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cancel Order Modal */}
        {cancelModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Cancel Order</h2>
                  <p className="text-gray-500 text-sm">Please provide a reason for cancellation</p>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Enter reason for cancellation (optional)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setCancelModalOpen(false); setCancelReason(''); setOrderToCancel(null) }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                >
                  Keep Order
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={cancelLoading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 size={18} /> Cancel Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DashboardContent />
    </Suspense>
  )
}

