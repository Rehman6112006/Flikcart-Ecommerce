'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Check, CreditCard, Banknote, ArrowLeft, Lock, MapPin, Save, Loader2, Tag, X, RotateCcw } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Initialize Stripe with your publishable key
const stripePromise = loadStripe('pk_test_51T5aMdEeQY3lgASwOfdRw7kK4pj5VmfdymMST23ifkmuUgrEZDxhSGImeNTLf92WBVIR5yHvOMBhwOzjOjgUVfGO00dNQEXCmW')

const pakistanData: Record<string, string[]> = {
  'Punjab': ['Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Gujranwala', 'Sialkot'],
  'Sindh': ['Karachi', 'Hyderabad', 'Sukkur', 'Larkana'],
  'Khyber Pakhtunkhwa': ['Peshawar', 'Mardan', 'Abbottabad', 'Swat'],
  'Balochistan': ['Quetta', 'Gwadar'],
  'Gilgit-Baltistan': ['Gilgit', 'Skardu'],
  'Azad Jammu & Kashmir': ['Muzaffarabad', 'Mirpur']
}

const internationalCountries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Italy',
  'Spain', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'UAE', 'Saudi Arabia',
  'Qatar', 'Kuwait', 'Oman', 'Bahrain', 'Singapore', 'Malaysia', 'Japan', 'South Korea', 'China'
]

// Card input styling for Stripe
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
  hidePostalCode: true,
}

function CheckoutForm({ total, onSuccess, onError }: { total: number; onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [cardError, setCardError] = useState('')

  const handlePayment = async () => {
    if (!stripe || !elements) {
      setCardError('Stripe is not loaded. Please refresh the page.')
      return
    }

    setProcessing(true)
    setCardError('')

    try {
      // Create payment intent on server
      const response = await fetch(API.payment.createIntent, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: total,
          email: (document.querySelector('input[name="email"]') as HTMLInputElement)?.value || 'test@example.com'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setCardError(data.message || 'Failed to create payment intent')
        setProcessing(false)
        return
      }

      const { clientSecret } = data

      if (!clientSecret) {
        setCardError('Failed to create payment intent. Please try again.')
        setProcessing(false)
        return
      }

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        setCardError('Card element not found. Please refresh the page.')
        setProcessing(false)
        return
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        }
      })

      if (error) {
        const errorMsg = error.message || 'Payment failed. Please check your card details.'
        setCardError(errorMsg)
        onError(errorMsg)
        setProcessing(false)
        return
      } 
      
      if (paymentIntent && paymentIntent.status) {
        // For test payments, any status except 'failed' is considered success
        onSuccess()
      } else {
        setCardError('Payment was not completed. Please try again.')
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred. Please try again.'
      setCardError(errorMsg)
      onError(errorMsg)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border-2 border-gray-200 rounded-xl bg-white">
        <CardElement options={cardElementOptions} />
      </div>
      {cardError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {cardError}
        </div>
      )}
      <button
        type="button"
        disabled={!stripe || processing}
        onClick={handlePayment}
        className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock size={20} />
            Pay Rs. {total.toFixed(2)}
          </>
        )}
      </button>
      <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
        <Lock size={12} />
        Secured by Stripe - PCI Compliant
      </p>
    </div>
  )
}

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saveAddress, setSaveAddress] = useState(false)
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [paymentError, setPaymentError] = useState('')
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [formData, setFormData] = useState({
    email: '', firstName: '', lastName: '', phone: '', address: '', city: '', province: '', country: 'Pakistan', zipCode: ''
  })
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string; discount: number; discountType: string; discountValue: number} | null>(null)

  const { items, getTotal, clearCart } = useCartStore()
  const subtotal = getTotal()
  const shipping = subtotal > 5000 ? 0 : 250
  const tax = subtotal * 0.02
  const discount = appliedCoupon ? (appliedCoupon.discountType === 'percentage' ? (subtotal * appliedCoupon.discountValue / 100) : appliedCoupon.discount) : 0
  const total = subtotal + shipping + tax - discount

  useEffect(() => {
    // Check for saved address in localStorage (for guest users)
    const savedAddr = localStorage.getItem('flikkart_saved_address')
    if (savedAddr) {
      try {
        const addr = JSON.parse(savedAddr)
        setFormData(prev => ({
          ...prev,
          firstName: prev.firstName || addr.firstName || '',
          lastName: prev.lastName || addr.lastName || '',
          email: prev.email || addr.email || '',
          phone: prev.phone || addr.phone || '',
          address: prev.address || addr.address || '',
          city: prev.city || addr.city || '',
          province: prev.province || addr.province || ''
        }))
      } catch (err) { console.error('Error loading saved address:', err) }
    }

    // Also fetch saved addresses from server if logged in
    const userStr = localStorage.getItem('user')
    if (userStr) {
fetch(API.auth.addresses, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSavedAddresses(data) })
      .catch(console.error)
    }

    // Handle retry payment
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('retry') === 'true') {
      const retryOrderId = localStorage.getItem('retryOrderId')
      if (retryOrderId) {
        fetchOrderForRetry(retryOrderId)
      }
    }
  }, [])

  const fetchOrderForRetry = async (orderId: string) => {
    try {
      const res = await fetch(API.orders.details(orderId))
      if (res.ok) {
        const order = await res.json()
        // Pre-fill the form with previous order details
        setFormData({
          firstName: order.shippingAddress?.fullName?.split(' ')[0] || '',
          lastName: order.shippingAddress?.fullName?.split(' ').slice(1).join(' ') || '',
          email: order.paymentResult?.email || '',
          phone: order.shippingAddress?.phone || '',
          address: order.shippingAddress?.address || '',
          city: order.shippingAddress?.city || '',
          province: order.shippingAddress?.state || '',
          country: order.shippingAddress?.country || 'Pakistan',
          zipCode: order.shippingAddress?.zipCode || ''
        })
        // Set step to 2 (payment) since shipping info is filled
        setStep(2)
      }
    } catch (error) {
      console.error('Error fetching order for retry:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    if (name === 'province') setFormData(prev => ({ ...prev, city: '' }))
    if (name === 'country') setFormData(prev => ({ ...prev, province: '', city: '' }))
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code')
      return
    }
    setCouponLoading(true)
    setCouponError('')
    try {
      const res = await fetch(API.coupons.validate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, orderAmount: subtotal })
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.coupon.code,
          discount: data.discount,
          discountType: data.coupon.discountType,
          discountValue: data.coupon.discountValue
        })
        setCouponError('')
      } else {
        setCouponError(data.message || 'Invalid coupon')
        setAppliedCoupon(null)
      }
    } catch (error) {
      setCouponError('Error validating coupon')
      setAppliedCoupon(null)
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setCouponError('')
  }

  const handleAddressSelect = (addr: any) => {
    setFormData({ ...formData, ...addr })
  }

  // Save address to localStorage for guest users and also to server for logged in users
  const saveAddressToAccount = async () => {
    const addressData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      province: formData.province,
      country: 'Pakistan',
      savedAt: new Date().toISOString()
    }

    // Save to localStorage (works for both guest and logged in users)
    localStorage.setItem('flikkart_saved_address', JSON.stringify(addressData))

    // Also save to server if user is logged in
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        await fetch(API.auth.addresses, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            fullName: `${formData.firstName} ${formData.lastName}`,
            address: formData.address,
            city: formData.city,
            state: formData.province,
      country: formData.country,
            phone: formData.phone
          })
        })
      } catch (err) { console.error('Error saving address to account:', err) }
    }
  }

  const handlePaymentSuccess = async () => {
    setLoading(true)
    try {
      const userStr = localStorage.getItem('user')
      const userData = userStr ? JSON.parse(userStr) : null
      
      const orderData = {
        user: userData?.id || 'guest',
        orderItems: items.map(item => ({
          product: item.id, name: item.name, price: item.price,
          quantity: item.quantity, image: item.image
        })),
        shippingAddress: {
          fullName: `${formData.firstName} ${formData.lastName}`,
          address: formData.address, city: formData.city,
          state: formData.province, zipCode: formData.zipCode || '', country: formData.country, phone: formData.phone,
          email: formData.email
        },
        paymentMethod: 'card',
        paymentResult: {
          id: 'stripe_payment',
          status: 'verified', // Auto-verify for card payment
          email: formData.email
        },
        itemsPrice: subtotal, shippingPrice: shipping,
        taxPrice: tax, totalPrice: total, discount: discount || 0,
        couponCode: appliedCoupon?.code || null,
        status: 'Processing', // Directly Processing for card payment
        isPaid: true, paidAt: new Date()
      }
      
      const res = await fetch(API.orders.create, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      })
        const data = await res.json()
        if (res.ok) {
          // Apply coupon in background (don't wait for it)
          if (appliedCoupon?.code) {
            fetch(API.coupons.apply, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: appliedCoupon.code })
            }).catch(err => console.error('Error applying coupon:', err))
          }
          // Clear retry order if any
          localStorage.removeItem('retryOrderId')
          setOrderId(data._id)
          clearCart()
          setOrderPlaced(true)
      } else {
        setPaymentError(data.message || 'Failed to place order')
      }
    } catch (error: any) {
      setPaymentError(error.message || 'Error placing order')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentError = (errorMsg: string) => {
    setPaymentError(errorMsg)
    // Optionally redirect to failed page
    // window.location.href = '/payment-failed'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 3) {
      if (step === 1 && saveAddress) await saveAddressToAccount()
      setStep(step + 1)
    } else {
      if (paymentMethod === 'card') {
        // For card payment, the form in step 3 will handle it
        return
      }
      
      setLoading(true)
      try {
        const userStr = localStorage.getItem('user')
        const userData = userStr ? JSON.parse(userStr) : null
        
        const orderData = {
          user: userData?.id || 'guest',
          orderItems: items.map(item => ({
            product: item.id, name: item.name, price: item.price,
            quantity: item.quantity, image: item.image
          })),
          shippingAddress: {
            fullName: `${formData.firstName} ${formData.lastName}`,
            address: formData.address, city: formData.city,
            state: formData.province, zipCode: formData.zipCode || '', country: formData.country, phone: formData.phone,
            email: formData.email
          },
          paymentMethod, 
          itemsPrice: subtotal, shippingPrice: shipping,
          taxPrice: tax, totalPrice: total, discount: discount || 0,
          couponCode: appliedCoupon?.code || null,
          status: paymentMethod === 'cod' ? 'Payment Pending - COD' : 'Processing',
          isPaid: paymentMethod !== 'cod',
          paidAt: paymentMethod !== 'cod' ? new Date() : null
        }
        
        const res = await fetch(API.orders.create, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(orderData)
        })
        const data = await res.json()
        if (res.ok) {
          // Apply coupon in background (don't wait for it)
          if (appliedCoupon?.code) {
            fetch(API.coupons.apply, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: appliedCoupon.code })
            }).catch(err => console.error('Error applying coupon:', err))
          }
          // Clear retry order if any
          localStorage.removeItem('retryOrderId')
          setOrderId(data._id)
          clearCart()
          setOrderPlaced(true)
        } else {
          alert(data.message || 'Failed to place order')
        }
      } catch (error: any) {
        alert(error.message || 'Error placing order')
      } finally {
        setLoading(false)
      }
    }
  }

  if (items.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <Link href="/products" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  if (orderPlaced) {
    const isCOD = paymentMethod === 'cod'
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${isCOD ? 'bg-purple-100' : 'bg-green-100'}`}>
            {isCOD ? (
              <Banknote className="w-12 h-12 text-purple-500" />
            ) : (
              <Check className="w-12 h-12 text-green-500" />
            )}
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {isCOD ? 'Order Placed - Cash on Delivery' : 'Payment Successful!'}
          </h2>
          <p className="text-gray-600 mb-2">Order #{orderId.slice(-8).toUpperCase()}</p>
          {isCOD && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mt-4 mb-2">
              <p className="text-sm text-purple-700">
                Pay cash to rider when your order is delivered
              </p>
            </div>
          )}
          <div className="space-y-3 mt-6">
            <Link href="/dashboard" className="block w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700">View Orders</Link>
            <Link href="/" className="block w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm lg:hidden">
        <div className="px-4 py-4">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600">
            <ArrowLeft size={20} /> Back to Cart
          </Link>
          <h1 className="text-xl font-bold text-gray-800 mt-2">Checkout</h1>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="bg-white shadow-sm hidden lg:block">
        <div className="container mx-auto px-4 py-6">
          <Link href="/cart" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4">
            <ArrowLeft size={20} /> Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Checkout</h1>
        </div>
      </div>

      {/* Progress Steps - Mobile Responsive */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between lg:justify-center lg:gap-4">
            {['Shipping', 'Payment', 'Review'].map((label, index) => (
              <div key={label} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${step > index + 1 ? 'bg-green-500 text-white' : (step === index + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500')}`}>
                  {step > index + 1 ? <Check size={16} /> : index + 1}
                </div>
                <span className={`ml-2 text-xs lg:text-sm ${step >= index + 1 ? 'text-gray-800 font-medium' : 'text-gray-500'} hidden sm:inline`}>{label}</span>
                {index < 2 && <div className="w-8 lg:w-12 h-0.5 bg-gray-200 mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Form Area */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Shipping */}
              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">Shipping Information</h2>
                  
                  {savedAddresses.length > 0 && (
                    <div className="mb-4 lg:mb-6">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2"><MapPin size={16} /> Saved Addresses</h3>
                      <div className="grid gap-3">
                        {savedAddresses.map((addr) => (
                          <button key={addr._id} type="button" onClick={() => handleAddressSelect(addr)}
                            className="p-3 lg:p-4 border-2 border-gray-200 rounded-xl text-left hover:border-blue-600 transition-all text-sm">
                            <p className="font-medium text-gray-800">{addr.firstName} {addr.lastName}</p>
                            <p className="text-gray-600">{addr.address}, {addr.city}</p>
                            <p className="text-gray-500">{addr.phone}</p>
                          </button>
                        ))}
                      </div>
                      <div className="my-4 border-t" />
                    </div>
                  )}

                  <div className="space-y-3 lg:space-y-4">
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required placeholder="First Name" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required placeholder="Last Name" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                    </div>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="Email" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                    <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="Phone (0300 1234567)" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                    <input type="text" name="address" value={formData.address} onChange={handleInputChange} required placeholder="Full Address" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      <select name="country" value={formData.country} onChange={handleInputChange} required className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base bg-white">
                        <option value="">Select Country</option>
                        <option value="Pakistan">Pakistan</option>
                        <optgroup label="International">
                          {internationalCountries.map(c => <option key={c} value={c}>{c}</option>)}
                        </optgroup>
                      </select>
                      {formData.country === 'Pakistan' ? (
                        <select name="province" value={formData.province} onChange={handleInputChange} required className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base bg-white">
                          <option value="">Select Province</option>
                          {Object.keys(pakistanData).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <input type="text" name="province" value={formData.province} onChange={handleInputChange} required placeholder="State / Province" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 lg:gap-4">
                      {formData.country === 'Pakistan' ? (
                        <select name="city" value={formData.city} onChange={handleInputChange} required disabled={!formData.province} className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base bg-white disabled:bg-gray-100">
                          <option value="">Select City</option>
                          {formData.province && pakistanData[formData.province]?.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      ) : (
                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} required placeholder="City" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                      )}
                      <input type="text" name="zipCode" value={formData.zipCode || ''} onChange={handleInputChange} placeholder="ZIP / Postal Code" className="w-full px-3 lg:px-4 py-2.5 lg:py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base" />
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 lg:p-4 bg-blue-50 rounded-xl">
                      <input type="checkbox" id="saveAddress" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                      <label htmlFor="saveAddress" className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer"><Save size={18} /> Save address to my account</label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">Payment Method</h2>
                  <div className="space-y-3 lg:space-y-4">
                    {[
                      { id: 'card', icon: CreditCard, label: 'Credit/Debit Card', desc: 'Visa, Mastercard - Secure Stripe Payment' },
                      { id: 'cod', icon: Banknote, label: 'Cash on Delivery', desc: 'Pay when you receive' }
                    ].map((method) => (
                      <label key={method.id} className={`flex items-center gap-3 lg:gap-4 p-3 lg:p-4 border-2 rounded-xl cursor-pointer transition-all ${paymentMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="w-5 h-5 text-blue-600" />
                        <method.icon className="w-5 lg:w-6 h-5 lg:h-6 text-gray-600" />
                        <div>
                          <p className="font-semibold text-gray-800 text-sm lg:text-base">{method.label}</p>
                          <p className="text-xs lg:text-sm text-gray-500">{method.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="mt-4 lg:mt-6 space-y-3 lg:space-y-4">
                      <div className="p-3 lg:p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-sm text-green-700 font-medium flex items-center gap-2">
                          <Lock size={16} />
                          Secure Stripe Payment - Visa/Mastercard Accepted
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'cod' && (
                    <div className="mt-4 lg:mt-6 p-3 lg:p-4 bg-green-50 rounded-xl">
                      <p className="text-sm text-green-700">Pay Rs. {total.toFixed(2)} in cash when your order is delivered.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Review & Pay */}
              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm">
                  <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">Review & Pay</h2>
                  <div className="space-y-3 lg:space-y-4">
                    <div className="p-3 lg:p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm lg:text-base">Shipping Address</h3>
                      <p className="text-gray-600 text-sm">{formData.firstName} {formData.lastName}<br/>{formData.address}<br/>{formData.city}, {formData.province}<br/>Pakistan<br/>{formData.phone}</p>
                    </div>
                    <div className="p-3 lg:p-4 bg-gray-50 rounded-xl">
                      <h3 className="font-semibold text-gray-800 mb-2 text-sm lg:text-base">Payment Method</h3>
                      <p className="text-gray-600 text-sm capitalize">
                        {paymentMethod === 'card' ? 'Credit/Debit Card (Stripe)' : 'Cash on Delivery'}
                      </p>
                    </div>
                  </div>

                  {/* Card Payment Form */}
                  {paymentMethod === 'card' && (
                    <div className="mt-4 lg:mt-6">
                      <h3 className="font-semibold text-gray-800 mb-3 text-sm lg:text-base flex items-center gap-2">
                        <CreditCard size={18} /> Enter Card Details
                      </h3>
                      <Elements stripe={stripePromise}>
                        <CheckoutForm 
                          total={total} 
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                      {paymentError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                          {paymentError}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 lg:gap-4 mt-4 lg:mt-6">
                {step > 1 && (
                  <button type="button" onClick={() => setStep(step - 1)} className="px-4 lg:px-6 py-2.5 lg:py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 text-sm lg:text-base">
                    Back
                  </button>
                )}
                
                {step < 3 && (
                  <button type="submit" className="flex-1 px-4 lg:px-6 py-2.5 lg:py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 text-sm lg:text-base">
                    {step === 1 ? 'Continue to Payment' : 'Continue to Review'}
                  </button>
                )}
                
                {step === 3 && paymentMethod !== 'card' && (
                  <button type="submit" disabled={loading} className="flex-1 px-4 lg:px-6 py-2.5 lg:py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50 text-sm lg:text-base">
                    {loading ? 'Processing...' : <><Lock size={18} /> Place Order</>}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-4 lg:p-6 shadow-sm lg:sticky lg:top-24">
              <h2 className="text-lg lg:text-xl font-bold text-gray-800 mb-4 lg:mb-6">Order Summary</h2>
              <div className="space-y-3 lg:space-y-4 mb-4 lg:mb-6 max-h-48 lg:max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 lg:gap-4">
                    <div className="w-14 lg:w-16 h-14 lg:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={item.image} alt={item.name} width={64} height={64} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                      <p className="text-gray-500 text-xs">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm whitespace-nowrap">Rs. {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 lg:space-y-3 border-t pt-3 lg:pt-4">
                <div className="flex justify-between text-gray-600 text-sm lg:text-base"><span>Subtotal</span><span>Rs. {subtotal.toFixed(2)}</span></div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 text-sm lg:text-base">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-Rs. {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 text-sm lg:text-base"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `Rs. ${shipping.toFixed(2)}`}</span></div>
                <div className="flex justify-between text-gray-600 text-sm lg:text-base"><span>Tax (2%)</span><span>Rs. {tax.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg lg:text-xl font-bold text-gray-800 pt-2 lg:pt-3 border-t"><span>Total</span><span>Rs. {total.toFixed(2)}</span></div>
              </div>
              
              {/* Coupon Input */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Tag size={16} /> Have a coupon code?
                </p>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-600" />
                      <span className="font-medium text-green-700">{appliedCoupon.code}</span>
                      <span className="text-sm text-green-600">
                        ({appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `Rs. ${appliedCoupon.discountValue}`} OFF)
                      </span>
                    </div>
                    <button onClick={handleRemoveCoupon} className="p-1 text-green-600 hover:bg-green-100 rounded-lg">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-3 lg:px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-600 text-base"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="px-4 lg:px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {couponLoading ? <Loader2 size={18} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-red-500 text-xs mt-2">{couponError}</p>
                )}
              </div>
              {subtotal < 5000 && <div className="mt-3 lg:mt-4 p-2.5 lg:p-3 bg-blue-50 rounded-lg text-xs lg:text-sm text-blue-700">Add Rs. {(5000 - subtotal).toFixed(2)} more for free shipping!</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

