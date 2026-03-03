'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Promo-Strip unter dem Hero – wie head-shop.de „Check here für deinen Einkauf ab 20 €“.
 * Dein Stil: Luxe, Gold-Akzent, dezenter CTA.
 */
export function PromoStrip() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative border-y border-luxe-gray/50 bg-luxe-charcoal/60"
    >
      <div className="container-luxe py-3 sm:py-4">
        <Link
          href="/shop"
          className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 group"
        >
          <span className="text-luxe-silver text-sm sm:text-base">
            Kostenloser Versand ab 50 €
          </span>
          <span className="hidden sm:inline text-luxe-gray">·</span>
          <span className="inline-flex items-center gap-1.5 text-luxe-gold font-semibold group-hover:gap-2.5 transition-all">
            Jetzt entdecken
            <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </motion.section>
  )
}
