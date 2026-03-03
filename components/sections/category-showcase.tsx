'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import type { HomepageCategory } from '@/lib/types'

export function CategoryShowcase() {
  const [categories, setCategories] = useState<HomepageCategory[]>([])

  useEffect(() => {
    fetch('/api/homepage-categories')
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
  }, [])

  if (categories.length === 0) return null

  return (
    <section className="section-padding section-warm">
      <div className="container-luxe">
        <div className="text-center mb-16 space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="text-gradient-flow uppercase text-sm font-semibold tracking-wider"
          >
            Kategorien
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-4xl md:text-5xl font-bold text-white"
          >
            Was suchst du?
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Link href={`/shop?category=${category.slug}`}>
                <div className="group relative overflow-hidden rounded-2xl p-8 h-64 flex flex-col items-center justify-center text-center border border-luxe-gray bg-luxe-black hover:border-luxe-gold/50 hover:shadow-xl hover:shadow-luxe-gold/5 transition-all duration-300 hover:-translate-y-1">
                  {/* Verlauf: eigene Hex-Farben oder Tailwind */}
                  {category.gradient_start_hex && category.gradient_end_hex ? (
                    <div
                      className="absolute inset-0 opacity-25 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `linear-gradient(135deg, ${category.gradient_start_hex} 0%, ${category.gradient_end_hex} 100%)` }}
                    />
                  ) : (
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-25 group-hover:opacity-100 transition-opacity duration-300`}
                    />
                  )}

                  <div className="relative z-10 mb-6">
                    <div className="w-20 h-20 rounded-full bg-luxe-gray group-hover:bg-luxe-gold/10 flex items-center justify-center overflow-hidden transition-colors duration-300">
                      {category.image_url ? (
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : category.icon_color_hex ? (
                        <span className="text-2xl font-bold" style={{ color: category.icon_color_hex }}>
                          {category.name.charAt(0)}
                        </span>
                      ) : (
                        <span className={`text-2xl font-bold ${category.icon_color}`}>
                          {category.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 space-y-2">
                    <h3 className="text-2xl font-bold text-white group-hover:text-luxe-gold transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-luxe-silver text-sm">
                      {category.description}
                    </p>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute bottom-6 text-luxe-gold text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Jetzt entdecken →
                  </motion.div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
