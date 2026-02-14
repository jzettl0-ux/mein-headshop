'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/shop/product-card'
import { supabase } from '@/lib/supabase'
import { Product } from '@/lib/types'

export function FeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])

  useEffect(() => {
    loadFeaturedProducts()
  }, [])

  const loadFeaturedProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_featured', true)
      .limit(4)

    if (data && data.length > 0) {
      setFeaturedProducts(data as Product[])
    }
  }

  // Nur echte Produkte aus der DB anzeigen – kein Mock mit Fake-IDs (prod-001 etc.)
  if (featuredProducts.length === 0) {
    return null
  }

  const products = featuredProducts

  return (
    <section className="section-padding bg-luxe-black">
      <div className="container-luxe">
        {/* Section Header – deutlich schmaler als Influencer-Bereich */}
        <div className="max-w-md mb-12">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <motion.span
                initial={{ opacity: 1, x: 0 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-luxe-gold uppercase text-sm font-semibold tracking-wider"
              >
                Bestseller
              </motion.span>
              <motion.h2
                initial={{ opacity: 1, x: 0 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold text-white"
              >
                Top Drops
              </motion.h2>
            </div>
            <motion.div
              initial={{ opacity: 1, x: 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex-shrink-0"
            >
              <Link
                href="/shop"
                className="hidden sm:inline-flex items-center text-luxe-silver hover:text-white hover:bg-accent rounded-md px-4 py-2 transition-colors group"
              >
                Alle Produkte
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex justify-center mt-12 sm:hidden"
        >
          <Link
            href="/shop"
            className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
          >
            Alle Produkte ansehen
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
