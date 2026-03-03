'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktiv',
  PAUSED: 'Pausiert',
  CANCELLED: 'Gekündigt',
}

interface Sub {
  subscription_id: string
  customer_id: string
  product_id: string
  quantity: number
  interval_days: number
  discount_percentage: number
  next_order_date: string
  status: string
  created_at: string
  product?: { id: string; name: string; slug: string; image_url?: string } | null
}

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('_all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const url = statusFilter && statusFilter !== '_all' ? `/api/admin/subscriptions?status=${statusFilter}` : '/api/admin/subscriptions'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Laden fehlgeschlagen')
      const data = await res.json()
      setSubs(Array.isArray(data) ? data : [])
    } catch {
      setSubs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  const handleStatusChange = async (id: string, status: string) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Aktualisierung fehlgeschlagen')
      }
      setSubs((prev) => prev.map((s) => (s.subscription_id === id ? { ...s, status } : s)))
      toast({ title: 'Status aktualisiert' })
    } catch (e: unknown) {
      toast({ title: e instanceof Error ? e.message : 'Fehler', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString('de-DE')
  const filtered = subs

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center">
          <RefreshCw className="w-7 h-7 mr-2 text-luxe-gold" />
          Subscribe & Save (Abos)
        </h1>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-luxe-charcoal border-luxe-gray text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Alle</SelectItem>
              <SelectItem value="ACTIVE">Aktiv</SelectItem>
              <SelectItem value="PAUSED">Pausiert</SelectItem>
              <SelectItem value="CANCELLED">Gekündigt</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="admin-outline" size="icon" onClick={() => load()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      <p className="text-luxe-silver text-sm">
        Spar-Abos mit Rabatt. Nächste Lieferung wird per Cron (process-subscriptions) generiert.
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Abos{statusFilter !== '_all' ? ' mit diesem Status' : ''} vorhanden.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <Card key={s.subscription_id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-white">{s.product?.name ?? s.product_id}</span>
                    <Badge variant={s.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-luxe-silver">
                    Menge: {s.quantity} · alle {s.interval_days} Tage · {s.discount_percentage} % Rabatt · nächste Lieferung: {formatDate(s.next_order_date)}
                  </p>
                  <p className="text-xs text-luxe-silver/80">Kunde: {s.customer_id.slice(0, 8)}…</p>
                </div>
                {s.status !== 'CANCELLED' && (
                  <Select
                    value={s.status}
                    onValueChange={(v) => handleStatusChange(s.subscription_id, v)}
                    disabled={updatingId === s.subscription_id}
                  >
                    <SelectTrigger className="w-40 bg-luxe-black border-luxe-gray text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Aktiv</SelectItem>
                      <SelectItem value="PAUSED">Pausieren</SelectItem>
                      <SelectItem value="CANCELLED">Kündigen</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
