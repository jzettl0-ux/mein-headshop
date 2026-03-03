'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Truck, ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

const STATUS_OPTIONS = [
  { value: 'RECEIVED', label: 'Eingegangen' },
  { value: 'PLANNING', label: 'In Planung' },
  { value: 'SHIPPED', label: 'Versendet' },
  { value: 'DELIVERED', label: 'Zugestellt' },
  { value: 'UNFULFILLABLE', label: 'Nicht lieferbar' },
]

export default function AdminMcfOrderDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const id = typeof params?.id === 'string' ? params.id : ''
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/mcf/orders/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((o) => {
        setOrder(o)
        if (o) {
          setStatus(o.status ?? '')
          setTrackingNumber(o.tracking_number ?? '')
        }
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/mcf/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status || undefined,
          tracking_number: trackingNumber || undefined,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      const updated = await res.json()
      setOrder(updated)
      toast({ title: 'Gespeichert' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !order) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-luxe-primary" />
      </div>
    )
  }

  const addr = order.shipping_address ?? {}
  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div className="space-y-8">
      <Link href="/admin/mcf" className="inline-flex items-center gap-2 text-luxe-silver hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Zurück zu MCF
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Truck className="h-7 w-7 text-luxe-primary" />
          {order.external_order_reference}
        </h1>
        <p className="mt-1 text-luxe-silver">
          {order.vendor_accounts?.company_name ?? order.vendor_id?.slice(0, 8)} · {new Date(order.created_at).toLocaleString('de-DE')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Lieferadresse</CardTitle>
          </CardHeader>
          <CardContent className="text-luxe-silver text-sm space-y-1">
            <p>{addr.name ?? addr.street ?? '-'}</p>
            <p>{addr.street ?? ''} {addr.house_number ?? ''}</p>
            <p>{addr.postal_code ?? ''} {addr.city ?? ''}</p>
            <p>{addr.country ?? 'DE'}</p>
          </CardContent>
        </Card>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Bearbeiten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Sendungsnummer</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                placeholder="z. B. 00340434161234567890"
              />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {items.length > 0 && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Positionen</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {items.map((it: any, i: number) => (
                <li key={i} className="text-luxe-silver text-sm">
                  {it.sku ?? it.product_id ?? '?'} · {it.quantity ?? 0} Stück
                  {it.unit_price != null && ` · ${Number(it.unit_price).toFixed(2)} €`}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
