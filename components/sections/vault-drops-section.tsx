'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Lock } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/components/shop/product-card'
import { Product } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

interface VaultDrop {
  drop_id: string
  product_id: string
  drop_price: number
  total_units_available: number
  units_sold: number
  units_locked_in_carts: number
  start_timestamp: string
  end_timestamp: string
  products: Product | null
}

function Countdown({ endAt }: { endAt: string }) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    const tick = () => {
      const end = new Date(endAt).getTime()
      const now = Date.now()
      if (now >= end) {
        setRemaining('Beendet')
        return
      }
      const diff = end - now
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setRemaining(`${h}h ${m}m ${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endAt])
  return <span className="font-mono text-luxe-gold">{remaining}</span>
}

export function VaultDropsSection() {
  const [drops, setDrops] = useState<VaultDrop[]>([])

  useEffect(() => {
    fetch('/api/vault-drops')
      .then((r) => (r.ok ? r.json() : { drops: [] }))
      .then((data) => setDrops(Array.isArray(data.drops) ? data.drops : []))
      .catch(() => setDrops([]))
  }, [])

  if (drops.length === 0) return null

  const products = drops
    .filter((d) => d.products)
    .map((d) => {
      const p = d.products!
      const remaining = Math.max(0, (d.total_units_available ?? 0) - (d.units_sold ?? 0))
      return {
        ...p,
        price: d.drop_price,
        reference_price_30d: p.price,
        stock: remaining,
      } as Product
    })

  const earliestEnd = drops.length ? drops.reduce((a, b) => (a.end_timestamp < b.end_timestamp ? a : b)).end_timestamp : ''

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
              <Lock className="w-4 h-4" />
              4:20 Vault
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-4xl md:text-5xl font-bold text-white"
            >
              Limitierte Drops
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="text-luxe-silver text-sm max-w-xl flex items-center gap-2"
            >
              Noch <Countdown endAt={earliestEnd} /> – nur solange der Vorrat reicht.
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
              Alle Produkte
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
