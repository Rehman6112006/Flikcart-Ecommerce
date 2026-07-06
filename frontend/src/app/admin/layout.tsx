'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, Package, Users, Truck, 
  BarChart3, Settings, User, LogOut, Menu, X,
  ShoppingBag, ChevronLeft, CreditCard, Tag,
  ChevronDown, Upload, ImageIcon, RotateCcw
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Coupons', href: '/admin/coupons', icon: Tag },
  { name: 'Products', href: '/admin/products', icon: Package },
  { name: 'Bulk Upload', href: '/admin/bulk-upload', icon: Upload },
  { name: 'Banners', href: '/admin/banners', icon: ImageIcon },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Riders', href: '/admin/riders', icon: Truck },
  { name: 'Returns', href: '/admin/returns', icon: RotateCcw },
  { name: 'Reports', href: '/admin/reports', icon: BarChart3 },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Profile', href: '/admin/profile', icon: User },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [adminName, setAdminName] = useState('Admin')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const formatNameFromEmail = (email: string) => {
    const local = email.split('@')[0]
    return local
      .replace(/[._-]/g, ' ')
      .replace(/\d+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase()) || 'Admin'
  }

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) { setLoading(false); return }
    checkAuth()
  }, [isLoginPage])

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken')
    const adminStr = localStorage.getItem('adminData')
    if (token && adminStr) {
      try {
        const admin = JSON.parse(adminStr)
        setAdminName(admin.name || formatNameFromEmail(admin.email) || 'Admin')
        setIsAuthenticated(true)
      } catch { router.push('/admin/login') }
    } else { router.push('/admin/login') }
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminData')
    router.push('/admin/login')
  }

  if (isLoginPage) return <>{children}</>

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== SIDEBAR ===== */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 flex flex-col shadow-sm hidden lg:flex"
          >
            {/* Logo */}
            <div className="p-5 border-b border-gray-100">
              <Link href="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <span className="text-white font-bold text-lg">F</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black italic tracking-tighter">
                    <span className="text-blue-600">Flik</span><span className="text-blue-600">Cart</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium -mt-1">Admin Panel</span>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link key={item.name} href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all group ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    <span className="text-sm">{item.name}</span>
                    {isActive && <motion.div layoutId="activeTab" className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-auto" />}
                  </Link>
                )
              })}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-100">
              <button onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Collapsed sidebar toggle */}
      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-50 bg-white border border-l-0 border-gray-200 rounded-r-xl p-2 shadow-sm hover:bg-gray-50 hidden lg:block"
      >
        <ChevronLeft className={`w-4 h-4 text-gray-400 transition-transform ${!isSidebarOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ===== MOBILE HEADER ===== */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
                  <Link href="/admin" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">F</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base font-black italic tracking-tighter">
                        <span className="text-blue-600">Flik</span><span className="text-blue-600">Cart</span>
                      </span>
                      <span className="text-[8px] text-gray-400 -mt-1">Admin</span>
                    </div>
                  </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
              {adminName.charAt(0).toUpperCase()}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ===== MOBILE SIDEBAR ===== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <Link href="/admin" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-lg">F</span>
                    </div>
                    <span className="text-xl font-black italic tracking-tighter">
                      <span className="text-blue-600">Flik</span><span className="text-blue-600">Cart</span>
                    </span>
                  </Link>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>
              <nav className="p-3 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href)
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm ${
                        isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
              <div className="p-3 border-t border-gray-100">
                <button onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-red-500 hover:bg-red-50 text-sm"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== TOP BAR (Desktop) ===== */}
      <header className={`hidden lg:flex items-center justify-between h-16 bg-white border-b border-gray-200 px-6 sticky top-0 z-30 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div />
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {adminName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700">{adminName}</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {showProfileMenu && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
              >
                <Link href="/admin/profile" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Profile</Link>
                <Link href="/admin/settings" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">Settings</Link>
                <hr className="my-1 border-gray-100" />
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50">Logout</button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'} pt-0 lg:pt-0`}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {children}
        </motion.div>
      </main>
    </div>
  )
}
