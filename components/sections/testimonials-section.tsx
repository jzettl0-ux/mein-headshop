'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Quote, Star } from 'lucide-react'

import { FALLBACK_SHOP_REVIEWS } from '@/lib/fallback-reviews'

const FALLBACK_TESTIMONIALS = FALLBACK_SHOP_REVIEWS.map((r) => ({
  text: r.comment,
  author: r.display_name,
  location: '',
  rating: r.rating,
}))

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<{ text: string; author: string; location?: string; rating: number }[]>(FALLBACK_TESTIMONIALS)

  useEffect(() => {
    fetch('/api/shop-reviews')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        if (list.length >= 3) {
          setTestimonials(
            list.slice(0, 6).map((r: { comment: string | null; display_name: string; rating: number }) => ({
              text: r.comment || '(Bewertung ohne Kommentar)',
              author: r.display_name,
              rating: r.rating,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden section-cream" aria-labelledby="testimonials-heading">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(212,175,55,0.06)_0%,transparent_70%)]" />
      </div>
      <div className="container-luxe relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          className="text-center mb-12"
        >
          <span className="text-luxe-gold uppercase text-sm font-semibold tracking-wider">Kundenstimmen</span>
          <h2 id="testimonials-heading" className="text-2xl sm:text-3xl font-bold text-white mt-2">
            Das sagen unsere Kunden
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative rounded-2xl border border-luxe-gray bg-luxe-charcoal/80 p-6 sm:p-8 flex flex-col"
            >
              <Quote className="w-10 h-10 text-luxe-gold/30 absolute top-4 right-4" aria-hidden />
              <div className="flex gap-1 mb-4" aria-hidden>
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-luxe-gold fill-luxe-gold" />
                ))}
              </div>
              <p className="text-luxe-silver text-sm sm:text-base leading-relaxed flex-1">„{t.text}"</p>
              <footer className="mt-4 pt-4 border-t border-luxe-gray">
                <p className="text-white font-semibold text-sm">{t.author}</p>
                {t.location && <p className="text-luxe-silver/80 text-xs">{t.location}</p>}
              </footer>
            </motion.blockquote>
          ))}
        </div>
        <p className="text-center mt-8">
          <Link href="/bewertungen" className="text-luxe-gold hover:underline text-sm font-medium">
            Alle Bewertungen ansehen & eigene abgeben →
          </Link>
        </p>
      </div>
    </section>
  )
}
