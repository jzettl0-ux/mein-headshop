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
        .eq('is_active', true)
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
    <section className="section-padding section-sage">
      <div className="container-luxe">
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5 }}
              className="text-gradient-flow uppercase text-sm font-semibold tracking-wider"
            >
              Bestseller
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="text-4xl md:text-5xl font-bold text-white mt-1"
            >
              Am meisten gekauft
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="text-luxe-silver text-sm max-w-md mt-2"
            >
              Von euch gewählt – die Artikel mit den meisten Käufen. Was die Community vertraut, überzeugt.
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
          {products.map((p, index) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
