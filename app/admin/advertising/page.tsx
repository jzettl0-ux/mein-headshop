'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Plus, ChevronRight, Pause, Play, Archive, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

export default function AdminAdvertisingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/advertising/campaigns')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCampaigns(Array.isArray(data) ? data : []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/advertising/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      setCampaigns((prev) => prev.map((c) => (c.campaign_id === id ? { ...c, status } : c)))
      toast({ title: 'Status aktualisiert' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-luxe-gold" />
            PPC & Sponsored Products
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Kampagnen und Keyword-/ASIN-Targeting. KCanG §6: Kein verherrlichendes Cannabis-Targeting.
          </p>
        </div>
        <Link href="/admin/advertising/new">
          <Button variant="luxe"><Plus className="w-5 h-5 mr-2" />Neue Kampagne</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <TrendingUp className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Kampagnen.</p>
            <Link href="/admin/advertising/new">
              <Button variant="luxe" className="mt-4">Erste Kampagne anlegen</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <Card key={c.campaign_id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link href={`/admin/advertising/${c.campaign_id}`} className="font-semibold text-white hover:text-luxe-gold">
                        {c.campaign_name}
                      </Link>
                      <Badge variant={c.status === 'ACTIVE' ? 'default' : c.status === 'PAUSED' ? 'secondary' : 'outline'}>
                        {c.status === 'ACTIVE' ? 'Aktiv' : c.status === 'PAUSED' ? 'Pausiert' : 'Archiviert'}
                      </Badge>
                    </div>
                    <p className="text-sm text-luxe-silver">
                      {formatPrice(c.daily_budget)}/Tag
                      {c.vendor_accounts ? ` · ${c.vendor_accounts.company_name}` : ' · Platform'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.status === 'ACTIVE' && (
                      <Button variant="admin-outline" size="sm" onClick={() => handleStatusChange(c.campaign_id, 'PAUSED')}>
                        <Pause className="w-4 h-4 mr-1" /> Pausieren
                      </Button>
                    )}
                    {c.status === 'PAUSED' && (
                      <Button variant="admin-outline" size="sm" onClick={() => handleStatusChange(c.campaign_id, 'ACTIVE')}>
                        <Play className="w-4 h-4 mr-1" /> Aktivieren
                      </Button>
                    )}
                    {c.status !== 'ARCHIVED' && (
                      <Button variant="admin-outline" size="sm" onClick={() => handleStatusChange(c.campaign_id, 'ARCHIVED')}>
                        <Archive className="w-4 h-4 mr-1" /> Archivieren
                      </Button>
                    )}
                    <Link href={`/admin/advertising/${c.campaign_id}`}>
                      <Button variant="admin-outline" size="icon"><ChevronRight className="w-4 h-4" /></Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
