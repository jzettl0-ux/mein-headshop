'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/components/shop/product-card'
import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'

/**
 * Zeigt automatisch die am meisten gekauften Produkte (total_sold).
 * Hervorgehoben für Kunden – ohne manuelles "Featured"-Setzen.
 */
export function BestsellerSection() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .gte('total_sold', 1)
        .order('total_sold', { ascending: false })
        .limit(4)
      if (data && data.length > 0) {
        setProducts(data as Product[])
      }
    }
    load()
  }, [])

  if (products.length === 0) return null

  return (
    <section className="section-padding bg-luxe-charcoal/50">
      <div className="container-luxe">
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.h2
              initial={{ opacity: 1, x: 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-white"
            >
              Am meisten gekauft
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
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
          {products.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
