'use client'

import { API } from '@/lib/config'
import { useState, useEffect } from 'react'
import { Heart, ShoppingCart, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function SharedWishlistPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API.base}/api/wishlist/share/${params.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [params.id])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Heart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500">This wishlist is private or doesn't exist</p>
        <Link href="/products" className="text-blue-600 mt-2 inline-block">Browse products</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <Link href="/products" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={18} /> Back to Products
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Heart className="text-red-500" size={28} />
            {data.user}'s Wishlist
          </h1>
          <p className="text-gray-500">{data.products?.length || 0} items</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.products?.map((product: any) => (
            <div key={product._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
              <Link href={`/product/${product._id}`}>
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Heart size={48} /></div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/product/${product._id}`}>
                  <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-yellow-400">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.round(product.rating || 0) ? 'currentColor' : 'none'} />)}
                  </div>
                  <span className="text-xs text-gray-400">({product.rating || 0})</span>
                </div>
                <p className="text-blue-600 font-bold mt-2">Rs.{product.price?.toLocaleString()}</p>
                <Link href={`/product/${product._id}`}
                  className="mt-3 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all w-full">
                  <ShoppingCart size={14} /> View Product
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
