'use client'

import { motion } from 'framer-motion'
import { Shield, Truck, CreditCard, Award } from 'lucide-react'

const trustFeatures = [
  {
    icon: Truck,
    title: 'Kostenloser Versand',
    description: 'Ab 50€ Bestellwert',
  },
  {
    icon: Shield,
    title: 'Diskreter Versand',
    description: 'Neutrale Verpackung',
  },
  {
    icon: CreditCard,
    title: 'Sichere Zahlung',
    description: 'SSL-verschlüsselt',
  },
  {
    icon: Award,
    title: 'Premium Qualität',
    description: '100% Garantie',
  },
]

export function TrustBanner() {
  return (
    <section className="py-16 bg-gradient-to-r from-luxe-charcoal via-luxe-gray to-luxe-charcoal">
      <div className="container-luxe">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {trustFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 1, y: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center space-y-3 group"
              >
                <div className="w-16 h-16 rounded-full bg-luxe-gold/10 border border-luxe-gold/30 flex items-center justify-center group-hover:bg-luxe-gold/20 group-hover:scale-110 transition-all duration-300">
                  <Icon className="w-8 h-8 text-luxe-gold" />
                </div>
                <h3 className="text-white font-semibold text-lg">
                  {feature.title}
                </h3>
                <p className="text-luxe-silver text-sm">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
