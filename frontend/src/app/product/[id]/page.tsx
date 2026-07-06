'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

import { ProductDetailSkeleton } from '@/components/LoadingSkeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Heart, ShoppingCart, Truck, Shield, RotateCcw, Minus, Plus, Check, Ruler, Palette, MessageSquare, Send } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'

interface Review {
  _id: string
  name: string
  rating: number
  comment: string
  createdAt: string
}

interface Product {
  _id: string
  name: string
  price: number
  originalPrice: number
  category: string
  images: string[]
  rating: number
  reviews: number
  description: string
}

function getProductImages(product: Product): string[] {
  if (product.images && product.images.length > 0) {
    return product.images
  }
  const name = product.name || 'Product'
  const svg = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800'%3E%3Crect fill='%234F46E5' width='800' height='800'/%3E%3Ctext fill='%23FFFFFF' font-family='Arial' font-size='32' font-weight='bold' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle'%3E${encodeURIComponent(name)}%3C/text%3E%3C/svg%3E`
  return [svg, svg, svg, svg]
}

function needsSizeSelector(category: string): boolean {
  const fashionCategories = ['Fashion', 'Clothing', 'Shoes', 'Apparel']
  return fashionCategories.some(cat => category.toLowerCase().includes(cat.toLowerCase()))
}

function needsColorSelector(category: string): boolean {
  const colorCategories = ['Fashion', 'Electronics', 'Home & Living', 'Clothing', 'Shoes', 'Apparel', 'Beauty']
  return colorCategories.some(cat => category.toLowerCase().includes(cat.toLowerCase()))
}

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedColor, setSelectedColor] = useState(0)
  const [selectedSize, setSelectedSize] = useState(0)
  const [activeTab, setActiveTab] = useState('description')
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)

  // Use cart store
  const addItemToCart = useCartStore((state) => state.addItem)

  const colors = ['Black', 'White', 'Blue', 'Red']
  const sizes = ['S', 'M', 'L', 'XL', 'XXL']

  const showSizeSelector = product ? needsSizeSelector(product.category) : false
  const showColorSelector = product ? needsColorSelector(product.category) : true

  useEffect(() => {
    const savedWishlist = localStorage.getItem('wishlist')
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist))
    }
  }, [])

  useEffect(() => {
    if (product) {
      setIsWishlisted(wishlist.includes(product._id))
    }
  }, [product, wishlist])

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API.product(params.id as string)}`)
      if (!response.ok) {
        throw new Error('Product not found')
      }
      const data = await response.json()
      setProduct(data)
      fetchReviews()
      fetchRelatedProducts(data.category)
    } catch (error) {
      console.error('Error fetching product:', error)
      setProduct(null)
    }
    setLoading(false)
  }

  const fetchRelatedProducts = async (category: string) => {
    try {
      const response = await fetch(`${API.products}?limit=6&category=${encodeURIComponent(category)}`)
      const data = await response.json()
      const products = data.products || data
      // Filter out current product and get 4 related products
      setRelatedProducts(products.filter((p: Product) => p._id !== params.id as string).slice(0, 4))
    } catch (error) {
      console.error('Error fetching related products:', error)
    }
  }

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API.product(params.id as string)}/reviews`)
      if (res.ok) setReviews(await res.json())
    } catch {}
  }

  const submitReview = async () => {
    if (!reviewForm.comment.trim()) return
    setSubmittingReview(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API.base}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ productId: params.id, rating: reviewForm.rating, comment: reviewForm.comment })
      })
      if (res.ok) {
        setReviewForm({ rating: 5, comment: '' })
        fetchReviews()
        setToast('Review submitted!')
        setTimeout(() => setToast(null), 2000)
      } else {
        const data = await res.json()
        setToast(data.message || 'Failed to submit review')
        setTimeout(() => setToast(null), 3000)
      }
    } catch { setToast('Error submitting review'); setTimeout(() => setToast(null), 2000) }
    finally { setSubmittingReview(false) }
  }

  // Check if user is logged in
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  const toggleWishlist = () => {
    if (!product) return
    
    // Check if logged in
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=wishlist'
      return
    }
    
    let newWishlist
    if (isWishlisted) {
      newWishlist = wishlist.filter(id => id !== product._id)
      setToast('Removed from wishlist')
    } else {
      newWishlist = [...wishlist, product._id]
      setToast('Added to wishlist')
    }
    
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
    setIsWishlisted(!isWishlisted)
    
    setTimeout(() => setToast(null), 2000)
  }

  const addToCart = () => {
    if (!product) return
    
    // Check if logged in
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=cart'
      return
    }
    
    const cartItem: any = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: getProductImages(product)[0],
      quantity,
    }
    
    if (showColorSelector) {
      cartItem.variant = colors[selectedColor]
    }
    if (showSizeSelector) {
      cartItem.variant = sizes[selectedSize]
    }
    
    // Use Zustand cart store
    addItemToCart(cartItem)
    setToast('Added to cart!')
    setTimeout(() => setToast(null), 2000)
  }

  const buyNow = () => {
    // Check if logged in
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=checkout'
      return
    }
    
    // Add to cart without showing toast
    if (!product) return
    
    const cartItem: any = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: getProductImages(product)[0],
      quantity,
    }
    
    if (showColorSelector) {
      cartItem.variant = colors[selectedColor]
    }
    if (showSizeSelector) {
      cartItem.variant = sizes[selectedSize]
    }
    
    // Use Zustand cart store
    addItemToCart(cartItem)
    
    // Navigate to checkout without showing toast
    router.push('/checkout')
  }

  if (loading) {
    return <ProductDetailSkeleton />
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h2>
          <Link href="/products" className="text-blue-600 hover:underline">Back to Products</Link>
        </div>
      </div>
    )
  }

  const productImages = getProductImages(product)

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
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

      {/* Breadcrumb */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 max-w-7xl">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-gray-500 hover:text-blue-600">Home</Link>
            <span className="text-gray-400">/</span>
            <Link href="/products" className="text-gray-500 hover:text-blue-600">Products</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-800 truncate max-w-[200px]">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Details - Match navbar width */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div className="space-y-2">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-square max-h-[450px] bg-white rounded-xl overflow-hidden shadow-sm"
            >
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain p-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-product.svg';
                }}
              />
            </motion.div>
            <div className="grid grid-cols-4 gap-2">
              {productImages.map((img: string, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img 
                    src={img} 
                    alt="" 
                    loading="lazy"
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-product.svg';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-blue-600 font-medium mb-1 text-sm">{product.category}</p>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">{product.name}</h1>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <span className="text-gray-500 text-sm">{product.rating} ({product.reviews} reviews)</span>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-bold text-blue-600">Rs. {product.price}</span>
                <span className="text-base text-gray-400 line-through">Rs. {product.originalPrice}</span>
                <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                </span>
              </div>

              {showColorSelector && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                    <Palette size={16} />
                    Color: {colors[selectedColor]}
                  </h3>
                  <div className="flex gap-2">
                    {colors.map((color, index) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(index)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === index ? 'border-blue-600 scale-110' : 'border-gray-200 hover:border-blue-400'
                        }`}
                        style={{ backgroundColor: color.toLowerCase() }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {showSizeSelector && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2 text-sm">
                    <Ruler size={16} />
                    Size: {sizes[selectedSize]}
                  </h3>
                  <div className="flex gap-2">
                    {sizes.map((size, index) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(index)}
                        className={`min-w-[40px] h-9 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                          selectedSize === index 
                            ? 'border-blue-600 bg-blue-600 text-white' 
                            : 'border-gray-200 hover:border-blue-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2 text-sm">Quantity</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={18} />
                    </button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                  <span className="text-gray-500 text-sm">
                    {product.reviews} items in stock
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mb-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={addToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={buyNow}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Buy Now
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleWishlist}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-colors ${
                    isWishlisted ? 'border-orange-500 bg-orange-50 text-orange-500' : 'border-gray-200 hover:border-orange-500'
                  }`}
                >
                  <Heart size={20} className={isWishlisted ? 'fill-current' : ''} />
                </motion.button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Truck size={16} />
                  <span>Free Shipping</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <Shield size={16} />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm">
                  <RotateCcw size={16} />
                  <span>Easy Return</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-10">
          <div className="border-b border-gray-200">
            <nav className="flex gap-6">
              {['description', 'specifications', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 font-semibold border-b-2 transition-colors capitalize text-sm ${
                    activeTab === tab 
                      ? 'border-blue-600 text-blue-600' 
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-5">
            {activeTab === 'description' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </motion.div>
            )}

            {activeTab === 'specifications' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Specifications</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    ['Category', product.category],
                    ['Material', 'Premium Quality'],
                    ['Weight', '350g'],
                    ['Warranty', '2 Years'],
                  ].map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">{key}</span>
                      <span className="font-semibold text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Customer Reviews ({reviews.length})</h3>
                  {isLoggedIn && (
                    <button onClick={() => document.getElementById('reviewForm')?.scrollIntoView({ behavior: 'smooth' })}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all"
                    >
                      Write a Review
                    </button>
                  )}
                </div>

                {/* Review Form */}
                {isLoggedIn && (
                  <div id="reviewForm" className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <MessageSquare size={18} /> Write Your Review
                    </h4>
                    <div className="flex items-center gap-1 mb-3">
                      {[1,2,3,4,5].map((star) => (
                        <button key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
                          <Star size={24} className={`cursor-pointer transition-colors ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        </button>
                      ))}
                      <span className="text-sm text-gray-500 ml-2">{reviewForm.rating}/5</span>
                    </div>
                    <textarea value={reviewForm.comment}
                      onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                      placeholder="Share your experience with this product..."
                      className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none h-24"
                    />
                    <button onClick={submitReview} disabled={submittingReview || !reviewForm.comment.trim()}
                      className="mt-3 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {submittingReview ? 'Submitting...' : <><Send size={16} /> Submit Review</>}
                    </button>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No reviews yet. Be the first to review!</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div key={review._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800">{review.name}</h4>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} className={i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                              ))}
                            </div>
                          </div>
                          <span className="text-gray-400 text-xs">{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Products - Same Category */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Related Products in {product.category}</h2>
          {relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relProduct) => (
                <Link key={relProduct._id} href={`/product/${relProduct._id}`}>
                  <motion.div 
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden group"
                  >
                    <div className="aspect-square bg-gray-100 relative overflow-hidden p-3">
                      <img
                        src={getProductImages(relProduct)[0]}
                        alt={relProduct.name}
                        loading="lazy"
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {relProduct.originalPrice > relProduct.price && (
                        <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          {Math.round((1 - relProduct.price / relProduct.originalPrice) * 100)}% OFF
                        </div>
                      )}
                    </div>
                    <div className="p-3 pt-0">
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1 text-sm">{relProduct.name}</h3>
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < Math.floor(relProduct.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-blue-600">Rs. {relProduct.price}</span>
                        <span className="text-gray-400 line-through text-xs">Rs. {relProduct.originalPrice}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="aspect-square bg-gray-100 p-3">
                    <img
                      src="/placeholder-product.svg"
                      alt="Related Product"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-3 pt-0">
                    <h3 className="font-semibold text-gray-800 mb-1 text-sm">Product {i}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-blue-600">Rs. {99 + i * 50}</span>
                      <span className="text-gray-400 line-through text-xs">Rs. {149 + i * 50}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
