'use client'

import { API } from '@/lib/config'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bike, User, Mail, Lock, Phone, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

export default function RiderRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', vehicle: '', licenseNumber: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match'); return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API.base}/api/riders/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name, email: formData.email, password: formData.password,
          phone: formData.phone, vehicle: formData.vehicle, licenseNumber: formData.licenseNumber
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')
      localStorage.setItem('riderToken', data.token)
      localStorage.setItem('riderData', JSON.stringify(data.rider))
      setStep(3)
      setTimeout(() => router.push('/rider/dashboard'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields'); return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match'); return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters'); return
    }
    setError(''); setStep(2)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F97316' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

      <motion.div 
        animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity }}
        className="absolute top-10 right-[8%] w-80 h-80 bg-gradient-to-br from-orange-400/15 to-yellow-500/15 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ scale: [1, 1.15, 1], x: [0, -30, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
        className="absolute bottom-10 left-[8%] w-72 h-72 bg-gradient-to-br from-orange-300/15 to-red-400/15 rounded-full blur-3xl"
      />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-4 relative z-10"
      >
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-7">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-md shadow-orange-500/20">
                <Bike className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black italic tracking-tighter">
                <span className="text-orange-500">Flik</span><span className="text-orange-600">Rider</span>
              </span>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 ? 'Join as Rider' : step === 2 ? 'Vehicle Info' : 'Done!'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {step === 1 ? 'Create your rider account' : step === 2 ? 'Almost there!' : 'Registration complete'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s ? <CheckCircle size={14} /> : s}
                </div>
                {s < 2 && <div className={`w-10 h-0.5 rounded-full ${step > s ? 'bg-orange-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-600 text-sm"
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3"
              >
                <CheckCircle className="w-8 h-8 text-green-500" />
              </motion.div>
              <p className="text-gray-500 text-sm">Redirecting to dashboard...</p>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type="text" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/60 text-sm placeholder:text-gray-400"
                  placeholder="Full Name" required />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type="email" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/60 text-sm placeholder:text-gray-400"
                  placeholder="Email Address" required />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type={showPassword ? 'text' : 'password'} value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/60 text-sm placeholder:text-gray-400"
                  placeholder="Password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type="password" value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/60 text-sm placeholder:text-gray-400"
                  placeholder="Confirm Password" required />
              </div>
              <motion.button type="button" onClick={nextStep}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-500/20 flex items-center justify-center gap-2">
                Next Step <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.form
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type="tel" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/60 text-sm placeholder:text-gray-400"
                  placeholder="Phone Number" required />
              </div>
              <div className="relative">
                <Bike className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <select value={formData.vehicle}
                  onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/60 text-sm text-gray-500 appearance-none cursor-pointer" required>
                  <option value="">Vehicle Type</option>
                  <option value="Motorcycle">Motorcycle</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Car">Car</option>
                  <option value="Van">Van</option>
                </select>
              </div>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input type="text" value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/60 text-sm placeholder:text-gray-400"
                  placeholder="License (optional)" />
              </div>
              <div className="flex gap-3 pt-1">
                <motion.button type="button" onClick={() => setStep(1)}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex-1 py-3.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-all">
                  Back
                </motion.button>
                <motion.button type="submit" disabled={loading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl text-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 shadow-md shadow-orange-500/20 flex items-center justify-center gap-2">
                  {loading ? (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : 'Create Account'}
                </motion.button>
              </div>
            </motion.form>
          )}

          {step < 3 && (
            <div className="mt-5 text-center">
              <p className="text-gray-500 text-sm">
                Already a rider?{' '}
                <Link href="/rider/login" className="text-orange-500 font-semibold hover:text-orange-600">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
