'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Wine, Boxes, FileText, Cpu } from 'lucide-react'

const categories = [
  {
    name: 'Bongs',
    icon: Wine,
    href: '/shop?category=bongs',
    description: 'Premium Glasbongs',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
  },
  {
    name: 'Grinder',
    icon: Boxes,
    href: '/shop?category=grinder',
    description: 'Hochwertige Grinder',
    gradient: 'from-luxe-gold/20 to-yellow-500/20',
    iconColor: 'text-luxe-gold',
  },
  {
    name: 'Papers',
    icon: FileText,
    href: '/shop?category=papers',
    description: 'Premium Papers',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
  },
  {
    name: 'Vaporizer',
    icon: Cpu,
    href: '/shop?category=vaporizer',
    description: 'High-Tech Vaporizer',
    gradient: 'from-luxe-neon/20 to-green-500/20',
    iconColor: 'text-luxe-neon',
  },
]

export function CategoryShowcase() {
  return (
    <section className="section-padding bg-luxe-charcoal">
      <div className="container-luxe">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <motion.span
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-luxe-gold uppercase text-sm font-semibold tracking-wider"
          >
            Kategorien
          </motion.span>
          <motion.h2
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white"
          >
            Was suchst du?
          </motion.h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 1, scale: 1 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={category.href}>
                  <div className="group relative overflow-hidden rounded-xl p-8 h-64 flex flex-col items-center justify-center text-center border border-luxe-gray bg-luxe-black hover:border-luxe-gold/50 transition-all duration-300">
                    {/* Gradient Background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    />

                    {/* Icon */}
                    <div className="relative z-10 mb-6">
                      <div className="w-20 h-20 rounded-full bg-luxe-gray group-hover:bg-luxe-gold/10 flex items-center justify-center transition-colors duration-300">
                        <Icon className={`w-10 h-10 ${category.iconColor} group-hover:scale-110 transition-transform duration-300`} />
                      </div>
                    </div>

                    {/* Text */}
                    <div className="relative z-10 space-y-2">
                      <h3 className="text-2xl font-bold text-white group-hover:text-luxe-gold transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-luxe-silver text-sm">
                        {category.description}
                      </p>
                    </div>

                    {/* Hover Arrow */}
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
            )
          })}
        </div>
      </div>
    </section>
  )
}
