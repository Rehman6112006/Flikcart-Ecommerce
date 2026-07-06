'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { API } from '@/lib/config'
import { motion } from 'framer-motion'
import { 
  ShoppingBag, Package, Users, Truck, 
  DollarSign, ArrowUp, ArrowDown,
  AlertCircle, RefreshCw, PlusCircle, BarChart3,
  Settings, Clock, Zap, Eye, CreditCard
} from 'lucide-react'

interface Analytics {
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  totalUsers: number
  totalRiders: number
  recentOrders: Array<{
    _id: string
    totalPrice: number
    status: string
    createdAt: string
    shippingAddress: { fullName: string }
    paymentMethod: string
  }>
  pendingOrders: number
  deliveredOrders: number
  cancelledOrders: number
  outForDelivery: number
  statusDistribution: Array<{ status: string; count: number }>
  salesData: number[]
}

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 800
    const step = 16
    const totalSteps = duration / step
    const increment = value / totalSteps
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.floor(start))
      }
    }, step)
    return () => clearInterval(timer)
  }, [value])
  return <>{prefix}{display.toLocaleString()}{suffix}</>
}

function StatCard({ title, value, icon, trend, bgColor, iconColor }: {
  title: string; value: React.ReactNode; icon: React.ReactNode
  trend?: number; bgColor: string; iconColor: string
}) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-5 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-2xl ${bgColor}`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
            trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
    </motion.div>
  )
}

function StatusBar({ label, count, total, color, bgColor }: { label: string; count: number; total: number; color: string; bgColor: string }) {
  const percent = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${color} shadow-sm`} />
          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{count}</span>
          {total > 0 && <span className="text-xs text-gray-400">({Math.round(percent)}%)</span>}
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full ${bgColor}`}
        />
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { fetchAnalytics() }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken')
      const headers = { 'Authorization': `Bearer ${token}` }
      const [salesRes, ordersRes, productsRes, usersRes, ridersRes] = await Promise.all([
        fetch(API.admin.analytics + '/sales?period=month', { headers }),
        fetch(API.admin.analytics + '/orders', { headers }),
        fetch(API.admin.analytics + '/products', { headers }),
        fetch(API.admin.analytics + '/users', { headers }),
        fetch(API.admin.analytics + '/riders', { headers })
      ])

      const [salesData, ordersData, productsData, usersData, ridersData] = await Promise.all([
        salesRes.json(), ordersRes.json(), productsRes.json(), usersRes.json(), ridersRes.json()
      ])

      setAnalytics({
        totalOrders: ordersData.totalOrders || 0,
        totalRevenue: salesData.totalSales || 0,
        totalProducts: productsData.totalProducts || 0,
        totalUsers: usersData.totalUsers || 0,
        totalRiders: ridersData.totalRiders || 0,
        recentOrders: ordersData.recentOrders || [],
        pendingOrders: ordersData.pendingOrders || 0,
        deliveredOrders: ordersData.deliveredOrders || 0,
        cancelledOrders: ordersData.cancelledOrders || 0,
        outForDelivery: ordersData.outForDelivery || 0,
        statusDistribution: ordersData.statusDistribution || [],
        salesData: salesData.salesData || []
      })
    } catch (err) {
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const STATUS_STYLES: Record<string, { badge: string; dot: string; bar: string }> = {
    'Order Received': { badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500', bar: 'bg-gradient-to-r from-gray-300 to-gray-400' },
    'Processing': { badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', bar: 'bg-gradient-to-r from-blue-400 to-blue-500' },
    'Shipped': { badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', bar: 'bg-gradient-to-r from-purple-400 to-purple-500' },
    'Assigned to Rider': { badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', bar: 'bg-gradient-to-r from-indigo-400 to-indigo-500' },
    'Out for Delivery': { badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', bar: 'bg-gradient-to-r from-orange-400 to-orange-500' },
    'Delivered': { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500' },
    'Cancelled': { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', bar: 'bg-gradient-to-r from-red-400 to-red-500' },
    'Payment Verification Pending': { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', bar: 'bg-gradient-to-r from-yellow-400 to-yellow-500' },
    'Payment Failed': { badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', bar: 'bg-gradient-to-r from-rose-400 to-rose-500' },
    'Payment Pending - COD': { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', bar: 'bg-gradient-to-r from-amber-400 to-amber-500' },
  }

  const getStatusStyle = (status: string) => STATUS_STYLES[status] || { badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-500', bar: 'bg-gradient-to-r from-gray-300 to-gray-400' }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-100 border-t-blue-600 shadow-lg" />
        <p className="text-gray-500 font-medium">Loading dashboard...</p>
      </div>
    </div>
  )

  const totalStatus = analytics?.totalOrders || 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 p-4 lg:p-6 space-y-6"
    >
      {/* ===== HEADER ===== */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 lg:p-8 shadow-lg"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-white/15 rounded-xl backdrop-blur-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
            </div>
            <p className="text-blue-200 text-sm">Welcome back, Admin • Here&apos;s what&apos;s happening today</p>
          </div>
          <button onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-sm border border-white/10 text-white rounded-xl hover:bg-white/20 transition-all text-sm font-medium"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-600 shadow-sm"
        >
          <AlertCircle size={20} />
          <span className="font-medium">{error}</span>
        </motion.div>
      )}

      {/* ===== STATS GRID ===== */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <StatCard
          title="Total Revenue"
          value={`Rs ${(analytics?.totalRevenue || 0).toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          trend={12}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Total Orders"
          value={<AnimatedNumber value={analytics?.totalOrders || 0} />}
          icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
          trend={8}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          title="Products"
          value={<AnimatedNumber value={analytics?.totalProducts || 0} />}
          icon={<Package className="w-6 h-6 text-purple-600" />}
          trend={5}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <StatCard
          title="Users"
          value={<AnimatedNumber value={analytics?.totalUsers || 0} />}
          icon={<Users className="w-6 h-6 text-orange-600" />}
          trend={15}
          bgColor="bg-orange-50"
          iconColor="text-orange-600"
        />
        <StatCard
          title="Riders"
          value={<AnimatedNumber value={analytics?.totalRiders || 0} />}
          icon={<Truck className="w-6 h-6 text-teal-600" />}
          trend={3}
          bgColor="bg-teal-50"
          iconColor="text-teal-600"
        />
      </motion.div>

      {/* ===== ORDER STATUS + RECENT ORDERS ===== */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Status */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Order Status</h2>
              <p className="text-sm text-gray-400 mt-0.5">{totalStatus} total orders</p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="space-y-5">
            {(analytics?.statusDistribution || []).length > 0 ? (
              analytics!.statusDistribution.map((s) => {
                const style = getStatusStyle(s.status)
                return (
                  <StatusBar
                    key={s.status}
                    label={s.status}
                    count={s.count}
                    total={totalStatus}
                    color={style.dot}
                    bgColor={style.bar}
                  />
                )
              })
            ) : (
              <>
                <StatusBar label="Order Received" count={analytics?.pendingOrders || 0} total={totalStatus} color="bg-gray-500" bgColor="bg-gradient-to-r from-gray-300 to-gray-400" />
                <StatusBar label="Delivered" count={analytics?.deliveredOrders || 0} total={totalStatus} color="bg-emerald-500" bgColor="bg-gradient-to-r from-emerald-400 to-emerald-500" />
                <StatusBar label="Cancelled" count={analytics?.cancelledOrders || 0} total={totalStatus} color="bg-red-500" bgColor="bg-gradient-to-r from-red-400 to-red-500" />
              </>
            )}
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <p className="text-sm text-gray-400 mt-0.5">Latest 5 orders</p>
            </div>
            <Link href="/admin/orders"
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl hover:bg-blue-100 transition-all"
            >
              View All <Eye size={16} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3.5 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3.5 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3.5 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Payment</th>
                  <th className="text-left py-3.5 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left py-3.5 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.recentOrders || []).slice(0, 5).map((order, idx) => (
                  <motion.tr
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.25 + idx * 0.05 }}
                    key={order._id}
                    className="border-b border-gray-50 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {(order.shippingAddress?.fullName || 'N/A').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                          {order.shippingAddress?.fullName || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-bold text-gray-900">Rs. {order.totalPrice.toLocaleString()}</td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium">
                        <CreditCard size={12} />
                        {order.paymentMethod || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusStyle(order.status).badge}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusStyle(order.status).dot}`} />
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-500 text-xs">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                  </motion.tr>
                ))}
                
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* ===== QUICK ACTIONS ===== */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-amber-50 rounded-xl">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-400">Common admin tasks</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Add Product', href: '/admin/products', icon: PlusCircle, gradient: 'from-blue-500 to-blue-600' },
            { label: 'View Orders', href: '/admin/orders', icon: ShoppingBag, gradient: 'from-purple-500 to-purple-600' },
            { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, gradient: 'from-emerald-500 to-emerald-600' },
            { label: 'Settings', href: '/admin/settings', icon: Settings, gradient: 'from-orange-500 to-orange-600' },
          ].map((action) => (
            <Link key={action.label} href={action.href}
              className="group relative overflow-hidden flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-white transition-all duration-300 border border-transparent hover:border-gray-200 hover:shadow-md"
            >
              <div className={`p-3 rounded-xl bg-gradient-to-br ${action.gradient} shadow-sm transition-transform group-hover:scale-110`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{action.label}</span>
                <p className="text-xs text-gray-400 mt-0.5">Manage {action.label.toLowerCase()}</p>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1">
                <ArrowUp className="w-4 h-4 rotate-45" />
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
