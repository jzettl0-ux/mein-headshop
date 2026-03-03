'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, Truck, CreditCard, Award, Gift } from 'lucide-react'

const trustFeatures = [
  { icon: Truck, title: 'Kostenloser Versand', description: 'Ab 50€ Bestellwert', href: '/shipping' },
  { icon: Shield, title: 'Diskreter Versand', description: 'Neutrale Verpackung' },
  { icon: CreditCard, title: 'Sichere Zahlung', description: 'SSL-verschlüsselt' },
  { icon: Award, title: '14 Tage Widerruf¹', description: 'Zufriedenheitsgarantie (Ausnahmen möglich)', href: '/returns' },
]

export function TrustBanner() {
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false)

  useEffect(() => {
    fetch('/api/loyalty/public')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.enabled && setLoyaltyEnabled(true))
      .catch(() => {})
  }, [])

  const features = [...trustFeatures]
  if (loyaltyEnabled) {
    features.push({ icon: Gift, title: 'Punkte & Belohnungen', description: 'Sammeln, einlösen, sparen', href: '/account/loyalty' })
  }
  return (
    <section className="py-20 relative overflow-hidden section-sage">
      {/* Hintergrund: weiche Gold- und Grün-Lichter an den Rändern */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 left-0 w-[60%] h-full bg-[radial-gradient(ellipse_80%_70%_at_0%_50%,rgba(212,175,55,0.06)_0%,transparent_70%)]" />
        <div className="absolute top-0 right-0 w-[60%] h-full bg-[radial-gradient(ellipse_80%_70%_at_100%_50%,rgba(57,255,20,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="container-luxe relative z-10">
        {/* Überschrift */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-luxe-gold uppercase text-sm font-semibold tracking-wider">
            Deine Vorteile
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            Versand, Zahlung & Qualität
          </h2>
          <p className="text-luxe-silver text-sm mt-2 max-w-lg mx-auto">
            Qualität, auf die du dich verlassen kannst – wir liefern, du genießt.
          </p>
        </motion.div>

        <div className={`grid gap-6 ${features.length === 5 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="group"
              >
                <div
                  className="relative h-full rounded-2xl p-6 sm:p-8 border border-luxe-gray bg-luxe-black/50 backdrop-blur-sm text-center flex flex-col items-center transition-all duration-300 hover:border-luxe-gold/40 hover:shadow-lg hover:shadow-luxe-gold/10 hover:-translate-y-1 trust-banner-card"
                  style={{
                    boxShadow: 'inset 0 1px 0 0 rgba(212,175,55,0.06)',
                  }}
                >
                  {/* Gradient-Rand oben beim Hover */}
                  <div className="absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-luxe-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none trust-banner-card-hover" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.04) 0%, transparent 40%, rgba(57,255,20,0.03) 100%)' }} />

                  <div className="relative flex flex-col items-center space-y-4">
                    <div className="trust-banner-icon w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(57,255,20,0.08) 100%)', border: '1px solid rgba(212,175,55,0.25)' }}>
                      <Icon className="w-8 h-8 text-luxe-gold" />
                    </div>
                    <h3 className="text-white font-semibold text-lg">
                      {feature.title}
                    </h3>
                    <p className="trust-banner-desc text-gray-300 text-sm font-medium">
                      {feature.description}
                    </p>
                    {feature.href && (
                      <Link
                        href={feature.href}
                        className="text-luxe-gold text-sm font-medium hover:underline mt-2 inline-flex items-center gap-1"
                      >
                        Mehr erfahren
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
        <p className="text-luxe-silver/60 text-xs text-center mt-6">
          ¹ Ausnahmen: z.B. hygienerelevante oder personalisierte Produkte. <a href="/returns#ausnahmen" className="text-luxe-gold/80 hover:underline">Details</a>
        </p>
      </div>
    </section>
  )
}
