'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, Bike, Star, CheckCircle, 
  MapPin, Edit2, Save, X, RefreshCw, LogOut,
  Truck, Shield
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface RiderProfile {
  _id: string
  name: string
  email: string
  phone: string
  photo?: string
  vehicle: string
  licenseNumber?: string
  rating: number
  totalDeliveries: number
  status: string
  currentLocation?: {
    lat: number
    lng: number
    updatedAt: string
  }
  createdAt: string
}

export default function RiderProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<RiderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', vehicle: '' })
  const [message, setMessage] = useState('')

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      const riderToken = localStorage.getItem('riderToken')
      const res = await fetch(`${API.base}/api/riders/profile`, {
        headers: { 'Authorization': `Bearer ${riderToken}` }
      })
      const data = await res.json()
      setProfile(data)
      setForm({ name: data.name, phone: data.phone, vehicle: data.vehicle })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const riderToken = localStorage.getItem('riderToken')
      const res = await fetch(`${API.base}/api/riders/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${riderToken}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (res.ok) {
        setProfile(data.rider)
        setEditing(false)
        setMessage('Profile updated successfully')
        localStorage.setItem('riderData', JSON.stringify(data.rider))
      } else {
        setMessage(data.message || 'Failed to update')
      }
    } catch {
      setMessage('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('riderToken')
    localStorage.removeItem('riderData')
    router.push('/rider/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Profile not found</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <div className="flex items-center gap-2">
            <button onClick={fetchProfile} className="p-2.5 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all">
              <RefreshCw size={18} />
            </button>
            <button onClick={logout} className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8 text-white">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
                {profile.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.name}</h2>
                <p className="text-blue-100 flex items-center gap-2 mt-1">
                  <Bike size={16} /> {profile.vehicle}
                </p>
              </div>
              <div className="ml-auto text-right">
                <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-bold ${
                  profile.status === 'active' ? 'bg-green-400/20 text-green-200' :
                  profile.status === 'busy' ? 'bg-yellow-400/20 text-yellow-200' :
                  'bg-gray-400/20 text-gray-200'
                }`}>
                  ● {profile.status}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{profile.rating}</p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{profile.totalDeliveries}</p>
                <p className="text-xs text-gray-500">Deliveries</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <Truck className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{profile.vehicle}</p>
                <p className="text-xs text-gray-500">Vehicle</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <Shield className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">{profile.licenseNumber || 'N/A'}</p>
                <p className="text-xs text-gray-500">License</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Edit Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Personal Information</h3>
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Edit2 size={16} /> Edit
              </button>
            )}
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-xl text-sm ${
              message.includes('success') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
            }`}>
              {message}
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="text" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input type="tel" value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
                <select value={form.vehicle}
                  onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setEditing(false); setForm({ name: profile.name, phone: profile.phone, vehicle: profile.vehicle }) }}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-gray-900 font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-gray-900 font-medium">{profile.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <Bike className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Vehicle</p>
                  <p className="text-gray-900 font-medium">{profile.vehicle}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-gray-900 font-medium">{new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Last Location Update</p>
                  <p className="text-gray-900 font-medium">
                    {profile.currentLocation?.updatedAt 
                      ? new Date(profile.currentLocation.updatedAt).toLocaleString()
                      : 'No location shared yet'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
