const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const API = {
  base: API_BASE_URL,
  products: `${API_BASE_URL}/api/products`,
  product: (id: string) => `${API_BASE_URL}/api/products/${id}`,
  featured: `${API_BASE_URL}/api/products/featured`,
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    profile: `${API_BASE_URL}/api/auth/profile`,
    sendOtp: `${API_BASE_URL}/api/auth/send-otp`,
    verifyOtp: `${API_BASE_URL}/api/auth/verify-otp`,
    loginWithOtp: `${API_BASE_URL}/api/auth/login-with-otp`,
    changePassword: `${API_BASE_URL}/api/auth/change-password`,
    addresses: `${API_BASE_URL}/api/auth/addresses`,
  },
  orders: {
    create: `${API_BASE_URL}/api/orders`,
    user: (userId: string) => `${API_BASE_URL}/api/orders/user/${userId}`,
    details: (id: string) => `${API_BASE_URL}/api/orders/${id}`,
    track: `${API_BASE_URL}/api/track-order`,
    guestTrack: `${API_BASE_URL}/api/orders/guest/track`,
  },
  admin: {
    login: `${API_BASE_URL}/api/admin/login`,
    orders: `${API_BASE_URL}/api/admin/all-orders`,
    riders: `${API_BASE_URL}/api/admin/all-riders`,
    products: `${API_BASE_URL}/api/admin/products`,
    users: `${API_BASE_URL}/api/admin/users`,
    categories: `${API_BASE_URL}/api/admin/categories`,
    analytics: `${API_BASE_URL}/api/admin/analytics`,
  },
  coupons: {
    validate: `${API_BASE_URL}/api/coupons/validate`,
    apply: `${API_BASE_URL}/api/coupons/apply`,
  },
  payment: {
    createIntent: `${API_BASE_URL}/api/create-payment-intent`,
    updateStatus: `${API_BASE_URL}/api/update-payment-status`,
  },
}
