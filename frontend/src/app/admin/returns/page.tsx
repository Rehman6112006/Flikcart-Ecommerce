'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, CheckCircle, XCircle, Clock, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ReturnRequest {
  _id: string
  order: { _id: string; trackingId: string; totalPrice: number }
  user: { _id: string; name: string; email: string }
  items: { name: string; quantity: number; price: number }[]
  reason: string
  refundAmount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  adminNote?: string
  createdAt: string
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => { fetchReturns() }, [])

  const fetchReturns = async () => {
    const token = localStorage.getItem('adminToken')
    try {
      const res = await fetch(`${API.base}/api/admin/returns`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) setReturns(await res.json())
    } catch { } finally { setLoading(false) }
  }

  const updateStatus = async (id: string, status: string, adminNote?: string) => {
    const token = localStorage.getItem('adminToken')
    await fetch(`${API.base}/api/admin/returns/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status, adminNote })
    })
    fetchReturns()
  }

  const filtered = returns.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return r.order?.trackingId?.toLowerCase().includes(s) || r.user?.email?.toLowerCase().includes(s)
    }
    return true
  })

  const statusBadge = (s: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      approved: 'bg-blue-50 text-blue-700 border-blue-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      completed: 'bg-green-50 text-green-700 border-green-200'
    }
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[s] || ''}`}>{s}</span>
  }

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Return & Refund Requests</h1>
      <p className="text-gray-500 mb-6">Approve or reject customer return requests</p>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="Search by tracking ID or email..." />
        </div>
        {['all', 'pending', 'approved', 'rejected', 'completed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No return requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-gray-900">#{r.order?.trackingId || 'N/A'}</span>
                    {statusBadge(r.status)}
                  </div>
                  <p className="text-sm text-gray-500">{r.user?.email} — Refund: Rs.{r.refundAmount?.toLocaleString()}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                <p className="text-sm text-gray-600">{r.reason}</p>
              </div>
              {r.items?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Items ({r.items.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {r.items.map((item, i) => (
                      <span key={i} className="px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600">{item.name} x{item.quantity}</span>
                    ))}
                  </div>
                </div>
              )}
              {r.adminNote && <p className="text-sm text-gray-500 mb-3">Admin note: {r.adminNote}</p>}
              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(r._id, 'approved', 'Return approved, refund initiated')}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all flex items-center gap-1.5">
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => {
                    const note = prompt('Reason for rejection:')
                    if (note) updateStatus(r._id, 'rejected', note)
                  }}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-all flex items-center gap-1.5">
                    <XCircle size={16} /> Reject
                  </button>
                  <button onClick={() => updateStatus(r._id, 'completed', 'Refund processed')}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-all flex items-center gap-1.5">
                    <Clock size={16} /> Mark Completed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
