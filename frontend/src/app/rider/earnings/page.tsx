'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Calendar, Clock, Package, ChevronRight, RefreshCw } from 'lucide-react'

interface EarningsData {
  totalEarnings: number
  dailyEarnings: number
  weeklyEarnings: number
  monthlyEarnings: number
  totalDeliveries: number
  dailyDeliveries: number
  weeklyDeliveries: number
  monthlyDeliveries: number
  recentEarnings: Array<{
    trackingId: string
    amount: number
    totalPrice: number
    deliveredAt: string
    customerName: string
  }>
}

export default function RiderEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly')

  useEffect(() => { fetchEarnings() }, [])

  const fetchEarnings = async () => {
    try {
      const riderToken = localStorage.getItem('riderToken')
      const res = await fetch(`${API.base}/api/rider/earnings`, {
        headers: { 'Authorization': `Bearer ${riderToken}` }
      })
      if (res.ok) setData(await res.json())
    } catch {} finally { setLoading(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

  const periodEarnings = data ? {
    daily: data.dailyEarnings,
    weekly: data.weeklyEarnings,
    monthly: data.monthlyEarnings
  }[period] : 0

  const periodDeliveries = data ? {
    daily: data.dailyDeliveries,
    weekly: data.weeklyDeliveries,
    monthly: data.monthlyDeliveries
  }[period] : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">My Earnings</h1>
          </div>
          <button onClick={fetchEarnings} className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Total Earnings Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl p-6 text-white shadow-lg"
        >
          <p className="text-green-100 text-sm">Total Earnings</p>
          <p className="text-4xl font-bold mt-1">Rs. {data?.totalEarnings?.toLocaleString() || 0}</p>
          <div className="flex items-center gap-4 mt-3 text-green-100 text-sm">
            <span className="flex items-center gap-1"><Package size={14} /> {data?.totalDeliveries || 0} deliveries</span>
            <span className="flex items-center gap-1"><TrendingUp size={14} /> Avg Rs. {data?.totalDeliveries ? Math.round((data?.totalEarnings || 0) / data.totalDeliveries) : 0}/del</span>
          </div>
        </motion.div>

        {/* Period Tabs */}
        <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-100 shadow-sm">
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                period === p ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'daily' ? 'Today' : p === 'weekly' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Period Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-500">Period Earnings</p>
            <p className="text-2xl font-bold text-gray-900">Rs. {periodEarnings.toLocaleString()}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-500">Deliveries</p>
            <p className="text-2xl font-bold text-gray-900">{periodDeliveries}</p>
          </motion.div>
        </div>

        {/* Recent Earnings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Earnings</h2>
          </div>
          {data?.recentEarnings?.length ? (
            <div className="divide-y divide-gray-50">
              {data.recentEarnings.slice(0, 10).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.customerName || 'Customer'}</p>
                    <p className="text-xs text-gray-400">{item.trackingId} • {item.deliveredAt ? new Date(item.deliveredAt).toLocaleDateString() : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">+Rs. {item.amount}</p>
                    <p className="text-xs text-gray-400">Rs. {item.totalPrice} order</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No earnings yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
