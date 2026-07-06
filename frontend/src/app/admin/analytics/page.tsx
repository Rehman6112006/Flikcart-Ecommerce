'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, TrendingUp, Package, Users, Truck, ShoppingBag,
  DollarSign, RefreshCw, ArrowUp, ArrowDown,
  Target, Zap, Crown
} from 'lucide-react'
import { API } from '@/lib/config'
import { motion } from 'framer-motion'

interface SalesData {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  salesByDate: Record<string, number>
  period: string
}

interface OrderData {
  totalOrders: number
  deliveredOrders: number
  pendingOrders: number
  cancelledOrders: number
  outForDelivery: number
  statusDistribution: Array<{ status: string; count: number }>
}

interface ProductData {
  totalProducts: number
  outOfStock: number
  lowStock: number
  featuredProducts: number
  categoryDistribution: Array<{ category: string; count: number }>
  topProducts: Array<{ _id: string; totalSold: number; totalRevenue: number }>
}

interface UserData {
  totalUsers: number
  newUsers: number
  topBuyers: Array<{ _id: string; orderCount: number; totalSpent: number }>
}

interface RiderData {
  totalRiders: number
  activeRiders: number
  busyRiders: number
  riderPerformance: Array<{ name: string; totalDeliveries: number; rating: number }>
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
const STATUS_COLORS: Record<string, string> = {
  'Delivered': '#10B981',
  'Processing': '#3B82F6',
  'Pending': '#F59E0B',
  'Cancelled': '#EF4444',
  'Out for Delivery': '#F97316',
  'Shipped': '#8B5CF6'
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

function MetricCard({ title, value, icon, trend, bgColor, iconColor, trendLabel }: {
  title: string; value: React.ReactNode; icon: React.ReactNode
  trend?: number; bgColor: string; iconColor: string; trendLabel?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
    >
      <div className="flex items-start justify-between mb-4">
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
      <p className="text-sm text-gray-500">{title}</p>
      {trendLabel && <p className="text-xs text-gray-400 mt-1">{trendLabel}</p>}
    </motion.div>
  )
}

function SalesBarChart({ data }: { data: Array<{ date: string; sales: number }> }) {
  const maxSales = Math.max(...data.map(d => d.sales), 1)
  const chartHeight = 220

  return (
    <div className="relative pt-6">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-6 bottom-6 flex flex-col justify-between text-[10px] text-gray-400 pr-2">
        <span>Rs {maxSales.toLocaleString()}</span>
        <span>Rs {Math.round(maxSales / 2).toLocaleString()}</span>
        <span>Rs 0</span>
      </div>
      <div className="flex items-end gap-1.5 h-[220px] ml-16" style={{ minHeight: `${chartHeight}px` }}>
        {/* Grid lines */}
        <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none">
          <div className="border-t border-dashed border-gray-100 h-1/2" />
          <div className="border-t border-dashed border-gray-100 h-1/2" />
        </div>
        {data.map((item, idx) => {
          const height = (item.sales / maxSales) * chartHeight
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap shadow-lg z-10 scale-90 group-hover:scale-100">
                <p className="font-medium">Rs {item.sales.toLocaleString()}</p>
                <p className="text-gray-400">{item.date}</p>
              </div>
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${height}px`, opacity: 1 }}
                transition={{ duration: 0.6, delay: idx * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
                className="w-full rounded-t-md cursor-pointer relative overflow-hidden"
                style={{
                  background: `linear-gradient(180deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)`,
                  minHeight: item.sales > 0 ? '4px' : '0px',
                  boxShadow: '0 -2px 10px rgba(59,130,246,0.2)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" />
              </motion.div>
              <span className="text-[9px] text-gray-400 mt-1 font-medium">
                {item.date.length > 5 ? item.date.slice(0, 5) : item.date}
              </span>
            </div>
          )
        })}
      </div>
      
    </div>
  )
}

function DonutChart({ data, total }: { data: Array<{ name: string; value: number; color: string }>; total: number }) {
  if (total === 0) return null

  let cumulativePercent = 0
  const segments = data.map(item => {
    const percent = item.value / total
    const startPercent = cumulativePercent
    cumulativePercent += percent
    return { ...item, startPercent, percent }
  })

  const radius = 75
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180" className="-rotate-90 drop-shadow-sm">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="22" />
          {segments.map((segment, idx) => {
            if (segment.percent === 0) return null
            const dashLength = segment.percent * circumference
            const dashOffset = -segment.startPercent * circumference
            return (
              <circle
                key={idx}
                cx="90" cy="90" r={radius} fill="none"
                stroke={segment.color} strokeWidth="22"
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className="transition-all duration-700"
              >
                <animate attributeName="stroke-dasharray" from="0 1000" to={`${dashLength} ${circumference - dashLength}`} dur="1s" fill="freeze" />
              </circle>
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className="text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-[10px] text-gray-500 font-medium">Total</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-5 w-full">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-gray-600 truncate">{item.name}</span>
            <span className="text-xs font-bold text-gray-900 ml-auto">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HorizontalBar({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon?: string }) {
  const percent = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="space-y-1.5 group">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
        </div>
        <span className="text-sm font-bold text-gray-900">{value}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
          className="h-full rounded-full relative"
          style={{ background: `linear-gradient(90deg, ${color}66, ${color})` }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full" style={{ width: '30%' }} />
        </motion.div>
      </div>
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('week')
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [productData, setProductData] = useState<ProductData | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [riderData, setRiderData] = useState<RiderData | null>(null)

  useEffect(() => { fetchAnalytics() }, [period])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('adminToken')
      const headers = { 'Authorization': `Bearer ${token}` }
      const [sr, or, pr, ur, rr] = await Promise.all([
        fetch(`${API.admin.analytics}/sales?period=${period}`, { headers }),
        fetch(`${API.admin.analytics}/orders`, { headers }),
        fetch(`${API.admin.analytics}/products`, { headers }),
        fetch(`${API.admin.analytics}/users`, { headers }),
        fetch(`${API.admin.analytics}/riders`, { headers })
      ])
      setSalesData(await sr.json())
      setOrderData(await or.json())
      setProductData(await pr.json())
      setUserData(await ur.json())
      setRiderData(await rr.json())
    } catch (e) { console.error('Error fetching analytics:', e) }
    finally { setLoading(false) }
  }

  const salesChartData = useMemo(() => {
    if (!salesData?.salesByDate) return []
    return Object.entries(salesData.salesByDate)
      .map(([date, value]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: value
      })).reverse()
  }, [salesData])

  const statusData = useMemo(() => {
    if (!orderData?.statusDistribution) return []
    return orderData.statusDistribution.map(item => ({
      name: item.status, value: item.count,
      color: STATUS_COLORS[item.status] || '#6B7280'
    }))
  }, [orderData])

  const totalStatusCount = statusData.reduce((sum, s) => sum + s.value, 0)

  const categoryData = useMemo(() => {
    if (!productData?.categoryDistribution) return []
    return productData.categoryDistribution.map((cat, idx) => ({ ...cat, color: COLORS[idx % COLORS.length] }))
  }, [productData])

  const maxCategoryCount = Math.max(...categoryData.map(c => c.count), 1)

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-100 border-t-blue-600 shadow-lg" />
        <p className="text-gray-500 font-medium">Loading analytics...</p>
      </div>
    </div>
  )

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
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">Analytics</h1>
            </div>
            <p className="text-blue-200 text-sm">Track your store performance & growth</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-1">
              {['day', 'week', 'month', 'year'].map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    period === p ? 'bg-white text-blue-700 shadow-md' : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {p === 'day' ? '24H' : p === 'week' ? '7 Days' : p === 'month' ? '30 Days' : '1 Year'}
                </button>
              ))}
            </div>
            <button onClick={fetchAnalytics}
              className="p-2.5 bg-white/10 backdrop-blur-sm border border-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ===== KEY METRICS ===== */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <MetricCard
          title="Total Sales"
          value={`Rs ${(salesData?.totalSales || 0).toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
          trend={12}
          bgColor="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <MetricCard
          title="Total Orders"
          value={<AnimatedNumber value={orderData?.totalOrders || 0} />}
          icon={<ShoppingBag className="w-6 h-6 text-blue-600" />}
          trend={8}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Total Users"
          value={<AnimatedNumber value={userData?.totalUsers || 0} />}
          icon={<Users className="w-6 h-6 text-purple-600" />}
          trend={15}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Active Riders"
          value={<AnimatedNumber value={riderData?.activeRiders || 0} />}
          icon={<Truck className="w-6 h-6 text-orange-600" />}
          trend={5}
          bgColor="bg-orange-50"
          iconColor="text-orange-600"
          trendLabel={`${riderData?.busyRiders || 0} currently busy`}
        />
      </motion.div>

      {/* ===== CHARTS ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Sales Trend
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {period === 'day' ? 'Last 24 hours' : period === 'week' ? 'Last 7 days' : period === 'month' ? 'Last 30 days' : 'Last year'}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl">
              <DollarSign size={14} className="text-blue-600" />
              <span className="text-sm font-bold text-blue-700">Rs {(salesData?.totalSales || 0).toLocaleString()}</span>
            </div>
          </div>
          <SalesBarChart data={salesChartData} />
        </motion.div>

        {/* Order Status */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Order Status
          </h3>
          <p className="text-sm text-gray-400 mb-5">Distribution of all orders</p>
          <DonutChart data={statusData} total={totalStatusCount} />
        </motion.div>
      </div>

      {/* ===== BOTTOM GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            Top Selling Products
          </h3>
          <p className="text-sm text-gray-400 mb-5">Best performing products</p>
          <div className="space-y-3">
            {productData?.topProducts?.slice(0, 5).map((product, idx) => (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + idx * 0.08 }}
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                    idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                    idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                    'bg-gradient-to-br from-blue-400 to-blue-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors truncate max-w-[140px]">
                    {product._id}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{product.totalSold} sold</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">Rs {product.totalRevenue?.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
            
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            Products by Category
          </h3>
          <p className="text-sm text-gray-400 mb-5">Inventory distribution</p>
          <div className="space-y-5">
            {categoryData.map((cat, idx) => (
              <HorizontalBar key={idx} label={cat.category} value={cat.count} max={maxCategoryCount} color={cat.color} />
            ))}
            
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="space-y-6"
        >
          {/* Stock Status */}
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Stock Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 text-center border border-blue-100/50">
                <p className="text-2xl font-bold text-blue-600">
                  <AnimatedNumber value={productData?.totalProducts || 0} />
                </p>
                <p className="text-xs text-blue-500 font-medium mt-1">Total Products</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl p-4 text-center border border-red-100/50">
                <p className="text-2xl font-bold text-red-600">
                  <AnimatedNumber value={productData?.outOfStock || 0} />
                </p>
                <p className="text-xs text-red-500 font-medium mt-1">Out of Stock</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-4 text-center border border-amber-100/50">
                <p className="text-2xl font-bold text-amber-600">
                  <AnimatedNumber value={productData?.lowStock || 0} />
                </p>
                <p className="text-xs text-amber-500 font-medium mt-1">Low Stock</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 text-center border border-purple-100/50">
                <p className="text-2xl font-bold text-purple-600">
                  <AnimatedNumber value={productData?.featuredProducts || 0} />
                </p>
                <p className="text-xs text-purple-500 font-medium mt-1">Featured</p>
              </div>
            </div>
          </div>

          {/* User Stats */}
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" /> User Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl">
                <span className="text-sm text-gray-600 font-medium">Total Users</span>
                <span className="text-lg font-bold text-gray-900">
                  <AnimatedNumber value={userData?.totalUsers || 0} />
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl">
                <span className="text-sm text-emerald-700 font-medium">New Users (30d)</span>
                <span className="text-lg font-bold text-emerald-600">+<AnimatedNumber value={userData?.newUsers || 0} /></span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl">
                <span className="text-sm text-blue-700 font-medium">Avg Order Value</span>
                <span className="text-lg font-bold text-blue-600">Rs {(salesData?.averageOrderValue || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===== RIDER PERFORMANCE ===== */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-500" />
              Rider Performance
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">Delivery team performance overview</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              {riderData?.activeRiders || 0} Active
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg font-medium">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              {riderData?.busyRiders || 0} Busy
            </span>
          </div>
        </div>
        {riderData?.riderPerformance && riderData.riderPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3.5 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Rider</th>
                  <th className="text-center py-3.5 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Deliveries</th>
                  <th className="text-right py-3.5 px-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">Rating</th>
                </tr>
              </thead>
              <tbody>
                {riderData.riderPerformance.map((rider, idx) => (
                  <motion.tr
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.45 + idx * 0.05 }}
                    key={idx}
                    className="border-b border-gray-50 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                          idx === 1 ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                          'bg-gradient-to-br from-gray-400 to-gray-600'
                        }`}>
                          {rider.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-800">{rider.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-bold text-sm">
                        <Truck size={14} /> {rider.totalDeliveries}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg font-bold text-sm">
                        ★ {rider.rating.toFixed(1)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  )
}
