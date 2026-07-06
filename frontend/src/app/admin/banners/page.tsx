'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react'

interface Banner {
  _id: string
  title: string
  subtitle?: string
  image: string
  link?: string
  active: boolean
  order: number
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState({ title: '', subtitle: '', image: '', link: '', active: true, order: 0 })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchBanners() }, [])

  const fetchBanners = async () => {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API.base}/api/admin/banners`, { headers: { 'Authorization': `Bearer ${token}` } })
    if (res.ok) setBanners(await res.json())
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const token = localStorage.getItem('adminToken')
    const method = editing ? 'PUT' : 'POST'
    const url = editing ? `${API.base}/api/admin/banners/${editing._id}` : `${API.base}/api/admin/banners`
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form)
    })
    if (res.ok) { fetchBanners(); setShowForm(false); setEditing(null); setForm({ title: '', subtitle: '', image: '', link: '', active: true, order: 0 }) }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    const token = localStorage.getItem('adminToken')
    await fetch(`${API.base}/api/admin/banners/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
    fetchBanners()
  }

  const toggleActive = async (banner: Banner) => {
    const token = localStorage.getItem('adminToken')
    await fetch(`${API.base}/api/admin/banners/${banner._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ active: !banner.active })
    })
    fetchBanners()
  }

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Manager</h1>
          <p className="text-gray-500">Manage homepage slider banners</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', subtitle: '', image: '', link: '', active: true, order: banners.length }) }}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Add Banner
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <h2 className="font-bold text-gray-900 mb-4">{editing ? 'Edit' : 'Add'} Banner</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
              <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
              <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving || !form.title || !form.image}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
            >{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={() => { setShowForm(false); setEditing(null) }}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No banners yet. Add your first homepage banner!</p>
          </div>
        ) : banners.map((banner, i) => (
          <div key={banner._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            <div className="w-24 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              {banner.image ? <img src={banner.image} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{banner.title}</p>
              {banner.subtitle && <p className="text-sm text-gray-500 truncate">{banner.subtitle}</p>}
              <p className="text-xs text-gray-400 mt-0.5">Order: {banner.order} • {banner.active ? 'Active' : 'Inactive'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleActive(banner)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all" title={banner.active ? 'Deactivate' : 'Activate'}>
                {banner.active ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              </button>
              <button onClick={() => { setEditing(banner); setShowForm(true); setForm({ title: banner.title, subtitle: banner.subtitle || '', image: banner.image, link: banner.link || '', active: banner.active, order: banner.order }) }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all">
                <Edit2 className="w-4 h-4 text-blue-500" />
              </button>
              <button onClick={() => handleDelete(banner._id)}
                className="p-2 rounded-lg hover:bg-red-50 transition-all">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
