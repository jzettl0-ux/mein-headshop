'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-luxe-black via-luxe-charcoal to-luxe-black">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-luxe-gold/5 to-luxe-neon/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-luxe-gold/5 to-luxe-neon/5 rounded-full blur-3xl"
        />
      </div>

      {/* Content */}
      <div className="container-luxe relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-luxe-gold/10 border border-luxe-gold/30 rounded-full"
          >
            <Sparkles className="w-4 h-4 text-luxe-gold" />
            <span className="text-sm text-luxe-gold font-medium">
              Premium Cannabis Zubehör
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold leading-tight"
          >
            <span className="text-white">Luxus trifft auf</span>
            <br />
            <span className="text-gradient-gold">Lifestyle</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-luxe-silver max-w-2xl mx-auto leading-relaxed"
          >
            Entdecke hochwertige Bongs, Grinder und Vaporizer. 
            Handverlesen von deinen Lieblings-Influencern.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/shop"
              className="group inline-flex items-center justify-center h-14 rounded-md px-10 text-base bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
            >
              Jetzt Shoppen
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/influencer"
              className="inline-flex items-center justify-center h-14 rounded-md px-10 text-base border border-luxe-gray hover:bg-luxe-gray/20 text-white transition-colors"
            >
              Influencer Entdecken
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-luxe-silver"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-luxe-neon rounded-full animate-pulse" />
              <span>Kostenloser Versand ab 50€</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-luxe-neon rounded-full animate-pulse" />
              <span>Diskreter Versand</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-luxe-neon rounded-full animate-pulse" />
              <span>100% Qualitätsgarantie</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-6 h-10 border-2 border-luxe-silver/30 rounded-full p-1"
        >
          <div className="w-1 h-2 bg-luxe-silver/50 rounded-full mx-auto" />
        </motion.div>
      </motion.div>
    </section>
  )
}
