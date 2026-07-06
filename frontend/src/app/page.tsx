'use client'

import { API } from '@/lib/config'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Star, Truck, Shield, Zap, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'

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

const categories = [
  { id: 1, name: 'Mobiles', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400', filter: 'Electronics' },
  { id: 2, name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400', filter: 'Fashion' },
  { id: 3, name: 'Electronics', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400', filter: 'Electronics' },
  { id: 4, name: 'Home', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', filter: 'Home & Living' },
  { id: 5, name: 'Appliances', image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400', filter: 'Home & Living' },
  { id: 6, name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400', filter: 'Beauty' },
]

export default function Home() {
  const [row1Products, setRow1Products] = useState<Product[]>([])
  const [row2Products, setRow2Products] = useState<Product[]>([])
  const [row1Page, setRow1Page] = useState(1)
  const [row2Page, setRow2Page] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore1, setLoadingMore1] = useState(false)
  const [loadingMore2, setLoadingMore2] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const scrollRef1 = useRef<HTMLDivElement>(null)
  const scrollRef2 = useRef<HTMLDivElement>(null)

  const heroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200',
      title: 'Big Billion Days',
      subtitle: 'Up to 70% Off',
      cta: 'Shop Now',
      color: 'from-blue-600 to-blue-800',
      category: null,
    },
    {
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200',
      title: 'Fashion Fiesta',
      subtitle: 'Min 50% Off',
      cta: 'Explore',
      color: 'from-purple-600 to-pink-600',
      category: 'Fashion',
    },
    {
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200',
      title: 'Electronics Sale',
      subtitle: 'Best Deals on Gadgets',
      cta: 'Buy Now',
      color: 'from-indigo-600 to-purple-600',
      category: 'Electronics',
    },
  ]

  useEffect(() => {
    fetchProducts()
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  // Auto-scroll for row 1 - STARTS AFTER 1 MINUTE
  useEffect(() => {
    if (!scrollRef1.current || row1Products.length === 0) return
    
    const container = scrollRef1.current
    let scrollPos = 0
    let scrollInterval: NodeJS.Timeout | null = null
    
    const startTimeout = setTimeout(() => {
      const speed = 0.3
      scrollInterval = setInterval(() => {
        scrollPos += speed
        container.scrollTo({ left: scrollPos, behavior: 'auto' })
        
        if (scrollPos >= container.scrollWidth / 2) {
          scrollPos = 0
          container.scrollTo({ left: 0, behavior: 'auto' })
        }
      }, 30)
    }, 60000)
    
    return () => {
      clearTimeout(startTimeout)
      if (scrollInterval) clearInterval(scrollInterval)
    }
  }, [row1Products])

  // Auto-scroll for row 2 - STARTS AFTER 1 MINUTE
  useEffect(() => {
    if (!scrollRef2.current || row2Products.length === 0) return
    
    const container = scrollRef2.current
    let scrollPos = container.scrollWidth / 2
    let scrollInterval: NodeJS.Timeout | null = null
    
    container.scrollTo({ left: scrollPos, behavior: 'auto' })
    
    const startTimeout = setTimeout(() => {
      const speed = 0.3
      scrollInterval = setInterval(() => {
        scrollPos -= speed
        container.scrollTo({ left: scrollPos, behavior: 'auto' })
        
        if (scrollPos <= 0) {
          scrollPos = container.scrollWidth / 2
          container.scrollTo({ left: scrollPos, behavior: 'auto' })
        }
      }, 30)
    }, 60000)
    
    return () => {
      clearTimeout(startTimeout)
      if (scrollInterval) clearInterval(scrollInterval)
    }
  }, [row2Products])

  const fetchProducts = async () => {
    try {
      const [res1, res2] = await Promise.all([
        fetch(`${API.products}?sort=rating&limit=15&page=1`),
        fetch(`${API.products}?sort=price&limit=15&page=2`)
      ])
      
      const data1 = await res1.json()
      const data2 = await res2.json()
      
      setRow1Products(data1.products || data1)
      setRow2Products(data2.products || data2)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load more products for row 1
  const loadMoreRow1 = async () => {
    if (loadingMore1) return
    setLoadingMore1(true)
    try {
      const nextPage = row1Page + 1
      const res = await fetch(`${API.products}?sort=rating&limit=10&page=${nextPage}`)
      const data = await res.json()
      const newProducts = data.products || data
      if (newProducts.length > 0) {
        setRow1Products(prev => [...prev, ...newProducts])
        setRow1Page(nextPage)
      }
    } catch (error) {
      console.error('Error loading more row 1:', error)
    }
    setLoadingMore1(false)
  }

  // Load more products for row 2
  const loadMoreRow2 = async () => {
    if (loadingMore2) return
    setLoadingMore2(true)
    try {
      const nextPage = row2Page + 1
      const res = await fetch(`${API.products}?sort=price&limit=10&page=${nextPage + 1}`)
      const data = await res.json()
      const newProducts = data.products || data
      if (newProducts.length > 0) {
        setRow2Products(prev => [...prev, ...newProducts])
        setRow2Page(nextPage)
      }
    } catch (error) {
      console.error('Error loading more row 2:', error)
    }
    setLoadingMore2(false)
  }

  // Netflix-style scroll buttons - with load more
  const scrollRow = async (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right', rowNum: number) => {
    if (!ref.current) return
    const container = ref.current
    const scrollAmount = 400
    
    if (direction === 'right') {
      // Check if near end
      const nearEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 500
      if (nearEnd) {
        if (rowNum === 1) await loadMoreRow1()
        else await loadMoreRow2()
      }
    }
    
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-6">
          <div className="flex gap-4">
            <div className="flex-1 relative h-[300px] rounded-2xl overflow-hidden shadow-lg">
              <AnimatePresence mode="wait">
                {heroSlides.map((slide, index) => (
                  currentSlide === index && (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0"
                    >
                      <Link href={slide.category ? `/products?category=${encodeURIComponent(slide.category)}` : '/products'}>
                        <Image
                          src={slide.image}
                          alt={slide.title}
                          fill
                          className="object-cover cursor-pointer"
                          priority={index === 0}
                        />
                      </Link>
                      <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-70`} />
                      <div className="absolute inset-0 flex items-center px-8 md:px-12">
                        <div className="text-white max-w-md">
                          <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl md:text-4xl font-bold mb-2"
                          >
                            {slide.title}
                          </motion.h2>
                          <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-xl md:text-2xl font-semibold mb-4"
                          >
                            {slide.subtitle}
                          </motion.p>
                          <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                          >
                            <Link href={slide.category ? `/products?category=${encodeURIComponent(slide.category)}` : '/products'}>
                              <button className="px-6 py-2.5 bg-white text-gray-900 rounded-lg font-semibold hover:bg-yellow-400 transition-colors flex items-center gap-2">
                                {slide.cta} <ArrowRight size={18} />
                              </button>
                            </Link>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  )
                ))}
              </AnimatePresence>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {heroSlides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      currentSlide === index ? 'bg-white w-6' : 'bg-white/50 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-4 w-72">
              {/* Sports Shoes - Clickable to Sports category */}
              <Link href="/products?category=Sports" className="flex-1 relative rounded-2xl overflow-hidden shadow-md group cursor-pointer">
                <Image
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"
                  alt="Sports Shoes"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-medium">New Arrivals</p>
                  <p className="text-lg font-bold">Sports Shoes</p>
                </div>
              </Link>
              
              {/* Smart Watches - Clickable to Electronics category */}
              <Link href="/products?category=Electronics" className="flex-1 relative rounded-2xl overflow-hidden shadow-md group cursor-pointer">
                <Image
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"
                  alt="Smart Watches"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-medium">Trending</p>
                  <p className="text-lg font-bold">Smart Watches</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On orders over Rs. 5000', color: 'text-blue-600' },
              { icon: Shield, title: 'Secure Payment', desc: '100% protected', color: 'text-green-600' },
              { icon: Zap, title: 'Fast Delivery', desc: '2-3 business days', color: 'text-orange-600' },
              { icon: Star, title: 'Best Quality', desc: 'Premium products', color: 'text-purple-600' },
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <feature.icon size={28} className={feature.color} />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Shop by Category</h2>
            <Link href="/products" className="text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all text-sm">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/products?category=${encodeURIComponent(cat.filter)}`}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-2 shadow-md group-hover:shadow-lg transition-all">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <p className="text-center font-medium text-gray-800 text-sm group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Row 1 with Netflix Navigation */}
      <section className="py-8 bg-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-orange-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Top Rated Products</h2>
            </div>
            <Link href="/products" className="text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all text-sm">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="relative group">
              {/* Left Button - ALWAYS VISIBLE */}
              <button
                onClick={() => scrollRow(scrollRef1, 'left', 1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all -translate-x-2 hover:scale-110"
              >
                <ChevronLeft size={24} className="text-gray-800" />
              </button>

              {/* Right Button - ALWAYS VISIBLE */}
              <button
                onClick={() => scrollRow(scrollRef1, 'right', 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all translate-x-2 hover:scale-110"
              >
                <ChevronRight size={24} className="text-gray-800" />
              </button>

              {/* Scroll Container */}
              <div 
                ref={scrollRef1}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {row1Products.map((product, idx) => (
                  <ProductCard key={`row1-${product._id}-${idx}`} product={product} />
                ))}
                {loadingMore1 && (
                  <div className="flex-shrink-0 w-52 h-80 bg-gray-200 rounded-xl animate-pulse flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Loading...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products - Row 2 with Netflix Navigation */}
      <section className="py-8 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="text-purple-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Best Deals</h2>
            </div>
            <Link href="/products" className="text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all text-sm">
              View All <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex-shrink-0 w-48 h-64 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="relative group">
              {/* Left Button - ALWAYS VISIBLE */}
              <button
                onClick={() => scrollRow(scrollRef2, 'left', 2)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all -translate-x-2 hover:scale-110"
              >
                <ChevronLeft size={24} className="text-gray-800" />
              </button>

              {/* Right Button - ALWAYS VISIBLE */}
              <button
                onClick={() => scrollRow(scrollRef2, 'right', 2)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all translate-x-2 hover:scale-110"
              >
                <ChevronRight size={24} className="text-gray-800" />
              </button>

              {/* Scroll Container */}
              <div 
                ref={scrollRef2}
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {row2Products.map((product, idx) => (
                  <ProductCard key={`row2-${product._id}-${idx}`} product={product} />
                ))}
                {loadingMore2 && (
                  <div className="flex-shrink-0 w-52 h-80 bg-gray-200 rounded-xl animate-pulse flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Loading...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Promo Banners */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/products?category=Electronics" className="relative h-48 rounded-2xl overflow-hidden group shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600"
                alt="Electronics"
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-6">
                <span className="inline-block w-fit px-3 py-1 bg-yellow-400 text-blue-900 rounded-full text-xs font-bold mb-2">
                  New Arrivals
                </span>
                <h3 className="text-2xl font-bold text-white mb-1">Latest Electronics</h3>
                <p className="text-white/80 text-sm mb-3">Up to 40% off on gadgets</p>
                <button className="w-fit px-4 py-2 bg-white text-blue-900 rounded-lg font-semibold text-sm hover:bg-yellow-400 transition-colors flex items-center gap-1">
                  Shop Now <ArrowRight size={16} />
                </button>
              </div>
            </Link>

            <Link href="/products?category=Fashion" className="relative h-48 rounded-2xl overflow-hidden group shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600"
                alt="Fashion"
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-pink-900/80 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center p-6">
                <span className="inline-block w-fit px-3 py-1 bg-yellow-400 text-pink-900 rounded-full text-xs font-bold mb-2">
                  Trending
                </span>
                <h3 className="text-2xl font-bold text-white mb-1">Fashion Collection</h3>
                <p className="text-white/80 text-sm mb-3">Min 50% off on brands</p>
                <button className="w-fit px-4 py-2 bg-white text-pink-900 rounded-lg font-semibold text-sm hover:bg-yellow-400 transition-colors flex items-center gap-1">
                  Explore <ArrowRight size={16} />
                </button>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
