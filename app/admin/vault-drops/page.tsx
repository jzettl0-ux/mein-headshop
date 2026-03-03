'use client'

import { useState, useEffect } from 'react'
import { Lock, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

export default function AdminVaultDropsPage() {
  const [drops, setDrops] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({
    product_id: '',
    drop_price: '',
    total_units_available: '10',
    start_timestamp: '',
    end_timestamp: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/vault-drops').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/admin/products/list').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([dropsData, productsData]) => {
        setDrops(Array.isArray(dropsData) ? dropsData : [])
        setProducts(Array.isArray(productsData) ? productsData : [])
      })
      .catch(() => setDrops([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.product_id || !form.drop_price || !form.start_timestamp || !form.end_timestamp) {
      toast({ title: 'Alle Felder ausfüllen', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/vault-drops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: form.product_id,
          drop_price: parseFloat(form.drop_price),
          total_units_available: parseInt(form.total_units_available, 10) || 10,
          start_timestamp: form.start_timestamp,
          end_timestamp: form.end_timestamp,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Fehler')
      }
      const data = await res.json()
      setDrops((prev) => [data, ...prev])
      setForm({ product_id: '', drop_price: '', total_units_available: '10', start_timestamp: '', end_timestamp: '' })
      setShowNew(false)
      toast({ title: '4:20 Vault Drop angelegt' })
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Vault Drop wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/vault-drops/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setDrops((prev) => prev.filter((d) => d.drop_id !== id))
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
            <Lock className="w-7 h-7 text-luxe-gold" />
            4:20 Vault Drops
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Zeitlich begrenzte Drops mit Countdown und Live-Inventar
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowNew(!showNew)}>
          <Plus className="w-5 h-5 mr-2" />
          {showNew ? 'Abbrechen' : 'Neuer Drop'}
        </Button>
      </div>

      {showNew && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">Produkt</label>
                  <select
                    value={form.product_id}
                    onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                    className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                    required
                  >
                    <option value="">Produkt wählen</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} – {formatPrice(p.price)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">Drop-Preis (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.drop_price}
                    onChange={(e) => setForm((f) => ({ ...f, drop_price: e.target.value }))}
                    className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">Einheiten</label>
                  <input
                    type="number"
                    min="1"
                    value={form.total_units_available}
                    onChange={(e) => setForm((f) => ({ ...f, total_units_available: e.target.value }))}
                    className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">Start (UTC)</label>
                  <input
                    type="datetime-local"
                    value={form.start_timestamp?.slice(0, 16)}
                    onChange={(e) => setForm((f) => ({ ...f, start_timestamp: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                    className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">Ende (UTC)</label>
                  <input
                    type="datetime-local"
                    value={form.end_timestamp?.slice(0, 16)}
                    onChange={(e) => setForm((f) => ({ ...f, end_timestamp: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                    className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="luxe" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Drop anlegen
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : drops.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <Lock className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Vault Drops.</p>
            <Button variant="luxe" className="mt-4" onClick={() => setShowNew(true)}>
              Ersten Drop anlegen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {drops.map((d) => {
            const p = d.products
            const start = new Date(d.start_timestamp)
            const end = new Date(d.end_timestamp)
            const isActive = now >= start && now <= end
            const remaining = Math.max(0, (d.total_units_available ?? 0) - (d.units_sold ?? 0))
            return (
              <Card key={d.drop_id} className="bg-luxe-charcoal border-luxe-gray">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {p?.image_url && (
                        <img src={p.image_url} alt="" className="w-16 h-16 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium text-white">{p?.name ?? 'Produkt'}</p>
                        <p className="text-luxe-gold text-lg font-bold">{formatPrice(d.drop_price)}</p>
                        <p className="text-sm text-luxe-silver">
                          {remaining} / {d.total_units_available} verfügbar · {formatDate(d.start_timestamp)} – {formatDate(d.end_timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isActive ? 'default' : 'secondary'}>
                        {d.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400"
                        onClick={() => handleDelete(d.drop_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
