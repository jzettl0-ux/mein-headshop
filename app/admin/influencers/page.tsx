'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, ExternalLink, TrendingUp, Wallet, Banknote, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

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

type PerformanceRow = {
  id: string
  name: string
  slug: string
  commission_rate: number
  revenue: number
  commission: number
  open_balance: number
  requested_payouts: { id: string; amount: number; requested_at: string | null }[]
}

export default function AdminInfluencersPage() {
  const [influencers, setInfluencers] = useState(mockInfluencers)
  const [searchTerm, setSearchTerm] = useState('')
  const [performance, setPerformance] = useState<PerformanceRow[]>([])
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadInfluencers()
  }, [])

  useEffect(() => {
    fetch('/api/admin/influencers/performance')
      .then((r) => (r.ok ? r.json() : { influencers: [] }))
      .then((d) => setPerformance(d.influencers ?? []))
      .catch(() => setPerformance([]))
  }, [])

  const handleConfirmPayout = async (payoutId: string) => {
    setConfirmingId(payoutId)
    try {
      const res = await fetch('/api/admin/influencers/payouts/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payout_id: payoutId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: data.error ?? 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: data.message ?? 'Auszahlung bestätigt' })
      const next = await fetch('/api/admin/influencers/performance')
      if (next.ok) {
        const j = await next.json()
        setPerformance(j.influencers ?? [])
      }
    } finally {
      setConfirmingId(null)
    }
  }

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

      {/* Performance & Auszahlungen */}
      <Card className="bg-luxe-charcoal border-luxe-gray mt-10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-luxe-gold" />
            Performance & Auszahlungen
          </CardTitle>
          <CardDescription className="text-luxe-silver">
            Umsatz und Provision pro Partner; angefragte Auszahlungen bestätigen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {performance.length === 0 ? (
            <p className="text-luxe-silver py-4">Keine Performance-Daten.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-luxe-gray text-left text-luxe-silver">
                    <th className="pb-3 pr-4">Partner</th>
                    <th className="pb-3 pr-4">Umsatz</th>
                    <th className="pb-3 pr-4">Provision</th>
                    <th className="pb-3 pr-4">Offen</th>
                    <th className="pb-3">Auszahlungen</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((p) => (
                    <tr key={p.id} className="border-b border-luxe-gray/70">
                      <td className="py-3 pr-4 font-medium text-white">{p.name}</td>
                      <td className="py-3 pr-4 text-white">{formatPrice(p.revenue)}</td>
                      <td className="py-3 pr-4 text-luxe-gold">{formatPrice(p.commission)}</td>
                      <td className="py-3 pr-4 text-white">{formatPrice(p.open_balance)}</td>
                      <td className="py-3">
                        {p.requested_payouts.length === 0 ? (
                          <span className="text-luxe-silver">–</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {p.requested_payouts.map((req) => (
                              <div key={req.id} className="flex items-center gap-2">
                                <span className="text-white">{formatPrice(req.amount)}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                                  disabled={confirmingId === req.id}
                                  onClick={() => handleConfirmPayout(req.id)}
                                >
                                  {confirmingId === req.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Auszahlung bestätigen
                                    </>
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
