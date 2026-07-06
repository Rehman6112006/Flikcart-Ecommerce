'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  Save, 
  Store, 
  Truck, 
  CreditCard, 
  RotateCcw,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  CheckCircle
} from 'lucide-react'
import { API } from '@/lib/config'
import { motion } from 'framer-motion'

interface Settings {
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  deliveryCharges: number
  freeDeliveryThreshold: number
  returnPolicy: string
  paymentMethods: string[]
  taxRate: number
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    storeName: 'FlikCart',
    storeEmail: 'support@flikcart.com',
    storePhone: '+92 300 1234567',
    storeAddress: '123 Commerce Street, Karachi, Pakistan',
    deliveryCharges: 150,
    freeDeliveryThreshold: 1000,
    returnPolicy: '7 days return policy',
    paymentMethods: ['Cash on Delivery', 'Online Payment'],
    taxRate: 18
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${API.base}/api/admin/settings`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const adminToken = localStorage.getItem('adminToken')
      const res = await fetch(`${API.base}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const togglePaymentMethod = (method: string) => {
    const methods = settings.paymentMethods.includes(method)
      ? settings.paymentMethods.filter(m => m !== method)
      : [...settings.paymentMethods, method]
    setSettings({ ...settings, paymentMethods: methods })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-6 bg-gray-50 min-h-screen"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500">Configure your store settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all duration-200 shadow-sm"
        >
          {saved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { id: 'general', label: 'General', icon: Store },
          { id: 'delivery', label: 'Delivery', icon: Truck },
          { id: 'payment', label: 'Payment', icon: CreditCard },
          { id: 'policy', label: 'Policy', icon: RotateCcw },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Content */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" /> Store Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.storeEmail}
                  onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={settings.storePhone}
                  onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={settings.storeAddress}
                  onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" /> Delivery Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Charges (PKR)</label>
                <input
                  type="number"
                  value={settings.deliveryCharges}
                  onChange={(e) => setSettings({ ...settings, deliveryCharges: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Threshold (PKR)</label>
                <input
                  type="number"
                  value={settings.freeDeliveryThreshold}
                  onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-blue-700 text-sm">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Orders above Rs {settings.freeDeliveryThreshold.toLocaleString()} will get free delivery.
                Orders below this amount will be charged Rs {settings.deliveryCharges.toLocaleString()} for delivery.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'payment' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" /> Payment Methods
            </h3>
            <div className="space-y-3">
              {['Cash on Delivery', 'Card Payment'].map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-blue-50 transition-all duration-200"
                >
                  <input
                    type="checkbox"
                    checked={settings.paymentMethods.includes(method)}
                    onChange={() => togglePaymentMethod(method)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-900">{method}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'policy' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-600" /> Return Policy
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Policy</label>
              <textarea
                value={settings.returnPolicy}
                onChange={(e) => setSettings({ ...settings, returnPolicy: e.target.value })}
                rows={4}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your return policy..."
              />
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
