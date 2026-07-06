'use client'

import { API } from '@/lib/config'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

import { ProductCardSkeleton } from '@/components/LoadingSkeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Star, Heart, SlidersHorizontal, X, Check } from 'lucide-react'

interface Product {
  _id: string
  name: string
  price: number
  originalPrice: number
  category: string
  images: string[]
  rating: number
  reviews: number
}

const categoriesList = ['all', 'Electronics', 'Fashion', 'Sports', 'Home & Living', 'Beauty', 'Books & Media', 'Toys & Games', 'Automotive', 'Pet Supplies', 'Groceries', 'Kitchen & Dining', 'Office Supplies']

function getProductImage(product: Product, index: number = 0): string {
  if (product.images && product.images.length > 0 && product.images[index]) {
    return product.images[index]
  }
  const name = product.name || 'Product'
  return `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect fill='%234F46E5' width='600' height='600'/%3E%3Ctext fill='%23FFFFFF' font-family='Arial' font-size='28' font-weight='bold' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E${encodeURIComponent(name)}%3C/text%3E%3C/svg%3E`
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get('category')
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [filters, setFilters] = useState({
    category: urlCategory || 'all',
    search: '',
    minPrice: 0,
    maxPrice: 500000,
    rating: 0,
    sort: 'relevance'
  })
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [animatingWishlist, setAnimatingWishlist] = useState<string | null>(null)

  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist')
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist))
    }
  }, [])

  useEffect(() => {
    if (urlCategory) {
      setFilters(prev => ({ ...prev, category: urlCategory }))
    }
  }, [urlCategory])

  useEffect(() => {
    setPage(1)
  }, [filters.category, filters.search, filters.minPrice, filters.maxPrice, filters.sort])

  useEffect(() => {
    fetchProducts()
  }, [filters, page])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.category !== 'all') params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)
      params.append('minPrice', filters.minPrice.toString())
      params.append('maxPrice', filters.maxPrice.toString())
      params.append('sort', filters.sort)
      params.append('page', page.toString())
      params.append('limit', '48')
      
      const response = await fetch(`${API.products}?${params.toString()}`)
      const data = await response.json()
      setProducts(data.products || data)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
    setLoading(false)
  }

  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=wishlist'
      return
    }
    
    setAnimatingWishlist(productId)
    
    let newWishlist: string[] = []
    if (wishlist.includes(productId)) {
      newWishlist = wishlist.filter((id: string) => id !== productId)
      setToast('Removed from wishlist')
    } else {
      newWishlist = [...wishlist, productId]
      setToast('Added to wishlist')
    }
    
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
    
    setTimeout(() => setAnimatingWishlist(null), 500)
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 50 }}
            className="fixed top-24 right-4 z-50 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Check size={18} className="text-green-400" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800">All Products</h1>
          <p className="text-gray-600 mt-2">Browse our collection of premium products</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <button 
            className="lg:hidden flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl"
            onClick={() => setShowMobileFilters(true)}
          >
            <SlidersHorizontal size={20} />
            Filters
          </button>

          <aside className={`lg:w-72 ${showMobileFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : 'hidden lg:block'}`}>
            {showMobileFilters && (
              <button 
                className="absolute top-4 right-4 p-2 bg-gray-100 rounded-lg lg:hidden"
                onClick={() => setShowMobileFilters(false)}
              >
                <X size={24} />
              </button>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Search</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Category</h3>
                <div className="space-y-2">
                  {categoriesList.map((cat: string) => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === cat}
                        onChange={() => setFilters({...filters, category: cat})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-600 capitalize">{cat === 'all' ? 'All Categories' : cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Price Range</h3>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                onClick={() => setFilters({
                  category: 'all',
                  search: '',
                  minPrice: 0,
                  maxPrice: 5000,
                  rating: 0,
                  sort: 'relevance'
                })}
                className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <p className="text-gray-600">
                {loading ? 'Loading...' : `${products.length} products found`}
                {filters.category !== 'all' && (
                  <span className="ml-2 text-blue-600 font-medium">in {filters.category}</span>
                )}
              </p>
              <select
                value={filters.sort}
                onChange={(e) => setFilters({...filters, sort: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    whileHover={{ y: -8 }}
                  >
                    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group h-full flex flex-col">
                      <Link href={`/product/${product._id}`} className="flex-1">
                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                          </div>
                          
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => toggleWishlist(product._id, e)}
                            className={`absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
                              wishlist.includes(product._id) ? 'text-orange-500' : 'hover:text-orange-500'
                            }`}
                          >
                            <motion.div
                              animate={animatingWishlist === product._id ? { scale: [1, 1.3, 1] } : {}}
                              transition={{ duration: 0.3 }}
                            >
                              <Heart size={20} className={wishlist.includes(product._id) ? 'fill-current' : ''} />
                            </motion.div>
                          </motion.button>
                        </div>
                      </Link>
                      
                      <div className="p-4">
                        <p className="text-sm text-gray-500 mb-1">{product.category}</p>
                        <Link href={`/product/${product._id}`}>
                          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">{product.name}</h3>
                        </Link>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">({product.reviews})</span>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-xl font-bold text-blue-600">Rs. {product.price}</span>
                          <span className="text-sm text-gray-400 line-through">Rs. {product.originalPrice}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-gray-600 text-sm">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}

