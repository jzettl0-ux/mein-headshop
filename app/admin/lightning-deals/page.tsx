'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

export default function AdminLightningDealsPage() {
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/lightning-deals')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setDeals(Array.isArray(data) ? data : []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Lightning Deal wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/lightning-deals/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setDeals((prev) => prev.filter((d) => d.deal_id !== id))
      toast({ title: 'Gelöscht' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')
  const now = new Date()

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-7 h-7 text-luxe-gold" />
            Lightning Deals (4:20 Deals)
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Zeitlich begrenzte Angebote mit Countdown und Kontingent
          </p>
        </div>
        <Link href="/admin/lightning-deals/new">
          <Button variant="luxe"><Plus className="w-5 h-5 mr-2" />Neuer Deal</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : deals.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <Zap className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Lightning Deals.</p>
            <Link href="/admin/lightning-deals/new">
              <Button variant="luxe" className="mt-4">Ersten Deal anlegen</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deals.map((d) => {
            const p = d.products
            const start = new Date(d.start_at)
            const end = new Date(d.end_at)
            const isActive = now >= start && now <= end
            const remaining = Math.max(0, d.quantity_total - d.quantity_claimed)
            return (
              <Card key={d.deal_id} className="bg-luxe-charcoal border-luxe-gray">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {p?.image_url && (
                      <img src={p.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-medium text-white">{p?.name ?? d.product_id}</p>
                      <p className="text-sm text-luxe-silver">
                        {formatPrice(d.deal_price)} <span className="line-through">{formatPrice(d.original_price)}</span>
                        {' · '}{d.quantity_claimed}/{d.quantity_total} verkauft
                      </p>
                      <p className="text-xs text-luxe-silver mt-0.5">
                        {formatDate(d.start_at)} – {formatDate(d.end_at)}
                      </p>
                      <Badge variant={isActive ? 'default' : d.status === 'scheduled' ? 'secondary' : 'outline'} className="mt-1">
                        {isActive ? 'Aktiv' : d.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/lightning-deals/${d.deal_id}`}>
                      <Button variant="admin-outline" size="sm"><Pencil className="w-4 h-4 mr-1" />Bearbeiten</Button>
                    </Link>
                    <Button variant="admin-outline" size="sm" className="text-red-400" onClick={() => handleDelete(d.deal_id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
