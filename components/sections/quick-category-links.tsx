'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const CATEGORIES = [
  { slug: 'bongs', label: 'Bongs', href: '/shop?category=bongs' },
  { slug: 'grinder', label: 'Grinder', href: '/shop?category=grinder' },
  { slug: 'papers', label: 'Papers & Filter', href: '/shop?category=papers' },
  { slug: 'vaporizer', label: 'Vaporizer', href: '/shop?category=vaporizer' },
  { slug: 'zubehoer', label: 'Zubehör', href: '/shop?category=zubehoer' },
  { slug: 'influencer-drops', label: 'Influencer Drops', href: '/shop?category=influencer-drops' },
]

/**
 * Schnellzugriff auf Kategorien – wie bei head-shop.de unter dem Hero.
 * Dein Stil: Luxe, dunkel, Gold-Akzente.
 */
export function QuickCategoryLinks() {
  return (
    <section className="relative py-8 sm:py-10 -mt-4 z-10">
      <div className="container-luxe px-2 sm:px-4">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
            >
              <Link
                href={cat.href}
                className="inline-flex items-center justify-center min-h-[44px] px-4 sm:px-5 py-2.5 rounded-lg bg-luxe-charcoal/90 border border-luxe-gray hover:border-luxe-gold/50 hover:bg-luxe-gray/30 text-white font-medium text-sm transition-all duration-300 hover:shadow-lg hover:shadow-luxe-gold/10"
              >
                {cat.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
