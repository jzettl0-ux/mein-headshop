'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle, Gift } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/supabase/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart'
import { formatPrice, getEffectivePrice, FREE_SHIPPING_THRESHOLD_EUR } from '@/lib/utils'
import { getDeliveryEstimateText } from '@/lib/shipping'
import { getStableSpruch } from '@/lib/copy'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal, getShipping, getTotal, hasAdultItems } = useCartStore()
  const router = useRouter()
  const reserveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [loyaltyPublic, setLoyaltyPublic] = useState<{ enabled: boolean; points_per_euro: number } | null>(null)
  const [loyaltyData, setLoyaltyData] = useState<{
    tier: string
    points_balance: number
    next_tier: string | null
    points_needed: number
    progress_percent: number
    settings: { points_per_eur_discount?: number }
  } | null>(null)

  useEffect(() => {
    getCurrentUser().then((u) => setUser(u ?? null))
  }, [])
  useEffect(() => {
    fetch('/api/loyalty/public')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.enabled && setLoyaltyPublic({ enabled: true, points_per_euro: d.points_per_euro || 1 }))
      .catch(() => {})
  }, [])
  useEffect(() => {
    if (user && loyaltyPublic?.enabled) {
      fetch('/api/account/loyalty', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d?.enabled && setLoyaltyData({
          tier: d.tier || 'bronze',
          points_balance: d.points_balance ?? 0,
          next_tier: d.next_tier ?? null,
          points_needed: d.points_needed ?? 0,
          progress_percent: d.progress_percent ?? 0,
          settings: d.settings ?? {},
        }))
        .catch(() => {})
    } else {
      setLoyaltyData(null)
    }
  }, [user, loyaltyPublic?.enabled])

  useEffect(() => {
    const syncReservations = () => {
      if (items.length === 0) {
        fetch('/api/cart/release', { method: 'POST', credentials: 'include' }).catch(() => {})
        if (typeof window !== 'undefined') sessionStorage.removeItem('cart_session_id')
        return
      }
      fetch('/api/cart/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
        }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d?.session_id && typeof window !== 'undefined') sessionStorage.setItem('cart_session_id', d.session_id)
        })
        .catch(() => {})
    }
    if (reserveTimeoutRef.current) clearTimeout(reserveTimeoutRef.current)
    reserveTimeoutRef.current = setTimeout(syncReservations, 400)
    return () => {
      if (reserveTimeoutRef.current) clearTimeout(reserveTimeoutRef.current)
    }
  }, [items])

  const subtotal = getSubtotal()
  const shipping = getShipping()
  const total = getTotal()
  const needsAdultCheck = hasAdultItems()

  const handleCheckout = () => {
    router.push('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring' }}
          >
            <ShoppingBag className="w-24 h-24 text-luxe-silver/30 mx-auto" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white">
            Dein Warenkorb ist leer
          </h2>
          <p className="text-luxe-silver max-w-sm mx-auto">
            Zeit, dein Setup zu vervollständigen – entdecke unsere handverlesene Auswahl.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
          >
            Zum Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe-black py-6 sm:py-12">
      <div className="container-luxe">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
            Warenkorb
          </h1>
          <p className="text-luxe-silver text-sm sm:text-base">
            {items.length} Artikel in deinem Warenkorb
          </p>
          <p className="text-luxe-gold/90 text-sm italic mt-2">
            „{getStableSpruch('cart')}"
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-luxe-charcoal border border-luxe-gray rounded-lg p-4 sm:p-6"
              >
                <div className="flex gap-4 sm:gap-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-luxe-gray rounded-lg flex-shrink-0 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-luxe-silver/30" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="min-w-0">
                        <Link
                          href={`/shop/${item.product.slug}`}
                          className="text-white font-semibold text-base sm:text-lg hover:text-luxe-gold transition-colors line-clamp-2"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-luxe-silver text-xs sm:text-sm mt-1">
                          {item.product.category}
                        </p>
                        {item.product.is_adult_only && (
                          <Badge variant="adult" className="mt-2">
                            18+
                          </Badge>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-md text-luxe-silver hover:text-red-400 transition-colors -m-2 sm:m-0"
                        aria-label="Artikel entfernen"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] bg-luxe-gray hover:bg-luxe-gold hover:text-luxe-black rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Menge verringern"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={item.product.stock}
                          value={item.quantity}
                          onChange={(e) => {
                            const raw = e.target.value
                            if (raw === '') return
                            const v = parseInt(raw, 10)
                            if (!isNaN(v)) {
                              const clamped = Math.max(1, Math.min(item.product.stock, v))
                              updateQuantity(item.product.id, clamped)
                            }
                          }}
                          onBlur={(e) => {
                            const v = parseInt(e.target.value, 10)
                            if (isNaN(v) || v < 1) updateQuantity(item.product.id, 1)
                            else if (v > item.product.stock) updateQuantity(item.product.id, item.product.stock)
                          }}
                          className="w-12 sm:w-14 h-10 sm:h-8 text-center text-white font-semibold bg-luxe-gray border border-luxe-silver/30 rounded-md focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:border-transparent text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          aria-label="Menge"
                        />
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] bg-luxe-gray hover:bg-luxe-gold hover:text-luxe-black rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Menge erhöhen"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg sm:text-xl">
                          {formatPrice(getEffectivePrice(item.product) * item.quantity)}
                        </p>
                        <p className="text-luxe-silver text-xs sm:text-sm">
                          {formatPrice(getEffectivePrice(item.product))} / Stück
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-luxe-charcoal border border-luxe-gray rounded-lg p-4 sm:p-6 sticky top-20 sm:top-24"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                Zusammenfassung
              </h2>

              {/* 18+ Notice */}
              {needsAdultCheck && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-red-400 font-semibold mb-1">
                        18+ Altersverifikation erforderlich
                      </p>
                      <p className="text-red-400/80">
                        Dein Warenkorb enthält Produkte, die nur an Personen über 18 Jahre verkauft werden dürfen. 
                        Es fallen zusätzliche 2,00 € für die DHL Altersverifizierung an.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-luxe-silver">
                  <span>Zwischensumme</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-luxe-silver">
                  <span>Versand</span>
                  <span>{formatPrice(shipping)}</span>
                </div>
                {subtotal < FREE_SHIPPING_THRESHOLD_EUR && (
                  <p className="text-emerald-500/90 text-sm">
                    Noch {formatPrice(FREE_SHIPPING_THRESHOLD_EUR - subtotal)} bis versandkostenfrei
                  </p>
                )}
                {needsAdultCheck && (
                  <div className="flex justify-between text-red-400 text-sm">
                    <span>• DHL Ident-Check (18+)</span>
                    <span>+ {formatPrice(2.00)}</span>
                  </div>
                )}
                <div className="border-t border-luxe-gray pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold text-xl">
                      Gesamt
                    </span>
                    <span className="text-luxe-gold font-bold text-2xl">
                      {formatPrice(total)}
                    </span>
                  </div>
                  <p className="text-luxe-silver text-xs mt-2">
                    Inkl. gesetzlicher USt. zzgl. Versand
                  </p>
                  <p className="text-luxe-silver/80 text-xs mt-1">
                    Lieferung in {getDeliveryEstimateText()}
                  </p>
                </div>
              </div>

              {loyaltyPublic?.enabled && (
                <div className="mb-4 p-4 rounded-lg bg-luxe-gold/10 border border-luxe-gold/30 space-y-3">
                  {user ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-sm text-white">
                          <Gift className="w-4 h-4 text-luxe-gold shrink-0" />
                          <span className="font-semibold capitalize text-luxe-gold">{loyaltyData?.tier ?? 'Bronze'}</span>
                          <span className="text-luxe-silver">· {loyaltyData?.points_balance?.toLocaleString('de-DE') ?? 0} Punkte</span>
                        </span>
                        <Link href="/account/loyalty" className="text-xs text-luxe-gold hover:underline">Details</Link>
                      </div>
                      {loyaltyData?.next_tier && loyaltyData.points_needed > 0 && (
                        <div>
                          <div className="h-2 bg-luxe-charcoal rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${loyaltyData.progress_percent ?? 0}%` }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                              className="h-full bg-luxe-gold rounded-full"
                            />
                          </div>
                          <p className="text-xs text-luxe-silver mt-1">
                            Noch {loyaltyData.points_needed.toLocaleString('de-DE')} Punkte bis {loyaltyData.next_tier === 'silver' ? 'Silber' : 'Gold'}
                          </p>
                        </div>
                      )}
                      <p className="text-sm text-white">
                        Sammle <span className="font-semibold text-luxe-gold">{Math.floor(subtotal * (loyaltyPublic.points_per_euro || 1))} Punkte</span> mit dieser Bestellung – beim Checkout einlösbar.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-white">
                      <Gift className="w-4 h-4 text-luxe-gold inline-block mr-1.5 -mt-0.5 align-middle" />
                      <Link href="/auth?redirect=/cart" className="text-luxe-gold hover:underline font-medium">Melde dich an</Link>, um Punkte zu sammeln und beim nächsten Einkauf zu sparen.
                    </p>
                  )}
                </div>
              )}

              <p className="text-luxe-silver/80 text-xs mb-4">
                Rabattcode bei der Bestellung eingeben.
              </p>

              <button
                onClick={handleCheckout}
                className="w-full inline-flex items-center justify-center min-h-[48px] rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors mb-4 disabled:opacity-50"
              >
                Zur Kasse
              </button>

              <Link
                href="/shop"
                className="w-full inline-flex items-center justify-center min-h-[48px] rounded-md px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Weiter shoppen
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
