'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Loader2, Plus, RefreshCw, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function AdminProductGuidancePage() {
  const { toast } = useToast()
  const [gaps, setGaps] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newTerm, setNewTerm] = useState('')
  const [newVolume, setNewVolume] = useState('')
  const [adding, setAdding] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/product-guidance/gaps').then((r) => (r.ok ? r.json() : { gaps: [] })),
      fetch('/api/admin/product-guidance/recommendations').then((r) => (r.ok ? r.json() : { recommendations: [] })),
      fetch('/api/admin/vendors').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([g, r, v]) => {
        setGaps(g.gaps ?? [])
        setRecommendations(r.recommendations ?? [])
        setVendors(Array.isArray(v) ? v : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleAddGap = async (e: React.FormEvent) => {
    e.preventDefault()
    const term = newTerm.trim()
    if (!term) {
      toast({ title: 'Suchbegriff eingeben', variant: 'destructive' })
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/admin/product-guidance/gaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          search_term: term,
          search_volume_last_30_days: parseInt(newVolume, 10) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setNewTerm('')
      setNewVolume('')
      toast({ title: 'Such-Lücke angelegt' })
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }

  const handleAddRecommendation = async (gapId: string, vendorId: string, term: string) => {
    try {
      const res = await fetch('/api/admin/product-guidance/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          gap_id: gapId,
          related_search_term: term,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Empfehlung erstellt' })
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  const handleRefreshGap = async (gapId: string) => {
    try {
      const res = await fetch(`/api/admin/product-guidance/gaps/${gapId}/refresh`, { method: 'POST' })
      if (!res.ok) throw new Error('Fehler')
      toast({ title: 'Angebotsanzahl aktualisiert' })
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Lightbulb className="h-7 w-7 text-luxe-primary" />
          Product Guidance
        </h1>
        <p className="mt-1 text-luxe-silver">
          Such-Lücken: Hohes Volumen, wenige Treffer. Empfehlungen an Vendoren für Sortimentserweiterung.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Such-Lücke hinzufügen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddGap} className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Suchbegriff</label>
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="z. B. vaporizer"
                className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white w-48"
              />
            </div>
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Suchvolumen (30 Tage)</label>
              <input
                type="number"
                min={0}
                value={newVolume}
                onChange={(e) => setNewVolume(e.target.value)}
                placeholder="0"
                className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white w-24"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={adding} className="gap-2">
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Hinzufügen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" /> Such-Lücken
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-luxe-silver" />
            </div>
          ) : gaps.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">
              Keine Such-Lücken. Füge oben Suchbegriffe mit Volumen hinzu.
            </p>
          ) : (
            <div className="space-y-3">
              {gaps.map((g: any) => (
                <div
                  key={g.gap_id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray"
                >
                  <div>
                    <p className="text-white font-medium">{g.search_term}</p>
                    <p className="text-sm text-luxe-silver">
                      Volumen: {g.search_volume_last_30_days} · Treffer: {g.active_offers_count} · 
                      Opportunity-Score: {Number(g.opportunity_score ?? 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRefreshGap(g.gap_id)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <select
                      onChange={(e) => {
                        const vid = e.target.value
                        if (vid) handleAddRecommendation(g.gap_id, vid, g.search_term)
                        e.target.value = ''
                      }}
                      className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-1.5 text-white text-sm"
                    >
                      <option value="">→ Vendor empfehlen</option>
                      {vendors.map((v: any) => (
                        <option key={v.id} value={v.id}>{v.company_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Vendor-Empfehlungen</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">
              Keine Empfehlungen. Erstelle welche über „→ Vendor empfehlen“ bei den Such-Lücken.
            </p>
          ) : (
            <div className="space-y-2">
              {recommendations.map((r: any) => (
                <div
                  key={r.recommendation_id}
                  className="flex items-center justify-between p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray text-sm"
                >
                  <span className="text-white">
                    {r.vendor_accounts?.company_name ?? r.vendor_id?.slice(0, 8)} · {r.related_search_term ?? r.product_categories?.name ?? '—'}
                  </span>
                  <Badge variant={r.status === 'PRODUCT_ADDED' ? 'default' : r.status === 'DISMISSED' ? 'secondary' : 'outline'}>
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
