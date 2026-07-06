'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Heart, Share2, Trash2, ShoppingCart, ExternalLink, Copy, Check } from 'lucide-react'
import Link from 'next/link'

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sharePublic, setSharePublic] = useState(false)
  const [copied, setCopied] = useState(false)
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserId(user._id || '')
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    const token = localStorage.getItem('token')
    try {
      const [wRes, uRes] = await Promise.all([
        fetch(`${API.base}/api/wishlist`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API.base}/api/user/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])
      if (wRes.ok) setWishlist(await wRes.json())
      if (uRes.ok) {
        const user = await uRes.json()
        setSharePublic(user.wishlistSharePublic)
      }
    } catch { } finally { setLoading(false) }
  }

  const removeItem = async (productId: string) => {
    const token = localStorage.getItem('token')
    await fetch(`${API.base}/api/wishlist`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ productId })
    })
    fetchWishlist()
  }

  const toggleShare = async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API.base}/api/wishlist/share`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ share: !sharePublic })
    })
    if (res.ok) setSharePublic(!sharePublic)
  }

  const copyLink = () => {
    const link = `${window.location.origin}/wishlist/${userId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const addToCart = async (product: any) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existing = cart.find((i: any) => i._id === product._id)
    if (existing) existing.quantity += 1
    else cart.push({ ...product, quantity: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cartUpdated'))
    removeItem(product._id)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-500">{wishlist.length} items saved</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleShare}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${sharePublic ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              <Share2 size={16} /> {sharePublic ? 'Public' : 'Private'}
            </button>
            {sharePublic && (
              <button onClick={copyLink}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-all flex items-center gap-2">
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy Link'}
              </button>
            )}
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Your wishlist is empty</p>
            <Link href="/products" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all inline-block">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.map((product: any) => (
              <motion.div key={product._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
                <Link href={`/product/${product._id}`}>
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Heart size={48} />
                      </div>
                    )}
                    {product.discount > 0 && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        -{product.discount}%
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/product/${product._id}`}>
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                  </Link>
                  <p className="text-blue-600 font-bold mt-1">Rs.{product.price?.toLocaleString()}</p>
                  {product.originalPrice > product.price && (
                    <p className="text-gray-400 text-xs line-through">Rs.{product.originalPrice?.toLocaleString()}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => addToCart(product)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all flex items-center justify-center gap-1.5">
                      <ShoppingCart size={14} /> Move to Cart
                    </button>
                    <button onClick={() => removeItem(product._id)}
                      className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
