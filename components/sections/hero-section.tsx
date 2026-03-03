'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getStableSpruch } from '@/lib/copy'

export function HeroSection() {
  return (
    <section className="hero-section relative min-h-[75vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-luxe-black via-luxe-charcoal to-luxe-black">
      {/* Verschwommene Farbflächen: Gold und Grün weich ineinander */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.5, 0.85, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-1/2 -left-1/2 w-[140%] h-[140%] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(254,240,138,0.12) 0%, rgba(212,175,55,0.08) 30%, rgba(57,255,20,0.04) 55%, transparent 70%)',
          }}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -bottom-1/2 -right-1/2 w-[140%] h-[140%] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(57,255,20,0.1) 0%, rgba(16,185,129,0.06) 35%, rgba(212,175,55,0.04) 60%, transparent 75%)',
          }}
        />
        <motion.div
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, rgba(57,255,20,0.05) 50%, transparent 70%)',
          }}
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
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-luxe-gold/30"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(57,255,20,0.08) 50%, rgba(212,175,55,0.1) 100%)',
            }}
          >
            <Sparkles className="w-4 h-4 text-luxe-gold" />
            <span className="text-sm font-medium text-gradient-flow">
              Premium Cannabis Zubehör
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-5xl md:text-7xl font-bold leading-tight px-1"
          >
            <span className="text-gradient-flow">Luxus trifft auf</span>
            <br />
            <span className="text-gradient-flow">Lifestyle</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-xl md:text-2xl text-luxe-silver max-w-2xl mx-auto leading-relaxed px-2"
          >
            Entdecke hochwertige Bongs, Grinder und Vaporizer – handverlesen von deinen Lieblings-Influencern.
            <span className="block mt-2 text-sm sm:text-base text-luxe-silver/90">Von Kennern für Genießer.</span>
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
              className="group inline-flex items-center justify-center min-h-[48px] h-14 rounded-md px-8 sm:px-10 text-base bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors w-full sm:w-auto"
            >
              Jetzt Shoppen
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/influencer"
              className="inline-flex items-center justify-center min-h-[48px] h-14 rounded-md px-8 sm:px-10 text-base border border-luxe-gray hover:bg-luxe-gray/20 text-white transition-colors w-full sm:w-auto"
            >
              Influencer Entdecken
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-luxe-gold/80 text-sm italic max-w-md mx-auto"
          >
            „{getStableSpruch('hero')}"
          </motion.p>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm text-luxe-silver"
          >
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="w-2 h-2 rounded-full bg-luxe-neon shadow-[0_0_8px_rgba(57,255,20,0.6)]"
              />
              <span>Kostenloser Versand ab 50€</span>
            </div>
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="w-2 h-2 rounded-full bg-luxe-neon shadow-[0_0_8px_rgba(57,255,20,0.6)]"
              />
              <span>Diskreter Versand</span>
            </div>
            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                className="w-2 h-2 rounded-full bg-luxe-neon shadow-[0_0_8px_rgba(57,255,20,0.6)]"
              />
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
