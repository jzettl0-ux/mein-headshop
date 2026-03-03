'use client'

import { useState, useEffect } from 'react'
import { TrendingDown, Loader2, Plus, Play, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const RULE_LABELS: Record<string, string> = {
  MATCH_BUY_BOX: 'Buy Box angleichen',
  STAY_BELOW_BUY_BOX: 'Unter Buy Box bleiben',
  MATCH_LOWEST_PRICE: 'Niedrigsten Preis angleichen',
}

export default function AdminRepricerPage() {
  const { toast } = useToast()
  const [rules, setRules] = useState<any[]>([])
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [form, setForm] = useState({
    offer_id: '',
    vendor_id: '',
    min_price: '0',
    max_price: '999',
    rule_type: 'MATCH_BUY_BOX',
    price_offset: '0',
  })

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/repricer/rules').then((r) => (r.ok ? r.json() : { rules: [] })),
      fetch('/api/admin/repricer/offers').then((r) => (r.ok ? r.json() : { offers: [] })),
    ])
      .then(([rulesData, offersData]) => {
        setRules(rulesData.rules ?? [])
        setOffers(offersData.offers ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleRun = async () => {
    setRunning(true)
    try {
      const res = await fetch('/api/admin/repricer/run', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({ title: `${data.updated ?? 0} Preise aktualisiert` })
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setRunning(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Regel wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/repricer/rules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Fehler')
      toast({ title: 'Regel gelöscht' })
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.offer_id || !form.vendor_id) {
      toast({ title: 'Angebot und Vendor erforderlich', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/admin/repricer/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer_id: form.offer_id,
          vendor_id: form.vendor_id,
          min_price: parseFloat(form.min_price.replace(',', '.')) || 0,
          max_price: parseFloat(form.max_price.replace(',', '.')) || 999,
          rule_type: form.rule_type,
          price_offset: parseFloat(form.price_offset.replace(',', '.')) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({ title: 'Regel angelegt' })
      setForm({ ...form, offer_id: '', vendor_id: '' })
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  const usedOfferIds = new Set(rules.map((r) => r.offer_id))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingDown className="h-7 w-7 text-luxe-primary" />
          Repricer
        </h1>
        <p className="mt-1 text-luxe-silver">
          Automatisierte Preisanpassung: Buy Box angleichen, unter Konkurrenz bleiben. Min/Max als Schutz.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Repricer ausführen</CardTitle>
          <Button onClick={handleRun} disabled={running || rules.length === 0} className="gap-2">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Jetzt ausführen
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-luxe-silver">
            Aktualisiert Preise aller aktiven Regeln basierend auf Konkurrenzpreisen. Guardrails (Min/Max) werden eingehalten.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Neue Regel</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Angebot</label>
              <select
                value={form.offer_id}
                onChange={(e) => {
                  const o = offers.find((x: any) => x.id === e.target.value)
                  setForm({
                    ...form,
                    offer_id: e.target.value,
                    vendor_id: o?.vendor_id ?? form.vendor_id,
                  })
                }}
                className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
              >
                <option value="">— Angebot wählen —</option>
                {offers
                  .filter((o: any) => !usedOfferIds.has(o.id))
                  .map((o: any) => (
                    <option key={o.id} value={o.id}>
                      {o.products?.name ?? o.product_id?.slice(0, 8)} · {o.vendor_accounts?.company_name ?? o.vendor_id?.slice(0, 8)} · {Number(o.unit_price).toFixed(2)} €
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Vendor ID</label>
              <input
                value={form.vendor_id}
                onChange={(e) => setForm({ ...form, vendor_id: e.target.value })}
                className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                placeholder="UUID"
              />
            </div>
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Regeltyp</label>
              <select
                value={form.rule_type}
                onChange={(e) => setForm({ ...form, rule_type: e.target.value })}
                className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
              >
                {Object.entries(RULE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Min-Preis (€)</label>
              <input
                type="text"
                value={form.min_price}
                onChange={(e) => setForm({ ...form, min_price: e.target.value })}
                className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Max-Preis (€)</label>
              <input
                type="text"
                value={form.max_price}
                onChange={(e) => setForm({ ...form, max_price: e.target.value })}
                className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Preis-Offset (€)</label>
              <input
                type="text"
                value={form.price_offset}
                onChange={(e) => setForm({ ...form, price_offset: e.target.value })}
                className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" className="gap-2">
                <Plus className="h-4 w-4" /> Regel anlegen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Regeln</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-luxe-silver" />
            </div>
          ) : rules.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">
              Keine Regeln. Lege eine an oder importiere Vendor-Angebote.
            </p>
          ) : (
            <div className="space-y-3">
              {rules.map((r: any) => (
                <div
                  key={r.rule_id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray"
                >
                  <div>
                    <p className="text-white font-medium">
                      {r.vendor_offers?.products?.name ?? r.offer_id?.slice(0, 8)} · {r.vendor_accounts?.company_name ?? r.vendor_id?.slice(0, 8)}
                    </p>
                    <p className="text-sm text-luxe-silver">
                      {RULE_LABELS[r.rule_type] ?? r.rule_type} · {Number(r.min_price).toFixed(2)}–{Number(r.max_price).toFixed(2)} €
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.is_active ? 'default' : 'secondary'}>
                      {r.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(r.rule_id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
