'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Instagram, ArrowRight } from 'lucide-react'
import { Influencer } from '@/lib/types'

export function InfluencerGrid() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/homepage-influencers')
      const data = await res.json().catch(() => [])
      setInfluencers(Array.isArray(data) ? (data as Influencer[]) : [])
    }
    load()
  }, [])

  if (influencers.length === 0) return null

  return (
    <section className="section-padding section-mint">
      <div className="container-luxe">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="text-gradient-flow uppercase text-sm font-semibold tracking-wider"
          >
            Unsere Influencer
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-4xl md:text-5xl font-bold text-white"
          >
            Von Influencern kuratiert
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="text-luxe-silver text-lg max-w-2xl mx-auto"
          >
            Entdecke exklusive Produktlinien deiner Lieblings-Content Creator
          </motion.p>
        </div>

        {/* Influencer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {influencers.map((influencer, index) => {
            const displayName = influencer.homepage_title ?? influencer.name
            const displayBio = influencer.homepage_bio ?? influencer.bio ?? ''
            const socialLinks = (influencer.social_links || {}) as { instagram?: string }
            return (
            <motion.div
              key={influencer.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div 
                onClick={() => window.location.href = `/influencer/${influencer.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-luxe-gray bg-luxe-charcoal hover:border-luxe-gold/50 hover:shadow-xl hover:shadow-luxe-gold/5 transition-all duration-300 cursor-pointer hover:-translate-y-1"
              >
                {/* Banner Background */}
                <div className="h-48 relative bg-gradient-to-br from-luxe-gray to-luxe-charcoal overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-30 group-hover:opacity-50 transition-opacity duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${influencer.accent_color}33 0%, transparent 100%)`,
                      }}
                    />
                    {/* Animated Pattern */}
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 90, 0],
                      }}
                      transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `radial-gradient(circle, ${influencer.accent_color} 1px, transparent 1px)`,
                        backgroundSize: '20px 20px',
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="relative -mt-12 px-6 pb-6">
                    {/* Avatar */}
                    <div className="relative w-24 h-24 rounded-full bg-luxe-gray border-4 border-luxe-charcoal mb-4 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-300">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: influencer.accent_color }}
                      >
                        {displayName.charAt(0)}
                      </span>
                    </div>

                    {/* Name & Bio */}
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-luxe-gold transition-colors">
                      {displayName}
                    </h3>
                    <p className="text-luxe-silver text-sm mb-4 line-clamp-2">
                      {displayBio}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-luxe-gray">
                      {socialLinks.instagram && (
                        <a
                          href={socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-2 text-luxe-silver hover:text-luxe-gold transition-colors text-sm"
                        >
                          <Instagram className="w-4 h-4" />
                          Follow
                        </a>
                      )}
                      <span
                        className="text-sm font-medium"
                        style={{ color: influencer.accent_color }}
                      >
                        Produkte ansehen →
                      </span>
                    </div>
                  </div>
              </div>
            </motion.div>
          )})}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/influencer"
            className="inline-flex items-center justify-center h-11 rounded-md px-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Alle Influencer entdecken
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
