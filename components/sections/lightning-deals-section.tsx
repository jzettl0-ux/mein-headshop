'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/components/shop/product-card'
import { Product } from '@/lib/types'

interface LightningDeal {
  deal_id: string
  deal_price: number
  original_price: number
  quantity_total: number
  quantity_claimed: number
  start_at: string
  end_at: string
  products: Product | null
}

export function LightningDealsSection() {
  const [deals, setDeals] = useState<LightningDeal[]>([])

  useEffect(() => {
    fetch('/api/lightning-deals')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDeals(Array.isArray(data) ? data : []))
      .catch(() => setDeals([]))
  }, [])

  if (deals.length === 0) return null

  const products = deals
    .filter((d) => d.products)
    .map((d) => {
      const p = d.products!
      return {
        ...p,
        price: d.deal_price,
        reference_price_30d: d.original_price,
      } as Product
    })

  return (
    <section className="section-padding section-warm">
      <div className="container-luxe">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div className="space-y-2">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="text-gradient-flow uppercase text-sm font-semibold tracking-wider flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Blitz-Angebote
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-4xl md:text-5xl font-bold text-white"
            >
              Zeitlich begrenzt
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="text-luxe-silver text-sm max-w-xl"
            >
              Nur noch kurze Zeit – greif zu, bevor die Deals auslaufen.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.16 }}
          >
            <Link
              href="/shop"
              className="hidden sm:inline-flex items-center text-luxe-silver hover:text-white rounded-md px-4 py-2 transition-colors group"
            >
              Alle Angebote
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
