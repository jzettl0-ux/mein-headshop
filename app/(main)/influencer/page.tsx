'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Instagram } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const mockInfluencers = [
  {
    id: '1',
    name: 'Max Grün',
    slug: 'max-gruen',
    bio: 'Premium Cannabis Content Creator',
    accent_color: '#39FF14',
    followers: '125K',
  },
  {
    id: '2',
    name: 'Lisa High',
    slug: 'lisa-high',
    bio: 'High-End Lifestyle & Cannabis',
    accent_color: '#D4AF37',
    followers: '230K',
  },
  {
    id: '3',
    name: 'Tom Smoke',
    slug: 'tom-smoke',
    bio: 'Vaporizer Spezialist',
    accent_color: '#FF6B35',
    followers: '89K',
  },
]

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<any[]>([])

  useEffect(() => {
    loadInfluencers()
  }, [])

  const loadInfluencers = async () => {
    const { data } = await supabase
      .from('influencers')
      .select('*')
      .eq('is_active', true)

    if (data && data.length > 0) {
      setInfluencers(data)
    } else {
      setInfluencers(mockInfluencers)
    }
  }

  const displayInfluencers = influencers.length > 0 ? influencers : mockInfluencers

  return (
    <div className="min-h-screen bg-luxe-black">
      {/* Header */}
      <div className="bg-gradient-to-b from-luxe-charcoal to-luxe-black py-16 md:py-24">
        <div className="container-luxe">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Unsere Influencer
            </h1>
            <p className="text-luxe-silver text-lg md:text-xl">
              Entdecke exklusive Produktlinien von deinen Lieblings-Content Creators. 
              Jeder Influencer kuratiert seine eigene Premium-Kollektion.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Influencers Grid */}
      <div className="container-luxe py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayInfluencers.map((influencer, index) => (
            <motion.div
              key={influencer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                onClick={() => window.location.href = `/influencer/${influencer.slug}`}
                className="group relative overflow-hidden rounded-2xl border border-luxe-gray bg-luxe-charcoal hover:border-luxe-gold/50 transition-all duration-300 h-96 cursor-pointer"
              >
                {/* Background Pattern */}
                <div
                  className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
                  style={{
                    background: `linear-gradient(135deg, ${influencer.accent_color}40 0%, transparent 100%)`,
                  }}
                />

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-center text-center p-8">
                    {/* Avatar */}
                    <div
                      className="w-32 h-32 rounded-full bg-luxe-gray flex items-center justify-center text-5xl font-bold mb-6 group-hover:scale-110 transition-transform duration-300"
                      style={{ color: influencer.accent_color }}
                    >
                      {influencer.name.charAt(0)}
                    </div>

                    {/* Info */}
                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-luxe-gold transition-colors">
                      {influencer.name}
                    </h3>
                    <p className="text-luxe-silver mb-4">{influencer.bio}</p>

                    {/* Stats */}
                    <div className="flex items-center space-x-2 text-luxe-silver text-sm">
                      <Instagram className="w-4 h-4" />
                      <span>{influencer.followers} Follower</span>
                    </div>

                    {/* CTA */}
                    <div
                      className="mt-6 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: influencer.accent_color }}
                    >
                      Kollektion ansehen →
                    </div>
                  </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
