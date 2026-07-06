'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Heart } from 'lucide-react'

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

export default function ProductCard({ product }: { product: Product }) {
  const [wishlisted, setWishlisted] = useState(false)
  const discount = product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return (
    <Link href={`/product/${product._id}`} className="flex-shrink-0 w-52 group">
      <div className="relative bg-white rounded-xl overflow-hidden border border-gray-100 group-hover:border-blue-200 group-hover:shadow-xl transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <Image
            src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
            alt={product.name}
            fill
            sizes="208px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-[11px] font-bold px-2 py-1 rounded-lg shadow-md shadow-red-500/20">
              {discount}% OFF
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted) }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm ${
              wishlisted ? 'bg-red-500 text-white shadow-md shadow-red-500/30' : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white'
            }`}
          >
            <Heart size={15} fill={wishlisted ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-3.5">
          {/* Category */}
          <p className="text-[11px] text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>

          {/* Name */}
          <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors mb-2.5 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="flex items-center bg-green-700 px-1.5 py-0.5 rounded text-[11px]">
              <span className="text-white font-bold">{product.rating}</span>
              <Star size={9} className="text-white fill-white ml-0.5" />
            </div>
            <span className="text-[11px] text-gray-400">{product.reviews} reviews</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-gray-900">Rs. {product.price.toLocaleString()}</span>
            {product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">Rs. {product.originalPrice.toLocaleString()}</span>
            )}
          </div>

          {/* Savings */}
          {discount > 0 && (
            <p className="text-[11px] text-green-600 font-medium mt-1">You save Rs. {(product.originalPrice - product.price).toLocaleString()}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
