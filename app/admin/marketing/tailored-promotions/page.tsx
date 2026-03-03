'use client'

import { useState, useEffect } from 'react'
import { Gift, Loader2, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

type Promo = {
  promo_id: string
  vendor_id: string | null
  target_audience: string
  discount_percentage: number
  valid_from: string
  valid_until: string
  redemption_limit: number | null
  times_redeemed: number
}

const AUDIENCE_LABELS: Record<string, string> = {
  CART_ABANDONERS: 'Warenkorb-Abbrecher',
  BRAND_FOLLOWERS: 'Marken-Follower',
  REPEAT_CUSTOMERS: 'Stammkunden',
  HIGH_SPENDERS: 'Großkäufer',
}

const AUDIENCE_OPTIONS = [
  { value: 'CART_ABANDONERS', label: 'Warenkorb-Abbrecher' },
  { value: 'BRAND_FOLLOWERS', label: 'Marken-Follower' },
  { value: 'REPEAT_CUSTOMERS', label: 'Stammkunden' },
  { value: 'HIGH_SPENDERS', label: 'Großkäufer' },
]

export default function AdminTailoredPromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    target_audience: 'REPEAT_CUSTOMERS',
    discount_percentage: 10,
    valid_from: '',
    valid_until: '',
    redemption_limit: '' as string | number,
  })
  const { toast } = useToast()

  const load = () => {
    return fetch('/api/admin/brand-tailored-promotions')
      .then((r) => (r.ok ? r.json() : { promos: [] }))
      .then((d) => setPromos(d.promos ?? []))
      .catch(() => setPromos([]))
  }

  useEffect(() => {
    setLoading(true)
    const from = new Date()
    const until = new Date()
    until.setMonth(until.getMonth() + 1)
    setForm((f) => ({
      ...f,
      valid_from: from.toISOString().slice(0, 10),
      valid_until: until.toISOString().slice(0, 10),
    }))
    load().finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.valid_from || !form.valid_until) {
      toast({ title: 'Gültig von/bis ausfüllen', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/brand-tailored-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_audience: form.target_audience,
          discount_percentage: form.discount_percentage,
          valid_from: new Date(form.valid_from).toISOString(),
          valid_until: new Date(form.valid_until).toISOString(),
          redemption_limit: form.redemption_limit === '' ? null : Number(form.redemption_limit),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'Promotion angelegt' })
      setShowForm(false)
      setForm((f) => ({ ...f, discount_percentage: 10 }))
      load()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Gift className="w-6 h-6 text-luxe-gold" />
            Brand Tailored Promotions
          </h1>
          <p className="text-sm text-luxe-silver mt-1">
            Segmente: Warenkorb-Abbrecher, Marken-Follower, Stammkunden, Großkäufer.
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Neue Promotion
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Promotion anlegen (Segment)</h2>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div>
                <label className="text-sm text-luxe-silver block mb-1">Zielgruppe (Segment) *</label>
                <Select value={form.target_audience} onValueChange={(v) => setForm((f) => ({ ...f, target_audience: v }))}>
                  <SelectTrigger className="bg-luxe-black border-luxe-gray text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-luxe-silver block mb-1">Rabatt (%) *</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.discount_percentage}
                  onChange={(e) => setForm((f) => ({ ...f, discount_percentage: Number(e.target.value) || 0 }))}
                  className="w-full rounded bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-luxe-silver block mb-1">Gültig von *</label>
                  <input
                    type="date"
                    value={form.valid_from}
                    onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
                    className="w-full rounded bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-luxe-silver block mb-1">Gültig bis *</label>
                  <input
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
                    className="w-full rounded bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-luxe-silver block mb-1">Einlösungs-Limit (optional)</label>
                <input
                  type="number"
                  min={0}
                  value={form.redemption_limit}
                  onChange={(e) => setForm((f) => ({ ...f, redemption_limit: e.target.value === '' ? '' : Number(e.target.value) }))}
                  placeholder="Unbegrenzt wenn leer"
                  className="w-full rounded bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>Anlegen</Button>
                <Button type="button" variant="admin-outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : promos.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Promotions. Klicke auf „Neue Promotion“ um eine anzulegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Tailored Promotions</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{promos.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {promos.map((p) => (
                <li key={p.promo_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <div>
                    <p className="font-medium text-white">{AUDIENCE_LABELS[p.target_audience] ?? p.target_audience} · {p.discount_percentage} % Rabatt</p>
                    <p className="text-luxe-silver text-xs mt-0.5">
                      {new Date(p.valid_from).toLocaleDateString('de-DE')} – {new Date(p.valid_until).toLocaleDateString('de-DE')}
                      {p.redemption_limit != null && ` · Limit ${p.redemption_limit}`}
                    </p>
                  </div>
                  <span className="text-luxe-silver">{p.times_redeemed} eingelöst</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
