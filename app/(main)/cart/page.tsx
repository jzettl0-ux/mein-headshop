'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, ShoppingBag, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/store/cart'
import { formatPrice, getEffectivePrice } from '@/lib/utils'

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal, getShipping, getTotal, hasAdultItems } = useCartStore()
  const router = useRouter()

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
          <p className="text-luxe-silver">
            Füge ein paar coole Produkte hinzu!
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
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Warenkorb
          </h1>
          <p className="text-luxe-silver">
            {items.length} Artikel in deinem Warenkorb
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => (
              <motion.div
                key={item.product.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-luxe-charcoal border border-luxe-gray rounded-lg p-6"
              >
                <div className="flex gap-6">
                  {/* Product Image Placeholder */}
                  <div className="w-24 h-24 bg-luxe-gray rounded-lg flex-shrink-0 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-luxe-silver/30" />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Link
                          href={`/shop/${item.product.slug}`}
                          className="text-white font-semibold text-lg hover:text-luxe-gold transition-colors"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-luxe-silver text-sm mt-1">
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
                        className="text-luxe-silver hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 bg-luxe-gray hover:bg-luxe-gold hover:text-luxe-black rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-white font-semibold w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="w-8 h-8 bg-luxe-gray hover:bg-luxe-gold hover:text-luxe-black rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-xl">
                          {formatPrice(getEffectivePrice(item.product) * item.quantity)}
                        </p>
                        <p className="text-luxe-silver text-sm">
                          {formatPrice(getEffectivePrice(item.product))} / Stück
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-luxe-charcoal border border-luxe-gray rounded-lg p-6 sticky top-24"
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
                    Inkl. MwSt.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors mb-4 disabled:opacity-50"
              >
                Zur Kasse
              </button>

              <Link
                href="/shop"
                className="w-full inline-flex items-center justify-center h-11 rounded-md px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
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
