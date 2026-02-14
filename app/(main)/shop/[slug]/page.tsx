'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Minus, Check, AlertCircle, ArrowLeft, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/shop/product-card'
import { formatPrice, getEffectivePrice, hasActiveDiscount } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

const CATEGORY_LABELS: Record<string, string> = {
  bongs: 'Bongs',
  grinder: 'Grinder',
  papers: 'Papers',
  vaporizer: 'Vaporizer',
  zubehoer: 'Zubehör',
  'influencer-drops': 'Influencer Drops',
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<any>(null)
  const [similarProducts, setSimilarProducts] = useState<any[]>([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const addItem = useCartStore((state) => state.addItem)
  const { toast } = useToast()

  useEffect(() => {
    loadProduct()
  }, [params.slug])

  useEffect(() => {
    if (product?.category) loadSimilarProducts(product.category, product.id)
  }, [product?.id, product?.category])

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, influencers(name, slug, accent_color)')
        .eq('slug', params.slug)
        .single()

      if (!error && data) {
        const row = data as any
        const productWithInfluencer: any = {
          ...row,
          images: Array.isArray(row.images) ? row.images : (row.image_url ? [row.image_url] : []),
          influencer: row.influencers ? {
            name: row.influencers.name,
            slug: row.influencers.slug,
            accent_color: row.influencers.accent_color,
          } : undefined,
        }
        setProduct(productWithInfluencer)
      } else {
        setProduct(null)
      }
    } catch (error) {
      console.error('Error loading product:', error)
      setProduct(null)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSimilarProducts = async (category: string, excludeId: string) => {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, description, price, image_url, images, category, stock, is_adult_only, is_featured, influencer_id, tags, discount_percent, discount_until, total_sold, average_rating, rating_count, created_at, updated_at')
      .eq('category', category)
      .neq('id', excludeId)
      .limit(4)
    if (data) setSimilarProducts(data as any[])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <div className="text-white">Produkt wird geladen...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Produkt nicht gefunden</h2>
          <p className="text-luxe-silver mb-6">
            Dieses Produkt existiert nicht oder wurde entfernt.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
          >
            Zurück zum Shop
          </Link>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    addItem(product, quantity)
    setIsAdded(true)
    toast({
      title: 'Zum Warenkorb hinzugefügt',
      description: `${quantity}x ${product.name} wurde hinzugefügt.`,
    })
    
    setTimeout(() => setIsAdded(false), 2000)
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity)
    }
  }

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/shop"
            className="inline-flex items-center text-luxe-silver hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Zurück zum Shop
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image – ohne störende Overlay-Badges auf dem Foto */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-luxe-charcoal border border-luxe-gray">
              <div className="relative w-full h-full">
                <Image
                  src={(product.images && product.images[selectedImage]) || product.image_url || ''}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-luxe-gold scale-105'
                        : 'border-luxe-gray hover:border-luxe-silver'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Kategorie & Influencer (unter der Überschrift, nicht auf dem Bild) */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/shop?category=${product.category}`}
                className="text-sm text-luxe-gold uppercase tracking-wider hover:text-luxe-gold/80 transition-colors"
              >
                {CATEGORY_LABELS[product.category] ?? product.category}
              </Link>
              {product.is_featured && (
                <Badge variant="featured">Featured</Badge>
              )}
              {product.is_adult_only && (
                <Badge variant="adult">18+</Badge>
              )}
              {product.influencer && (
                <Link
                  href={`/influencer/${product.influencer.slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-luxe-neon/20 border border-luxe-neon/50 hover:bg-luxe-neon/30 transition-colors"
                >
                  <span className="text-sm font-semibold text-luxe-neon">
                    {product.influencer.name} Edition
                  </span>
                </Link>
              )}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {product.name}
            </h1>

            {/* Bewertung (aus DB falls vorhanden) */}
            {(product.average_rating != null || product.rating_count != null) && (
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.round(product.average_rating ?? 0)
                          ? 'text-luxe-gold fill-luxe-gold'
                          : 'text-luxe-gray'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-luxe-silver text-sm">
                  ({product.rating_count ?? 0} Bewertungen)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="space-y-2">
              {hasActiveDiscount(product) ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-xl text-luxe-silver line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="text-4xl font-bold text-white">
                    {formatPrice(getEffectivePrice(product))}
                  </span>
                  <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-400 font-semibold">
                    −{product.discount_percent}%
                  </span>
                </div>
              ) : (
                <div className="text-4xl font-bold text-white">
                  {formatPrice(getEffectivePrice(product))}
                </div>
              )}
              <p className="text-luxe-silver text-sm">Inkl. MwSt. zzgl. Versand</p>
            </div>

            {/* Description */}
            <div className="prose prose-invert">
              <p className="text-luxe-silver leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-luxe-gray text-luxe-silver text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Stock Status */}
            <div className="p-4 bg-luxe-charcoal border border-luxe-gray rounded-lg">
              {product.stock > 0 ? (
                <div className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-luxe-neon" />
                  <span className="text-white font-medium">
                    Auf Lager ({product.stock} verfügbar)
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-medium">Ausverkauft</span>
                </div>
              )}
            </div>

            {/* 18+ Notice */}
            {product.is_adult_only && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-red-400 font-semibold mb-1">
                      🔞 18+ Altersverifikation erforderlich
                    </p>
                    <p className="text-red-400/80 leading-relaxed">
                      Dieses Produkt darf nur an Personen über 18 Jahre verkauft werden. 
                      Beim Versand fallen zusätzliche <strong>2,00 € DHL Ident-Check Gebühren</strong> an.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Influencer Info */}
            {product.influencer && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: `${product.influencer.accent_color}15`,
                  borderColor: `${product.influencer.accent_color}50`,
                }}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-luxe-black"
                    style={{ backgroundColor: product.influencer.accent_color }}
                  >
                    {product.influencer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold mb-1">
                      Influencer-Edition von {product.influencer.name}
                    </p>
                    <p className="text-luxe-silver text-sm mb-2">
                      Handverlesen und persönlich empfohlen
                    </p>
                    <Link
                      href={`/influencer/${product.influencer.slug}`}
                      className="inline-flex items-center text-sm font-medium hover:underline"
                      style={{ color: product.influencer.accent_color }}
                    >
                      Mehr von {product.influencer.name} →
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-white font-medium">Menge</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-12 h-12 bg-luxe-charcoal hover:bg-luxe-gray rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="w-5 h-5 text-white" />
                </button>
                <span className="text-2xl font-bold text-white w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="w-12 h-12 bg-luxe-charcoal hover:bg-luxe-gray rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* In den Warenkorb – mit Animation und Toast */}
            <div className="space-y-3">
              <motion.button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || isAdded}
                className={`w-full h-14 rounded-lg flex items-center justify-center space-x-2 font-semibold text-lg transition-colors ${
                  isAdded
                    ? 'bg-luxe-neon text-luxe-black'
                    : 'bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                whileTap={product.stock > 0 && !isAdded ? { scale: 0.98 } : undefined}
                whileHover={product.stock > 0 && !isAdded ? { scale: 1.01 } : undefined}
              >
                {isAdded ? (
                  <>
                    <Check className="w-6 h-6" />
                    <span>Hinzugefügt!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    <span>In den Warenkorb</span>
                  </>
                )}
              </motion.button>

              <Link
                href="/cart"
                className="w-full h-12 rounded-lg flex items-center justify-center border border-luxe-gray hover:bg-luxe-gray/20 text-white transition-colors"
              >
                Zum Warenkorb
              </Link>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-luxe-gray">
              <div className="text-center p-4">
                <p className="text-luxe-gold font-semibold mb-1">Kostenloser Versand</p>
                <p className="text-luxe-silver text-sm">ab 50€</p>
              </div>
              <div className="text-center p-4">
                <p className="text-luxe-gold font-semibold mb-1">Diskreter Versand</p>
                <p className="text-luxe-silver text-sm">Neutrale Verpackung</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Ähnliche Produkte (gleiche Kategorie) */}
        {similarProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-20 pt-16 border-t border-luxe-gray"
          >
            <h2 className="text-2xl font-bold text-white mb-8">Ähnliche Produkte</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {similarProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={{
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    price: p.price,
                    image_url: p.image_url ?? '',
                    images: Array.isArray(p.images) ? p.images : p.image_url ? [p.image_url] : [],
                    category: p.category,
                    stock: p.stock ?? 0,
                    is_adult_only: p.is_adult_only ?? false,
                    is_featured: p.is_featured ?? false,
                    influencer_id: p.influencer_id,
                    tags: p.tags ?? [],
                    created_at: p.created_at ?? '',
                    updated_at: p.updated_at ?? '',
                    description: p.description ?? '',
                    discount_percent: p.discount_percent,
                    discount_until: p.discount_until,
                    total_sold: p.total_sold,
                    average_rating: p.average_rating,
                    rating_count: p.rating_count,
                  }}
                />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  )
}
