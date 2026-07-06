'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Package, Clock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function MyReturnsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [returns, setReturns] = useState<Record<string, any>>({})
  const [showForm, setShowForm] = useState<string | null>(null)
  const [form, setForm] = useState({ reason: '', items: [] as string[] })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token')
      try {
        const oRes = await fetch(`${API.base}/api/orders/delivered`, { headers: { 'Authorization': `Bearer ${token}` } })
        if (oRes.ok) setOrders(await oRes.json())
      } catch { } finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const submitReturn = async (orderId: string) => {
    if (!form.reason) return
    setSubmitting(true)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API.base}/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ orderId, reason: form.reason, items: form.items })
      })
      if (res.ok) {
        setShowForm(null)
        setForm({ reason: '', items: [] })
      }
    } catch { } finally { setSubmitting(false) }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/orders" className="p-2 rounded-lg hover:bg-gray-100 transition-all"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Returns</h1>
            <p className="text-gray-500">Request returns for delivered orders</p>
          </div>
        </div>

        {orders.map((order: any) => (
          <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-900">#{order.trackingId || 'N/A'}</p>
                <p className="text-sm text-gray-500">Rs.{order.totalPrice?.toLocaleString()} • {new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setShowForm(showForm === order._id ? null : order._id)}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-all">
                Request Return
              </button>
            </div>

            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <input type="checkbox" checked={form.items.includes(item._id || item.name)}
                  onChange={(e) => {
                    if (e.target.checked) setForm({ ...form, items: [...form.items, item._id || item.name] })
                    else setForm({ ...form, items: form.items.filter((id: string) => id !== (item._id || item.name)) })
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">Rs.{item.price} x {item.quantity}</p>
                </div>
              </div>
            ))}

            {showForm === order._id && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Tell us why you're returning this item..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm mb-3" rows={3} />
                <button onClick={() => submitReturn(order._id)} disabled={submitting || !form.reason || form.items.length === 0}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all">
                  {submitting ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </motion.div>
            )}
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No delivered orders to return</p>
            <Link href="/orders" className="text-blue-600 text-sm mt-2 inline-block">View your orders</Link>
          </div>
        )}
      </div>
    </div>
  )
}
