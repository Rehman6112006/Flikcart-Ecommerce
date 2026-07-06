'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, EyeOff, CheckCircle, AlertCircle, Mail, Lock, User, ArrowRight } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [otpExpiry, setOtpExpiry] = useState<number>(0)
  const [timer, setTimer] = useState<number>(0)

  useEffect(() => {
    if (otpExpiry > 0) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((otpExpiry - Date.now()) / 1000))
        setTimer(remaining)
        if (remaining === 0) clearInterval(interval)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [otpExpiry])

  const handleSendOtp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields'); return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match'); return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters'); return
    }
    
    setSendingOtp(true); setError('')

    try {
      const res = await fetch(API.auth.sendOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP')

      setOtpExpiry(Date.now() + 60000)
      setTimer(60)
      setSuccess('Verification code sent!')
      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    if (Date.now() < otpExpiry) {
      const remaining = Math.ceil((otpExpiry - Date.now()) / 1000)
      setError(`Wait ${remaining}s before requesting new code`); return
    }
    setSendingOtp(true); setError('')
    try {
      const res = await fetch(`${API.base}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to resend OTP')

      setOtpExpiry(Date.now() + 60000)
      setTimer(60)
      setSuccess('New code sent!')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSendingOtp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')

    try {
      const res = await fetch(API.auth.verifyOtp, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, name, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Verification failed')

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      window.dispatchEvent(new Event('storage'))
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232563EB' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />

      <motion.div 
        animate={{ scale: [1, 1.1, 1], x: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity }}
        className="absolute top-10 right-[8%] w-80 h-80 bg-gradient-to-br from-blue-400/15 to-indigo-500/15 rounded-full blur-3xl"
      />
      <motion.div 
        animate={{ scale: [1, 1.15, 1], x: [0, -35, 0] }}
        transition={{ duration: 14, repeat: Infinity }}
        className="absolute bottom-10 left-[8%] w-72 h-72 bg-gradient-to-br from-indigo-300/15 to-purple-400/15 rounded-full blur-3xl"
      />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mx-4 relative z-10"
      >
        <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-7">
          <div className="text-center mb-6">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-black italic tracking-tighter">
                <span className="text-[#2563EB]">Flik</span><span className="text-[#2563EB]">cart</span>
              </span>
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 'details' ? 'Create Account' : 'Verify Email'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {step === 'details' ? 'Join us and start shopping' : `Code sent to ${email}`}
            </p>
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

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2.5 text-green-600 text-sm"
            >
              <CheckCircle size={16} />
              <span>{success}</span>
            </motion.div>
          )}

          {step === 'details' ? (
            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60 text-sm transition-all placeholder:text-gray-400"
                  placeholder="Full Name"
                  required
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-24 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60 text-sm transition-all placeholder:text-gray-400"
                  placeholder="Email Address"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !email || !name || !password || !confirmPassword}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingOtp ? (
                    <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : 'Send Code'}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60 text-sm transition-all placeholder:text-gray-400"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60 text-sm transition-all placeholder:text-gray-400"
                  placeholder="Confirm Password"
                  required
                />
              </div>

              <div className="text-center pt-1">
                <p className="text-gray-500 text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60 text-center text-lg tracking-[1em] font-bold transition-all placeholder:text-gray-300"
                  placeholder="000000"
                  required
                  maxLength={6}
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-xs text-gray-400">
                    {timer > 0 ? `Code expires in ${timer}s` : 'Code expired'}
                  </span>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={sendingOtp || timer > 0}
                    className="text-xs text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingOtp ? 'Sending...' : 'Resend'}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading || otp.length !== 6}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-semibold text-sm hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    Verify & Create Account
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-gray-400 hover:text-gray-600 text-xs transition-colors"
                >
                  ← Change Details
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-5">
          By continuing, you agree to our Terms & Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}
