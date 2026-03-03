'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingCart, Plus, Minus, Check, AlertCircle, ArrowLeft, Star, ChevronLeft, ChevronRight, X, ZoomIn, Heart, Gift, Store, ChevronDown, ChevronUp, ShieldAlert, Leaf, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/shop/product-card'
import { formatPrice, getDisplayDiscountPercent, getEffectivePrice, hasActiveDiscount, vatFromGross, VAT_RATE_PERCENT } from '@/lib/utils'
import { useCartStore } from '@/store/cart'
import { useWishlistStore } from '@/store/wishlist'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase/auth'
import { ProductJsonLd } from '@/components/product-json-ld'
import { addRecentlyViewed } from '@/lib/recently-viewed'
import { ShopBreadcrumbs } from '@/components/shop-breadcrumbs'
import { ShoppableVideoPlayer } from '@/components/shop/shoppable-video-player'
import { APlusContent } from '@/components/shop/aplus-content'
import { ProductQA } from '@/components/shop/product-qa'
import { DropRadarButton } from '@/components/shop/drop-radar-button'
import { PriceLockButton } from '@/components/shop/price-lock-button'

const DEFAULT_CATEGORY_LABELS: Record<string, string> = {
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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [reviews, setReviews] = useState<{ id: string; rating: number; comment: string | null; created_at: string; display_name?: string | null; is_verified_purchase?: boolean | null; is_tester_program?: boolean | null }[]>([])
  const [reviewOrderNumber, setReviewOrderNumber] = useState('')
  const [reviewEmail, setReviewEmail] = useState('')
  const [reviewDisplayName, setReviewDisplayName] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewIsPrivate, setReviewIsPrivate] = useState(false)
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [isReviewerLoggedIn, setIsReviewerLoggedIn] = useState(false)
  const [reviewStarFilter, setReviewStarFilter] = useState<number | null>(null)
  const [reviewPage, setReviewPage] = useState(1)
  const [stickyBarVisible, setStickyBarVisible] = useState(false)
  const [loyaltyPublic, setLoyaltyPublic] = useState<{ enabled: boolean; points_per_euro: number } | null>(null)
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(DEFAULT_CATEGORY_LABELS)
  const [productOffers, setProductOffers] = useState<{ offers: { seller_name: string; unit_price: number; shipping_price_eur: number; landed_price: number; seller_type: string }[]; buybox_winner: { seller_name: string; landed_price: number } | null } | null>(null)
  const [offersExpanded, setOffersExpanded] = useState(false)
  const [productVariations, setProductVariations] = useState<{ id: string; name: string; slug: string; price: number; image_url: string | null; images: string[]; stock: number; variation_theme: string | null }[]>([])
  const [ecoCertifications, setEcoCertifications] = useState<{ type: string; label: string; document_url: string }[]>([])
  const addToCartBlockRef = useRef<HTMLDivElement>(null)
  const { has: inWishlist, toggle: toggleWishlist } = useWishlistStore()

  const REVIEWS_PER_PAGE = 5
  const filteredReviews = reviewStarFilter != null ? reviews.filter((r) => r.rating === reviewStarFilter) : reviews
  const totalReviewPages = Math.max(1, Math.ceil(filteredReviews.length / REVIEWS_PER_PAGE))
  const showReviewPagination = filteredReviews.length > REVIEWS_PER_PAGE
  const reviewsToShow = showReviewPagination
    ? filteredReviews.slice((reviewPage - 1) * REVIEWS_PER_PAGE, reviewPage * REVIEWS_PER_PAGE)
    : filteredReviews

  const addItem = useCartStore((state) => state.addItem)
  const { toast } = useToast()

  useEffect(() => {
    loadProduct()
  }, [params.slug])

  useEffect(() => {
    if (product?.category) loadSimilarProducts(product.category, product.id)
  }, [product?.id, product?.category])

  useEffect(() => {
    if (product?.id) {
      fetch(`/api/reviews?product_id=${encodeURIComponent(product.id)}`)
        .then((res) => res.json())
        .then((data) => setReviews(Array.isArray(data) ? data : []))
        .catch(() => setReviews([]))
    }
  }, [product?.id])

  useEffect(() => {
    if (product?.slug) {
      fetch(`/api/shop/products/${encodeURIComponent(product.slug)}/offers`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => data && setProductOffers({ offers: data.offers ?? [], buybox_winner: data.buybox_winner ?? null }))
        .catch(() => setProductOffers(null))
    } else {
      setProductOffers(null)
    }
  }, [product?.slug])

  useEffect(() => {
    if (product?.slug) {
      fetch(`/api/shop/products/${encodeURIComponent(product.slug)}/variations`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setProductVariations(Array.isArray(data?.variations) ? data.variations : []))
        .catch(() => setProductVariations([]))
    } else {
      setProductVariations([])
    }
  }, [product?.slug])

  useEffect(() => {
    if (product?.id) {
      fetch(`/api/shop/eco-certifications?product_id=${encodeURIComponent(product.id)}`)
        .then((r) => (r.ok ? r.json() : { certifications: [] }))
        .then((d) => setEcoCertifications(d.certifications ?? []))
        .catch(() => setEcoCertifications([]))
    } else {
      setEcoCertifications([])
    }
  }, [product?.id])

  useEffect(() => {
    getCurrentUser().then((u) => setIsReviewerLoggedIn(!!u))
  }, [])
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const map: Record<string, string> = {}
          for (const c of data as { slug: string; name: string }[]) {
            map[c.slug] = c.name
          }
          setCategoryLabels(map)
        }
      })
      .catch(() => {})
  }, [])
  useEffect(() => {
    fetch('/api/loyalty/public')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.enabled && setLoyaltyPublic({ enabled: true, points_per_euro: d.points_per_euro || 1 }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setReviewPage(1)
  }, [reviewStarFilter])

  useEffect(() => {
    if (reviewPage > totalReviewPages) setReviewPage(totalReviewPages)
  }, [reviewPage, totalReviewPages])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      const images = product?.images?.length ? product.images : product?.image_url ? [product.image_url] : []
      if (images.length > 1) {
        if (e.key === 'ArrowLeft') setSelectedImage((i) => (i - 1 + images.length) % images.length)
        if (e.key === 'ArrowRight') setSelectedImage((i) => (i + 1) % images.length)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen, product?.images, product?.image_url])

  useEffect(() => {
    const el = addToCartBlockRef.current
    if (!el || !product) return
    const obs = new IntersectionObserver(
      ([e]) => setStickyBarVisible(!e.isIntersecting),
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [product])

  const loadReviews = () => {
    if (!product?.id) return
    fetch(`/api/reviews?product_id=${encodeURIComponent(product.id)}`)
      .then((res) => res.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
  }

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product?.id || reviewSubmitting) return
    setReviewSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        product_id: product.id,
        display_name: reviewDisplayName.trim() || undefined,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        is_private: reviewIsPrivate,
      }
      if (!isReviewerLoggedIn) {
        body.order_number = reviewOrderNumber.trim()
        body.customer_email = reviewEmail.trim()
      }
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Bewertung nicht möglich', description: data.error || 'Bitte Bestellnummer und E-Mail prüfen.', variant: 'destructive' })
        return
      }
      toast({ title: 'Danke!', description: 'Deine Bewertung wurde gespeichert.' })
      setReviewOrderNumber('')
      setReviewEmail('')
      setReviewDisplayName('')
      setReviewRating(5)
      setReviewComment('')
      setReviewIsPrivate(false)
      loadReviews()
      loadProduct()
    } finally {
      setReviewSubmitting(false)
    }
  }

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, influencers(name, slug, accent_color)')
        .eq('slug', params.slug)
        .eq('is_active', true)
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
        addRecentlyViewed(productWithInfluencer)
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
      .select('id, name, slug, description, price, image_url, images, category, brand, stock, is_adult_only, exempt_from_adult_fee, is_featured, influencer_id, tags, discount_percent, discount_until, reference_price_30d, total_sold, average_rating, rating_count, created_at, updated_at')
      .eq('is_active', true)
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

  const handleQuantityInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw === '') return
    const v = parseInt(raw, 10)
    if (!isNaN(v)) {
      const clamped = Math.max(1, Math.min(product.stock, v))
      setQuantity(clamped)
    }
  }

  const handleQuantityBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10)
    if (isNaN(v) || v < 1) setQuantity(1)
    else if (v > product.stock) setQuantity(product.stock)
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '') || ''

  const breadcrumbListJsonLd = baseUrl
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: 'Shop', item: `${baseUrl}/shop` },
          { '@type': 'ListItem', position: 3, name: product.name, item: `${baseUrl}/shop/${product.slug}` },
        ],
      }
    : null

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      {baseUrl ? <ProductJsonLd product={product} baseUrl={baseUrl} /> : null}
      {breadcrumbListJsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListJsonLd) }} />
      ) : null}
      {/* Sticky „In den Warenkorb“ – sichtbar wenn Haupt-CTA aus dem Viewport scrollt */}
      {stickyBarVisible && product.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-luxe-charcoal/95 backdrop-blur border-t border-luxe-gray px-4 py-3 safe-area-pb">
          <div className="container-luxe flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">{product.name}</p>
              <p className="text-luxe-gold font-bold">{formatPrice(getEffectivePrice(product) * quantity)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="w-10 h-10 rounded-lg bg-luxe-gray flex items-center justify-center disabled:opacity-50 text-white"
                aria-label="Menge verringern"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-white font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock}
                className="w-10 h-10 rounded-lg bg-luxe-gray flex items-center justify-center disabled:opacity-50 text-white"
                aria-label="Menge erhöhen"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdded}
                className="h-10 px-6 rounded-lg bg-luxe-gold text-luxe-black font-semibold hover:bg-luxe-gold/90 disabled:opacity-70"
              >
                {isAdded ? <Check className="w-5 h-5" /> : <><ShoppingCart className="w-5 h-5 inline mr-1" />In den Warenkorb</>}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="container-luxe">
        <ShopBreadcrumbs items={[{ label: 'Shop', href: '/shop' }, { label: product?.name ?? 'Produkt' }]} />
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
            {/* Main Image – klickbar für Großansicht */}
            {(() => {
              const imageList = product.images?.length ? product.images : product.image_url ? [product.image_url] : []
              const mainSrc = imageList[selectedImage] || product.image_url || ''
              return (
                <>
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="relative aspect-square rounded-2xl overflow-hidden bg-luxe-charcoal border border-luxe-gray w-full group cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:ring-offset-2 focus:ring-offset-luxe-black"
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={mainSrc}
                        alt={product.name}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                      <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </span>
                  </button>
                  <p className="text-xs text-luxe-silver mt-2">Klicken zum Vergrößern</p>

                  {/* Thumbnails – Klick wählt Bild und kann bei Klick auch Lightbox öffnen */}
                  {imageList.length > 1 && (
                    <div className="grid grid-cols-4 gap-4">
                      {imageList.map((image: string, index: number) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setSelectedImage(index)
                            setLightboxOpen(true)
                          }}
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
                </>
              )
            })()}

            {/* Lightbox – per Portal in document.body, damit X-Button garantiert klickbar ist */}
            {lightboxOpen && typeof document !== 'undefined' && createPortal(
              (() => {
                const imageList = product.images?.length ? product.images : product.image_url ? [product.image_url] : []
                const currentSrc = imageList[selectedImage] || product.image_url || ''
                const hasMultiple = imageList.length > 1
                return (
                  <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Bild vergrößert"
                  >
                    {/* Klickbereich zum Schließen – liegt hinten */}
                    <div
                      className="absolute inset-0 bg-black/95"
                      aria-hidden
                      onClick={() => setLightboxOpen(false)}
                    />
                    {/* Bild – mittig, Klick auf Bild schließt nicht */}
                    <div className="relative flex items-center justify-center max-w-5xl max-h-[90vh] w-full h-full pointer-events-none">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentSrc}
                        alt={`${product.name} – Bild ${selectedImage + 1}`}
                        className="max-w-full max-h-[90vh] w-auto h-auto object-contain select-none pointer-events-auto"
                        draggable={false}
                      />
                    </div>
                    {/* X-Button – als letztes gerendert, liegt oben und ist immer klickbar */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setLightboxOpen(false) }}
                      className="absolute top-4 right-4 p-3 rounded-full text-white bg-black/50 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:ring-offset-2 focus:ring-offset-transparent"
                      aria-label="Schließen"
                    >
                      <X className="w-8 h-8" />
                    </button>
                    {hasMultiple && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => (i - 1 + imageList.length) % imageList.length) }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                          aria-label="Vorheriges Bild"
                        >
                          <ChevronLeft className="w-8 h-8" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => (i + 1) % imageList.length) }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                          aria-label="Nächstes Bild"
                        >
                          <ChevronRight className="w-8 h-8" />
                        </button>
                      </>
                    )}
                    {hasMultiple && (
                      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-luxe-silver text-sm pointer-events-none">
                        {selectedImage + 1} / {imageList.length}
                      </span>
                    )}
                  </div>
                )
              })(),
              document.body
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Marke, Kategorie & Influencer */}
            <div className="flex items-center gap-3 flex-wrap">
              {product.brand?.trim() && (
                <span className="text-sm text-luxe-silver font-medium">
                  {product.brand}
                </span>
              )}
              <Link
                href={`/shop?category=${product.category}`}
                className="text-sm text-luxe-gold uppercase tracking-wider hover:text-luxe-gold/80 transition-colors"
              >
                {categoryLabels[product.category] ?? product.category}
              </Link>
              {product.is_featured && (
                <Badge variant="featured">Highlight</Badge>
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
              {ecoCertifications.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {ecoCertifications.map((c) => (
                    <a
                      key={c.type}
                      href={c.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-900/30 border border-emerald-600/50 hover:bg-emerald-800/40 text-emerald-400 text-sm font-medium transition-colors"
                      title={`${c.label} – Nachhaltigkeits-Zertifikat`}
                    >
                      <Leaf className="w-4 h-4" />
                      {c.label}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Title + Wunschliste */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white flex-1 min-w-0">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {(['vaporizer', 'grinder', 'zubehoer'] as string[]).includes(product.category) && (
                  <Link
                    href={`/trade-in?product=${encodeURIComponent(product.slug)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-luxe-silver hover:text-luxe-gold hover:bg-luxe-charcoal border border-luxe-gray/50 hover:border-luxe-gold/50 transition-colors"
                    title="Gebrauchtes Gerät gegen Store Credit eintauschen"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Trade-In
                  </Link>
                )}
                <Link
                  href={`/illegale-inhalte-melden?product=${encodeURIComponent(product.slug)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-luxe-silver hover:text-amber-400 hover:bg-luxe-charcoal border border-luxe-gray/50 hover:border-amber-500/50 transition-colors"
                  title="Illegale Inhalte melden (DDG §17)"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Melden
                </Link>
                <button
                type="button"
                onClick={() => {
                  const wasInWishlist = inWishlist(product.id)
                  toggleWishlist(product.id)
                  toast({
                    title: wasInWishlist ? 'Von Wunschliste entfernt' : 'Zur Wunschliste hinzugefügt',
                    description: product.name,
                  })
                }}
                className="p-2.5 rounded-full bg-luxe-charcoal border border-luxe-gray hover:bg-luxe-gray/30 text-white shrink-0"
                aria-label={inWishlist(product.id) ? 'Von Wunschliste entfernen' : 'Zur Wunschliste hinzufügen'}
              >
                <Heart className={`w-6 h-6 ${inWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </button>
              </div>
            </div>

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

            {/* Price: Originalpreis durchgestrichen, neuer Preis (was der Kunde zahlt) und berechneter Rabatt % */}
            <div className="space-y-2">
              {(() => {
                const effective = getEffectivePrice(product)
                const hasDiscount = hasActiveDiscount(product)
                const originalPrice = product.price
                const showStrikethrough = hasDiscount && originalPrice > effective
                const displayPercent = showStrikethrough ? getDisplayDiscountPercent(originalPrice, effective) : null
                return (
                  <div className="flex flex-wrap items-baseline gap-3">
                    {showStrikethrough && (
                      <span className="text-xl text-luxe-silver line-through" aria-hidden>
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-white">
                      {formatPrice(effective)}
                    </span>
                    {displayPercent != null && (
                      <span className="rounded-md bg-luxe-gold/20 px-2.5 py-1 text-sm font-semibold text-luxe-gold">
                        −{displayPercent}% Rabatt
                      </span>
                    )}
                  </div>
                )
              })()}
              <p className="text-luxe-silver text-sm">
                Inkl. {VAT_RATE_PERCENT} % MwSt. zzgl. Versand
              </p>
              <p className="text-luxe-silver/80 text-xs mt-0.5">
                Enthaltene USt.: {formatPrice(vatFromGross(getEffectivePrice(product)))} pro Stück
              </p>
              {loyaltyPublic?.enabled && (
                <p className="text-sm text-luxe-gold/90 mt-2 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 shrink-0" />
                  Sammle bis zu <span className="font-semibold">{Math.floor(getEffectivePrice(product) * quantity * (loyaltyPublic.points_per_euro || 1))} Punkte</span> mit diesem Kauf
                </p>
              )}
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
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-medium">Ausverkauft</span>
                  </div>
                  <DropRadarButton productId={product.id} />
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

            {/* Quantity Selector + Add to Cart (Ref für Sticky-Bar) */}
            <div ref={addToCartBlockRef} className="space-y-2">
              <label className="text-white font-medium">Menge</label>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-12 h-12 bg-luxe-charcoal hover:bg-luxe-gray rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Menge verringern"
                >
                  <Minus className="w-5 h-5 text-white" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={product.stock}
                  value={quantity}
                  onChange={handleQuantityInput}
                  onBlur={handleQuantityBlur}
                  className="w-16 h-12 text-center text-2xl font-bold text-white bg-luxe-charcoal border border-luxe-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Menge"
                />
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.stock}
                  className="w-12 h-12 bg-luxe-charcoal hover:bg-luxe-gray rounded-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Menge erhöhen"
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

              {product.stock > 0 && (
                <div className="pt-2 border-t border-luxe-gray/50">
                  <p className="text-xs text-luxe-silver mb-2">Preis für 24h einfrieren</p>
                  <PriceLockButton
                    productId={product.id}
                    lockedPrice={getEffectivePrice(product)}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Alle Kaufoptionen (Multi-Vendor / Buy Box) */}
            {productOffers && productOffers.offers.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-luxe-gray bg-luxe-charcoal/50 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOffersExpanded(!offersExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-luxe-gray/20 transition-colors"
                >
                  <span className="flex items-center gap-2 text-white font-medium">
                    <Store className="w-5 h-5 text-luxe-gold" />
                    Alle Kaufoptionen ({productOffers.offers.length})
                  </span>
                  {productOffers.buybox_winner && (
                    <span className="text-luxe-gold text-sm font-semibold">
                      Ab {formatPrice(productOffers.buybox_winner.landed_price)}
                    </span>
                  )}
                  {offersExpanded ? <ChevronUp className="w-5 h-5 text-luxe-silver" /> : <ChevronDown className="w-5 h-5 text-luxe-silver" />}
                </button>
                {offersExpanded && (
                  <div className="border-t border-luxe-gray divide-y divide-luxe-gray">
                    {productOffers.offers.map((offer, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-4 py-3 ${offer.seller_type === 'shop' ? 'bg-luxe-gold/10' : ''}`}
                      >
                        <div>
                          <p className="text-white font-medium">{offer.seller_name}</p>
                          <p className="text-luxe-silver text-sm">
                            {formatPrice(offer.unit_price)}
                            {offer.shipping_price_eur > 0 && (
                              <> + {formatPrice(offer.shipping_price_eur)} Versand</>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-luxe-gold font-bold">{formatPrice(offer.landed_price)}</p>
                          {productOffers.buybox_winner && offer.landed_price === productOffers.buybox_winner.landed_price && offer.seller_name === productOffers.buybox_winner.seller_name && (
                            <span className="text-xs text-luxe-neon font-medium">Bester Preis</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Geschwister-Variationen (Parent/Child ASIN) */}
            {productVariations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-luxe-gray bg-luxe-charcoal/50 overflow-hidden"
              >
                <p className="px-4 py-3 text-white font-medium border-b border-luxe-gray">
                  Andere Varianten
                </p>
                <div className="p-4 flex flex-wrap gap-3">
                  {productVariations.map((v) => {
                    const thumbSrc = v.image_url || v.images?.[0]
                    return (
                    <Link
                      key={v.id}
                      href={`/shop/${v.slug}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-luxe-gray hover:border-luxe-gold/50 hover:bg-luxe-gray/20 transition-colors min-w-0 max-w-full"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-luxe-charcoal shrink-0">
                        {thumbSrc ? (
                          <Image
                            src={thumbSrc}
                            alt={v.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-luxe-silver text-xs" aria-hidden>—</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">{v.name}</p>
                        <p className="text-luxe-gold font-semibold">{formatPrice(v.price)}</p>
                        {v.variation_theme && (
                          <p className="text-luxe-silver text-xs">{v.variation_theme}</p>
                        )}
                      </div>
                    </Link>
                  )})}
                </div>
              </motion.div>
            )}

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

        {/* Kundenbewertungen – Luxe Dark Theme */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-16 container-luxe px-4 sm:px-6"
        >
          <div className="rounded-2xl bg-luxe-charcoal border border-luxe-gray p-6 md:p-10">
            <h2 className="text-2xl font-semibold text-white tracking-tight mb-1">Kundenbewertungen</h2>
            <p className="text-luxe-silver text-sm mb-6">
              Nur von Käufern – jede Bestellung ermöglicht eine Bewertung. Genehmigte Bewertungen erscheinen hier.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-0.5" aria-label={`${Number(product?.average_rating ?? 0).toFixed(1)} von 5 Sternen`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-6 h-6 ${(product?.average_rating ?? 0) >= s ? 'text-luxe-gold fill-luxe-gold' : 'text-luxe-gray'}`}
                  />
                ))}
              </div>
              <span className="text-white font-semibold text-lg">{Number(product?.average_rating ?? 0).toFixed(1)}</span>
              <span className="text-luxe-silver text-sm">({product?.rating_count ?? 0} Bewertung{(product?.rating_count ?? 0) !== 1 ? 'en' : ''})</span>
            </div>

            {reviews.length > 0 && (
              <>
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-luxe-silver text-sm mr-1">Filter:</span>
                  <button
                    type="button"
                    onClick={() => { setReviewStarFilter(null); setReviewPage(1) }}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${reviewStarFilter === null ? 'bg-luxe-gold text-luxe-black' : 'bg-luxe-black border border-luxe-gray text-luxe-silver hover:border-luxe-gold/50 hover:text-white'}`}
                  >
                    Alle ({reviews.length})
                  </button>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviews.filter((r) => r.rating === stars).length
                    if (count === 0) return null
                    return (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => { setReviewStarFilter(stars); setReviewPage(1) }}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${reviewStarFilter === stars ? 'bg-luxe-gold text-luxe-black' : 'bg-luxe-black border border-luxe-gray text-luxe-silver hover:border-luxe-gold/50 hover:text-white'}`}
                      >
                        {stars} {stars === 1 ? 'Stern' : 'Sterne'} ({count})
                      </button>
                    )
                  })}
                </div>

                <div className="space-y-4 mb-6">
                  {filteredReviews.length === 0 ? (
                    <p className="text-luxe-silver text-sm">Keine Bewertungen mit dieser Sterneanzahl.</p>
                  ) : (
                    reviewsToShow.map((r) => (
                      <div key={r.id} className="p-5 rounded-xl bg-luxe-black/60 border border-luxe-gray">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-0.5" aria-hidden>
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-5 h-5 shrink-0 ${r.rating >= s ? 'text-luxe-gold fill-luxe-gold' : 'text-luxe-gray'}`} />
                              ))}
                            </div>
                            <span className="text-white font-medium text-sm">
                              {r.display_name?.trim() || 'Verifizierter Käufer'}
                            </span>
                            {r.is_verified_purchase !== false && (
                              <span title="Verifizierter Kauf"><Check className="w-4 h-4 text-emerald-500 shrink-0" /></span>
                            )}
                            {r.is_tester_program && (
                              <span className="text-amber-400 text-xs px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40">Produkttester</span>
                            )}
                          </div>
                          <span className="text-luxe-silver text-xs shrink-0">
                            {new Date(r.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        {r.comment ? (
                          <p className="text-luxe-silver text-[15px] leading-relaxed mt-2">
                            {r.comment}
                          </p>
                        ) : (
                          <p className="text-luxe-silver/70 text-sm mt-1 italic">Nur Sternebewertung ohne Kommentar</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {showReviewPagination && filteredReviews.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <p className="text-luxe-silver text-sm">
                      Seite {reviewPage} von {totalReviewPages} · {filteredReviews.length} Bewertung{filteredReviews.length !== 1 ? 'en' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                        disabled={reviewPage <= 1}
                        className="p-2 rounded-lg bg-luxe-black border border-luxe-gray text-white hover:border-luxe-gold/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Vorherige Seite"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <span className="text-luxe-silver text-sm min-w-[4rem] text-center">
                        {reviewPage} / {totalReviewPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReviewPage((p) => Math.min(totalReviewPages, p + 1))}
                        disabled={reviewPage >= totalReviewPages}
                        className="p-2 rounded-lg bg-luxe-black border border-luxe-gray text-white hover:border-luxe-gold/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Nächste Seite"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.section>

        <div className="container-luxe mt-10">
          <div className="p-6 rounded-xl bg-luxe-charcoal border border-luxe-gray">
            <h3 className="text-lg font-semibold text-white mb-2">Bewertung abgeben</h3>
            {isReviewerLoggedIn ? (
              <p className="text-luxe-gold/90 text-sm mb-4 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                Du bist angemeldet – du musst Bestellnummer und E-Mail nicht angeben. Wir ordnen deine Bewertung automatisch deiner Bestellung zu.
              </p>
            ) : (
              <p className="text-luxe-silver text-sm mb-4">
                Du hast dieses Produkt bestellt? Gib deine Bestellnummer und E-Mail ein – nur dann kannst du bewerten (jeweils eine Bewertung pro Bestellung).
              </p>
            )}
            <form onSubmit={submitReview} className="space-y-4 max-w-md">
              {!isReviewerLoggedIn && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-luxe-silver mb-1">Bestellnummer</label>
                    <input
                      type="text"
                      value={reviewOrderNumber}
                      onChange={(e) => setReviewOrderNumber(e.target.value)}
                      placeholder="z. B. ORD-123456"
                      className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-luxe-silver mb-1">E-Mail (wie bei der Bestellung)</label>
                    <input
                      type="email"
                      value={reviewEmail}
                      onChange={(e) => setReviewEmail(e.target.value)}
                      placeholder="deine@email.de"
                      className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver/50"
                      required
                    />
                    <p className="text-luxe-silver/80 text-xs mt-1">
                      Deine E-Mail wird nur zur Verifizierung deines Kaufs genutzt und nicht veröffentlicht.
                    </p>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-luxe-silver mb-1">Anzeigename (optional)</label>
                <input
                  type="text"
                  value={reviewDisplayName}
                  onChange={(e) => setReviewDisplayName(e.target.value)}
                  placeholder="z. B. Max M. oder Kunde aus Berlin"
                  maxLength={80}
                  className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver/50"
                />
                <p className="text-luxe-silver/80 text-xs mt-1">
                  Dieser Name wird bei deiner Bewertung angezeigt. Frei wählbar – die E-Mail erscheint nicht.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-luxe-silver mb-1">Bewertung</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-1 rounded hover:bg-luxe-gray transition-colors"
                    >
                      <Star className={`w-8 h-8 ${reviewRating >= s ? 'text-amber-400 fill-amber-400' : 'text-luxe-gray'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-luxe-silver mb-1">Kommentar (optional)</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Deine Erfahrung mit dem Produkt..."
                  rows={3}
                  maxLength={2000}
                  className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver/50 resize-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reviewIsPrivate}
                  onChange={(e) => setReviewIsPrivate(e.target.checked)}
                  className="rounded border-luxe-gray text-luxe-gold focus:ring-luxe-gold"
                />
                <span className="text-luxe-silver text-sm">Nur für den Shop-Betreiber sichtbar (nicht öffentlich)</span>
              </label>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="px-6 py-2.5 bg-luxe-gold text-luxe-black font-semibold rounded-md hover:bg-luxe-gold/90 disabled:opacity-50"
              >
                {reviewSubmitting ? 'Wird gespeichert...' : 'Bewertung absenden'}
              </button>
            </form>
          </div>
        </div>

        {/* Shoppable Video (Phase 10.2) */}
        <div className="mt-12">
          <ShoppableVideoPlayer productId={product.id} />
        </div>

        {/* A+ Content (Phase 10.5) */}
        <APlusContent productId={product.id} />

        {/* Customer Q&A (Phase 11.4) */}
        <ProductQA productId={product.id} />

        {/* Wird oft zusammen gekauft (basierend auf Kategorien) */}
        {similarProducts.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-20 pt-16 border-t border-luxe-gray"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Wird oft zusammen gekauft</h2>
            <p className="text-luxe-silver text-sm mb-8">Aus derselben Kategorie</p>
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
