'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABELS: Record<string, string> = {
  SENT: 'Gesendet',
  BOUNCED: 'Bounce',
  REVIEW_LEFT: 'Bewertung abgegeben',
}

type Row = {
  request_id: string
  order_id: string
  order_number?: string | null
  vendor_id: string
  vendor_name?: string | null
  customer_id: string
  delivery_date: string
  requested_at: string
  status: string
}

export default function AdminReviewRequestsPage() {
  const [list, setList] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const { toast } = useToast()

  const load = () => {
    const url = statusFilter ? `/api/admin/review-requests?status=${encodeURIComponent(statusFilter)}` : '/api/admin/review-requests'
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    load()
    setLoading(false)
  }, [statusFilter])

  const updateStatus = async (requestId: string, status: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/review-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Status aktualisiert' })
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Star className="w-7 h-7 text-luxe-primary" />
          Bewertungsanfragen (Review Requests)
        </h1>
        <p className="text-luxe-silver text-sm mt-1">
          Anfragen 5–30 Tage nach Lieferung. Status: Gesendet, Bounce, Bewertung abgegeben.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Anfragen</CardTitle>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded bg-luxe-black border border-luxe-gray text-foreground text-sm"
          >
            <option value="">Alle Status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Keine Bewertungsanfragen. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">customer_engagement.review_requests</code> über Migration angelegt.</p>
          ) : (
            <div className="space-y-2">
              {list.map((r) => (
                <div key={r.request_id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm">{r.order_number ?? r.order_id}</span>
                    {r.order_id && (
                      <Link href={`/admin/orders/${r.order_id}`} className="text-sm text-luxe-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="w-4 h-4" /> Bestellung
                      </Link>
                    )}
                    <span className="text-luxe-silver">{r.vendor_name ?? r.vendor_id}</span>
                    <span className="text-sm">Lieferung: {new Date(r.delivery_date).toLocaleDateString()}</span>
                    <span className="text-sm">Anfrage: {new Date(r.requested_at).toLocaleDateString()}</span>
                    <span className="text-sm">{STATUS_LABELS[r.status] ?? r.status}</span>
                  </div>
                  <div className="flex gap-2">
                    {r.status !== 'SENT' && (
                      <Button variant="outline" size="sm" disabled={saving} onClick={() => updateStatus(r.request_id, 'SENT')}>
                        Als gesendet
                      </Button>
                    )}
                    {r.status !== 'BOUNCED' && (
                      <Button variant="outline" size="sm" disabled={saving} onClick={() => updateStatus(r.request_id, 'BOUNCED')}>
                        Bounce
                      </Button>
                    )}
                    {r.status !== 'REVIEW_LEFT' && (
                      <Button variant="outline" size="sm" disabled={saving} onClick={() => updateStatus(r.request_id, 'REVIEW_LEFT')}>
                        Bewertung
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
