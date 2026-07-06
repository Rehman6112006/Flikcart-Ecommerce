'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, DollarSign, ShoppingCart, TrendingUp, Download, Calendar } from 'lucide-react'

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('30d')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem('adminToken')
    fetch(`${API.base}/api/admin/reports/sales?period=${period}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [period])

  const exportCSV = () => {
    const token = localStorage.getItem('adminToken')
    window.open(`${API.base}/api/admin/reports/export?token=${token}`, '_blank')
  }

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>

  const maxDaily = data?.dailyBreakdown?.length ? Math.max(...data.dailyBreakdown.map((d: any) => d.sales)) : 1

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-500">Track revenue and order metrics</p>
        </div>
        <button onClick={exportCSV}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center gap-2">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {['7d', '30d', '90d', '1y'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${period === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '1 Year'}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[
          { icon: DollarSign, label: 'Total Sales', value: `Rs.${data?.totalSales?.toLocaleString() || 0}`, color: 'text-green-600 bg-green-50' },
          { icon: ShoppingCart, label: 'Total Orders', value: data?.totalOrders || 0, color: 'text-blue-600 bg-blue-50' },
          { icon: TrendingUp, label: 'Avg Order Value', value: `Rs.${Math.round(data?.averageOrderValue || 0).toLocaleString()}`, color: 'text-purple-600 bg-purple-50' }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={20} /></div>
              <span className="text-sm text-gray-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Calendar size={18} /> Daily Sales</h2>
        <div className="flex items-end gap-1.5 h-40">
          {data?.dailyBreakdown?.slice(-14).map((d: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div initial={{ height: 0 }} animate={{ height: `${(d.sales / maxDaily) * 100}%` }}
                className="w-full bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-all cursor-pointer"
                title={`${d.date}: Rs.${d.sales.toLocaleString()}`}
                style={{ minHeight: d.sales > 0 ? '4px' : '0' }}
              />
              <span className="text-[10px] text-gray-400 -rotate-45 origin-left whitespace-nowrap">
                {d.date?.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">Category Breakdown</h2>
        <div className="space-y-3">
          {data?.categoryBreakdown?.sort((a: any, b: any) => b.sales - a.sales).map((cat: any, i: number) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 font-medium">{cat.name}</span>
                <span className="text-gray-500">Rs.{cat.sales.toLocaleString()} ({cat.count} items)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(cat.sales / data.totalSales) * 100}%` }}
                  className="h-2 rounded-full bg-blue-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
