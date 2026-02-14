'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, getEffectivePrice, hasActiveDiscount } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { useToast } from '@/hooks/use-toast'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const { toast } = useToast()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
    toast({
      title: 'Zum Warenkorb hinzugefügt',
      description: `${product.name} wurde in deinen Warenkorb gelegt.`,
    })
  }

  const handleCardClick = () => {
    window.location.href = `/shop/${product.slug}`
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="product-card group h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-luxe-gray">
          {/* Product Image */}
          <div className="absolute inset-0 bg-gradient-to-br from-luxe-gray to-luxe-charcoal">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Eye className="w-12 h-12 text-luxe-silver/20" />
              </div>
            )}
          </div>
          
          {/* Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {(product.total_sold ?? 0) >= 5 && (
              <Badge className="bg-amber-500/90 text-black font-bold border-none h-5 min-h-5 inline-flex items-center px-2 text-[10px] leading-none rounded-full min-w-0 w-fit">
                Bestseller
              </Badge>
            )}
            {(product.average_rating ?? 0) >= 4 && (product.rating_count ?? 0) >= 3 && (
              <Badge className="bg-luxe-gold/90 text-black font-bold border-none h-5 min-h-5 inline-flex items-center px-2 text-[10px] leading-none rounded-full min-w-0 w-fit">
                Top bewertet
              </Badge>
            )}
            {hasActiveDiscount(product) && (
              <Badge className="bg-red-500 text-white font-bold border-none h-5 min-h-5 inline-flex items-center px-2 text-[10px] leading-none rounded-full min-w-0 w-fit">
                −{product.discount_percent}%
              </Badge>
            )}
            {product.influencer_id && (
              <Badge variant="influencer">Influencer-Edition</Badge>
            )}
            {product.is_featured && !product.influencer_id && (
              <Badge variant="featured">Store-Highlight</Badge>
            )}
            {product.is_adult_only && (
              <Badge variant="adult">18+</Badge>
            )}
            {product.stock < 5 && product.stock > 0 && (
              <Badge variant="stock">Nur {product.stock} verfügbar</Badge>
            )}
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-luxe-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleAddToCart(e)
              }}
              className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 inline-flex items-center justify-center h-9 rounded-md px-3 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide text-sm"
            >
              <ShoppingCart className="mr-2 w-4 h-4" />
              In den Warenkorb
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Category */}
          <p className="text-xs text-luxe-gold uppercase tracking-wider mb-2">
            {product.category}
          </p>

          {/* Product Name */}
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-luxe-gold transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-luxe-silver text-sm mb-4 line-clamp-2 flex-1">
            {product.description}
          </p>

          {/* Price & Stock */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {hasActiveDiscount(product) ? (
                <>
                  <span className="text-sm text-luxe-silver line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-2xl font-bold text-white">
                    {formatPrice(getEffectivePrice(product))}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-white">
                  {formatPrice(getEffectivePrice(product))}
                </span>
              )}
            </div>
            {product.stock === 0 ? (
              <span className="text-red-400 text-sm font-medium">
                Ausverkauft
              </span>
            ) : (
              <span className="text-luxe-neon text-sm font-medium">
                Auf Lager
              </span>
            )}
          </div>
        </div>
      </motion.div>
  )
}
