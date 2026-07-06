'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, Tag, Calendar, Users, X, Loader2, Check, AlertCircle } from 'lucide-react'
import { API } from '@/lib/config'
import { motion } from 'framer-motion'

interface Coupon {
  _id: string
  code: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minOrderAmount: number
  maxUses: number | null
  usedCount: number
  isActive: boolean
  validFrom: string
  validUntil: string
  createdAt: string
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    minOrderAmount: 0,
    maxUses: '',
    validUntil: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    fetchCoupons()
  }, [])

  const getToken = () => localStorage.getItem('adminToken')

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API.base}/api/coupons`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })
      if (res.ok) {
        const data = await res.json()
        setCoupons(data)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setFormLoading(true)

    try {
      const payload = {
        ...formData,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null
      }

      const url = editingCoupon 
        ? `${API.base}/api/coupons/${editingCoupon._id}`
        : `${API.base}/api/coupons`
      
      const res = await fetch(url, {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.ok) {
        setFormSuccess(editingCoupon ? 'Coupon updated successfully!' : 'Coupon created successfully!')
        fetchCoupons()
        setTimeout(() => {
          closeModal()
        }, 1500)
      } else {
        setFormError(data.message || 'Error saving coupon')
      }
    } catch (error) {
      setFormError('Error saving coupon')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    
    try {
      const res = await fetch(`${API.base}/api/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      })

      if (res.ok) {
        alert('Coupon deleted successfully!')
        fetchCoupons()
      } else {
        const data = await res.json()
        alert(data.message || 'Error deleting coupon')
      }
    } catch (error) {
      alert('Error deleting coupon')
    }
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`${API.base}/api/coupons/${coupon._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ isActive: !coupon.isActive })
      })

      if (res.ok) {
        fetchCoupons()
      }
    } catch (error) {
      console.error('Error toggling coupon:', error)
    }
  }

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setFormData({
        code: coupon.code,
        description: coupon.description || '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderAmount: coupon.minOrderAmount,
        maxUses: coupon.maxUses?.toString() || '',
        validUntil: new Date(coupon.validUntil).toISOString().split('T')[0]
      })
    } else {
      setEditingCoupon(null)
      setFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: 0,
        minOrderAmount: 0,
        maxUses: '',
        validUntil: ''
      })
    }
    setFormError('')
    setFormSuccess('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCoupon(null)
    setFormError('')
    setFormSuccess('')
  }

  const filteredCoupons = coupons.filter(coupon => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const activeCount = coupons.filter(c => c.isActive).length
  const expiredCount = coupons.filter(c => new Date(c.validUntil) < new Date()).length

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-4 lg:p-6 bg-gray-50 min-h-screen"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-500 mt-1">Create and manage promotional coupons</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm"
        >
          <Plus size={18} /> Create Coupon
        </button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-sm">Total Coupons</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{coupons.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-sm">Expired</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{expiredCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-sm">Total Uses</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {coupons.reduce((sum, c) => sum + c.usedCount, 0)}
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
        </div>
      </motion.div>

      {/* Coupons List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredCoupons.length === 0 ? null : (
        <div className="grid gap-4">
          {filteredCoupons.map((coupon) => {
            const isExpired = new Date(coupon.validUntil) < new Date()
            const isMaxedOut = coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses
            
            return (
              <motion.div key={coupon._id} variants={itemVariants} className="bg-white rounded-xl p-4 lg:p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-bold text-gray-900 font-mono">{coupon.code}</span>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        coupon.isActive && !isExpired && !isMaxedOut
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {coupon.isActive && !isExpired && !isMaxedOut ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {coupon.description && (
                      <p className="text-gray-500 text-sm mb-2">{coupon.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Tag size={14} />
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountValue}% OFF` 
                          : `Rs. ${coupon.discountValue} OFF`}
                      </span>
                      <span className="flex items-center gap-1">
                        Min: Rs. {coupon.minOrderAmount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {coupon.usedCount}/{coupon.maxUses || '∞'} uses
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        Expires: {new Date(coupon.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(coupon)}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        coupon.isActive 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {coupon.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => openModal(coupon)}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all duration-200"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon._id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full border border-gray-100 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
              </h2>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm flex items-center gap-2">
                <Check size={16} /> {formSuccess}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SUMMER20"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Summer sale discount"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Value</label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) })}
                    min="0"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Order Amount (Rs.)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseFloat(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Uses (Empty = unlimited)</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    min="1"
                    placeholder="e.g., 100"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-200"
                >
                  {formLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>{editingCoupon ? 'Update' : 'Create'} Coupon</>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
