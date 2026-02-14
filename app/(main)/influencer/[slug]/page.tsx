'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Instagram, ExternalLink } from 'lucide-react'
import { ProductCard } from '@/components/shop/product-card'
import { Product } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export default function InfluencerPage({ params }: { params: { slug: string } }) {
  const [influencer, setInfluencer] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    loadInfluencerData()
  }, [params.slug])

  const loadInfluencerData = async () => {
    // Lade Influencer aus Datenbank
    const { data: influencerData } = await supabase
      .from('influencers')
      .select('*')
      .eq('slug', params.slug as never)
      .eq('is_active', true as never)
      .single()

    if (influencerData) {
      setInfluencer(influencerData)

      // Lade Produkte dieses Influencers
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('influencer_id', influencerData.id)

      if (productsData && productsData.length > 0) {
        setProducts(productsData as Product[])
      } else {
        setProducts([])
      }
    } else {
      setInfluencer(null)
      setProducts([])
    }
  }

  if (!influencer) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Influencer nicht gefunden
          </h2>
          <Link
            href="/influencer"
            className="inline-flex items-center justify-center h-10 rounded-md px-4 py-2 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
          >
            Zurück zur Übersicht
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe-black">
      {/* Hero Banner */}
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${influencer.accent_color}20 0%, transparent 100%)`,
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(circle, ${influencer.accent_color} 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative h-full flex items-center">
          <div className="container-luxe">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-8"
              >
                {/* Avatar */}
                <div
                  className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-luxe-gray border-4 border-luxe-charcoal flex items-center justify-center text-6xl md:text-8xl font-bold shadow-2xl"
                  style={{ color: influencer.accent_color }}
                >
                  {influencer.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                    {influencer.name}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    {influencer.social_links.instagram && (
                      <a
                        href={influencer.social_links.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-luxe-charcoal hover:bg-luxe-gray rounded-full transition-colors"
                      >
                        <Instagram className="w-5 h-5" style={{ color: influencer.accent_color }} />
                        <span className="text-white font-medium">Follow auf Instagram</span>
                        <ExternalLink className="w-4 h-4 text-luxe-silver" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-luxe-silver text-lg md:text-xl leading-relaxed max-w-2xl"
              >
                {influencer.bio}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Accent Line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: influencer.accent_color }}
        />
      </section>

      {/* Products Section */}
      <section className="py-16 md:py-24">
        <div className="container-luxe">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span style={{ color: influencer.accent_color }}>
                {influencer.name.split(' ')[0]}'s
              </span>{' '}
              Kollektion
            </h2>
            <p className="text-luxe-silver text-lg">
              Handverlesen und persönlich empfohlen
            </p>
          </motion.div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-luxe-silver text-lg">
                Noch keine Produkte verfügbar. Schau bald wieder vorbei!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-16 md:py-24"
        style={{
          background: `linear-gradient(135deg, ${influencer.accent_color}10 0%, transparent 100%)`,
        }}
      >
        <div className="container-luxe">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Noch nicht das Richtige gefunden?
            </h2>
            <p className="text-luxe-silver text-lg">
              Entdecke weitere Premium Produkte in unserem Shop
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center h-14 rounded-md px-10 text-base bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
            >
              Zum kompletten Shop
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
