'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, ExternalLink, Instagram } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Mock influencers - später durch echte Supabase-Daten ersetzen
const mockInfluencers = [
  {
    id: 'inf-001',
    name: 'Max Grün',
    slug: 'max-gruen',
    bio: 'Premium Cannabis Content Creator',
    accent_color: '#39FF14',
    is_active: true,
    product_count: 2,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'inf-002',
    name: 'Lisa High',
    slug: 'lisa-high',
    bio: 'High-End Lifestyle & Cannabis',
    accent_color: '#D4AF37',
    is_active: true,
    product_count: 1,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80',
  },
  {
    id: 'inf-003',
    name: 'Tom Smoke',
    slug: 'tom-smoke',
    bio: 'Vaporizer Spezialist',
    accent_color: '#FF6B35',
    is_active: true,
    product_count: 1,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80',
  },
]

export default function AdminInfluencersPage() {
  const [influencers, setInfluencers] = useState(mockInfluencers)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadInfluencers()
  }, [])

  const loadInfluencers = async () => {
    const { data, error } = await supabase
      .from('influencers')
      .select('*')
      .order('name')

    if (!error && data) {
      // Get product counts
      const influencersWithCount = await Promise.all(
        data.map(async (inf) => {
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('influencer_id', inf.id)

          return {
            ...inf,
            product_count: count || 0,
          }
        })
      )
      setInfluencers(influencersWithCount as any)
    }
  }

  const handleDelete = async (influencerId: string, influencerName: string) => {
    if (!confirm(`Möchtest du "${influencerName}" wirklich löschen? Zugeordnete Produkte bleiben erhalten.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('influencers')
        .delete()
        .eq('id', influencerId)

      if (error) throw error

      toast({
        title: 'Influencer gelöscht',
        description: `${influencerName} wurde entfernt.`,
      })

      loadInfluencers()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast({
        title: 'Fehler beim Löschen',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const filteredInfluencers = influencers.filter(inf =>
    inf.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Influencer</h1>
          <p className="text-luxe-silver">
            Verwalte deine Influencer-Partner und deren Kollektionen
          </p>
        </div>
        <Link
          href="/admin/influencers/new"
          className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Neuer Influencer
        </Link>
      </div>

      {/* Search */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-silver" />
            <Input
              type="text"
              placeholder="Influencer durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-luxe-gray border-luxe-silver text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Influencers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInfluencers.map((influencer, index) => (
          <motion.div
            key={influencer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-luxe-charcoal border-luxe-gray hover:border-luxe-gold/50 transition-colors overflow-hidden">
              {/* Header with Accent Color */}
              <div
                className="h-24 relative"
                style={{
                  background: `linear-gradient(135deg, ${influencer.accent_color}40 0%, transparent 100%)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(circle, ${influencer.accent_color} 1px, transparent 1px)`,
                    backgroundSize: '20px 20px',
                  }}
                />
              </div>

              <CardContent className="relative -mt-12 pb-6">
                {/* Avatar */}
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-luxe-charcoal overflow-hidden bg-luxe-gray">
                    <img
                      src={influencer.avatar_url}
                      alt={influencer.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="text-center space-y-3">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {influencer.name}
                    </h3>
                    <p className="text-sm text-luxe-silver">
                      {influencer.bio}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <div className="text-center">
                      <div className="text-white font-bold">
                        {influencer.product_count}
                      </div>
                      <div className="text-luxe-silver text-xs">Produkte</div>
                    </div>
                    <div className="w-px h-8 bg-luxe-gray" />
                    <div className="text-center">
                      <div
                        className="w-6 h-6 rounded-full mx-auto"
                        style={{ backgroundColor: influencer.accent_color }}
                      />
                      <div className="text-luxe-silver text-xs mt-1">Farbe</div>
                    </div>
                  </div>

                  {/* Status */}
                  <Badge
                    variant={influencer.is_active ? 'featured' : 'secondary'}
                    className="text-xs"
                  >
                    {influencer.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </div>

                  {/* Actions */}
                  <div className="mt-6 space-y-2">
                    <Link
                      href={`/influencer/${influencer.slug}`}
                      target="_blank"
                      className="w-full inline-flex items-center justify-center px-4 py-2 rounded-md bg-luxe-gray hover:bg-luxe-gray/80 text-white text-sm transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Landingpage ansehen
                    </Link>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/influencers/${influencer.id}/edit`}
                        className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Bearbeiten
                      </Link>
                      <button
                        onClick={() => handleDelete(influencer.id, influencer.name)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Löschen
                      </button>
                    </div>
                  </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredInfluencers.length === 0 && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <p className="text-luxe-silver">Keine Influencer gefunden.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
