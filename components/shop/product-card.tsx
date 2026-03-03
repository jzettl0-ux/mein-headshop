'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Eye, Star, Heart, Leaf } from 'lucide-react'
import { motion } from 'framer-motion'
import { Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, getDisplayDiscountPercent, getEffectivePrice, hasActiveDiscount, isNewProduct } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useToast } from '@/hooks/use-toast'

interface ProductCardProps {
  product: Product
  /** Produkt hat verifizierte Eco-Zertifizierung */
  hasEcoCert?: boolean
}

export function ProductCard({ product, hasEcoCert = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const { has: inWishlist, toggle: toggleWishlist } = useWishlistStore()
  const { toast } = useToast()
  const isWishlisted = inWishlist(product.id)

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product.id)
    toast({
      title: isWishlisted ? 'Von Wunschliste entfernt' : 'Zur Wunschliste hinzugefügt',
      description: isWishlisted ? `${product.name} von der Wunschliste entfernt.` : `${product.name} ist jetzt auf deiner Wunschliste.`,
    })
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if ((product.stock ?? 0) <= 0) {
      toast({
        title: 'Nicht verfügbar',
        description: `${product.name} ist derzeit ausverkauft.`,
        variant: 'destructive',
      })
      return
    }
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
      whileHover={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="product-card group h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-luxe-gray">
          {/* Product Image */}
          <div className="absolute inset-0 bg-gradient-to-br from-luxe-gray to-luxe-charcoal">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Eye className="w-12 h-12 text-luxe-silver/20" />
              </div>
            )}
          </div>
          
          {/* Wunschliste */}
          <div className="absolute top-3 right-3 z-10">
            <button
              type="button"
              onClick={handleWishlistClick}
              className="p-2 rounded-full bg-luxe-black/60 hover:bg-luxe-charcoal text-white transition-colors"
              aria-label={isWishlisted ? 'Von Wunschliste entfernen' : 'Zur Wunschliste hinzufügen'}
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>
          {/* Badges: Rabatt/Neu/Sale/Bestseller/Highlight + immer Influencer bei influencer_id */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
            {hasActiveDiscount(product) && (
              <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold bg-luxe-gold text-luxe-black shadow-sm">
                −{getDisplayDiscountPercent(product.price, getEffectivePrice(product)) ?? product.discount_percent ?? 0}%
              </span>
            )}
            {!hasActiveDiscount(product) && product.on_sale && (
              <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-semibold bg-luxe-gold/90 text-luxe-black shadow-sm">
                {product.discount_text?.trim() || 'Angebot'}
              </span>
            )}
            {!hasActiveDiscount(product) && !product.on_sale && isNewProduct(product) && (
              <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium bg-white/90 text-stone-800 shadow-sm">
                Neu
              </span>
            )}
            {!hasActiveDiscount(product) && !product.on_sale && !isNewProduct(product) && (product.total_sold ?? 0) >= 5 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium bg-amber-500/90 text-black shadow-sm">
                Bestseller
              </span>
            )}
            {!hasActiveDiscount(product) && !product.on_sale && !isNewProduct(product) && (product.total_sold ?? 0) < 5 && product.is_featured && !product.influencer_id && (
              <Badge variant="featured" className="text-[10px]">Highlight</Badge>
            )}
            {product.influencer_id && (
              <Badge variant="influencer" className="text-[10px]">Influencer</Badge>
            )}
            {hasEcoCert && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-500/90 text-white shadow-sm" title="Nachhaltig zertifiziert">
                <Leaf className="w-3.5 h-3.5" />
                Eco
              </span>
            )}
          </div>
          {product.is_adult_only && (
            <div className="absolute bottom-3 right-3 z-10">
              <Badge variant="adult" className="text-[10px]">18+</Badge>
            </div>
          )}

          {/* Hover Overlay – nur bei Bestand > 0: In den Warenkorb */}
          <div className="absolute inset-0 bg-luxe-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            {(product.stock ?? 0) > 0 ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddToCart(e)
                }}
                className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 inline-flex items-center justify-center h-9 rounded-md px-3 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide text-sm"
                aria-label={`${product.name} in den Warenkorb legen`}
              >
                <ShoppingCart className="mr-2 w-4 h-4" aria-hidden />
                In den Warenkorb
              </button>
            ) : (
              <span className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 inline-flex items-center justify-center h-9 rounded-md px-3 bg-luxe-gray text-luxe-silver font-medium text-sm pointer-events-none">
                Ausverkauft
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Category + Marke */}
          <p className="text-xs text-luxe-gold uppercase tracking-wider mb-2">
            {[product.brand, product.category].filter(Boolean).join(' · ')}
          </p>

          {/* Product Name */}
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2 group-hover:text-luxe-gold transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-luxe-silver text-sm mb-4 line-clamp-2 flex-1">
            {product.description}
          </p>

          {/* Price & Stock – Layout: Preis links, Lager-Status rechts, bei Rabatt klare Trennung */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mt-auto">
            <div className="flex flex-col gap-0.5 min-w-0">
              {(() => {
                const effective = getEffectivePrice(product)
                const hasDiscount = hasActiveDiscount(product)
                const originalPrice = product.price
                const showStrikethrough = hasDiscount && originalPrice > effective
                const displayPercent = showStrikethrough ? getDisplayDiscountPercent(originalPrice, effective) : null
                return (
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    {showStrikethrough && (
                      <span className="text-sm text-luxe-silver line-through shrink-0" aria-hidden>
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-white shrink-0">
                      {formatPrice(effective)}
                    </span>
                    {displayPercent != null && (
                      <span className="text-xs font-semibold text-luxe-gold shrink-0">−{displayPercent}%</span>
                    )}
                  </div>
                )
              })()}
              <span className="text-xs text-luxe-silver mt-0.5">inkl. MwSt.</span>
              {(product.rating_count ?? 0) > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-3.5 h-3.5 ${(product.average_rating ?? 0) >= s ? 'text-amber-400 fill-amber-400' : 'text-luxe-gray'}`} />
                    ))}
                  </div>
                  <span className="text-luxe-silver text-xs">({product.rating_count})</span>
                </div>
              )}
            </div>
            <div className="flex-shrink-0 self-start sm:self-end">
              {product.stock === 0 ? (
                <span className="inline-block px-2.5 py-1 rounded-md text-red-400 text-sm font-medium bg-red-500/10 border border-red-500/30">
                  Ausverkauft
                </span>
              ) : typeof product.stock === 'number' && product.stock < 5 ? (
                <span className="inline-block px-2.5 py-1 rounded-md text-amber-400 text-sm font-medium bg-amber-500/10 border border-amber-500/30">
                  Nur noch {product.stock} Stk.
                </span>
              ) : (
                <span className="inline-block px-2.5 py-1 rounded-md text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/30">
                  Auf Lager
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
  )
}
