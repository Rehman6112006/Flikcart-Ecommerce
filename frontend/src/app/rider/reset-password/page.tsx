'use client'

import { API } from '@/lib/config'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Bike } from 'lucide-react'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API.base}/api/riders/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to reset')
      setDone(true)
      setTimeout(() => router.push('/rider/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Invalid or missing reset link</p>
        <Link href="/rider/forgot-password" className="text-orange-500 font-semibold text-sm mt-3 inline-block">Request new link</Link>
      </div>
    )
  }

  if (done) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-7 h-7 text-green-500" />
        </div>
        <p className="text-gray-800 font-semibold text-sm">Password Reset!</p>
        <p className="text-gray-500 text-xs mt-1">Redirecting to login...</p>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
        <input type={show ? 'text' : 'password'} value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full pl-10 pr-10 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/60 text-sm placeholder:text-gray-400"
          placeholder="New Password" required />
        <button type="button" onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
        <input type="password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/60 text-sm placeholder:text-gray-400"
          placeholder="Confirm Password" required />
      </div>
      <motion.button type="submit" disabled={loading}
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 shadow-md shadow-orange-500/20">
        {loading ? (
          <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : 'Reset Password'}
      </motion.button>
    </form>
  )
}

export default function RiderResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-yellow-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F97316' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
      <motion.div animate={{ scale: [1, 1.1, 1], x: [0, 20, 0] }} transition={{ duration: 18, repeat: Infinity }}
        className="absolute top-10 right-[8%] w-80 h-80 bg-gradient-to-br from-orange-400/15 to-yellow-500/15 rounded-full blur-3xl" />
      <motion.div animate={{ scale: [1, 1.15, 1], x: [0, -30, 0] }} transition={{ duration: 14, repeat: Infinity }}
        className="absolute bottom-10 left-[8%] w-72 h-72 bg-gradient-to-br from-orange-300/15 to-red-400/15 rounded-full blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm mx-4 relative z-10">
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-7">
          <div className="text-center mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-orange-500/20">
              <Bike className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Set New Password</h2>
            <p className="text-gray-500 text-sm mt-1">Enter your new password below</p>
          </div>
          <Suspense fallback={<div className="text-center py-6 text-gray-400 text-sm">Loading...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </motion.div>
    </div>
  )
}
