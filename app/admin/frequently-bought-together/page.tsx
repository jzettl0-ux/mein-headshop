'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function AdminFBTPage() {
  const [list, setList] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    anchor_product_id: '',
    associated_product_id: '',
    bundle_discount_percentage: '5',
  })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/frequently-bought-together')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/frequently-bought-together').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/admin/products/list').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([fbt, prods]) => {
        setList(Array.isArray(fbt) ? fbt : [])
        setProducts(Array.isArray(prods) ? prods : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.anchor_product_id || !form.associated_product_id) {
      toast({ title: 'Beide Produkte wählen', variant: 'destructive' })
      return
    }
    if (form.anchor_product_id === form.associated_product_id) {
      toast({ title: 'Anchor und Assoziiertes Produkt müssen unterschiedlich sein', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/frequently-bought-together', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anchor_product_id: form.anchor_product_id,
          associated_product_id: form.associated_product_id,
          bundle_discount_percentage: parseFloat(form.bundle_discount_percentage) || 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Fehler')
      }
      load()
      setForm({ anchor_product_id: '', associated_product_id: '', bundle_discount_percentage: '5' })
      setShowForm(false)
      toast({ title: 'FBT-Verbindung angelegt' })
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-7 h-7 text-luxe-gold" />
            Frequently Bought Together
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Wird oft zusammen gekauft – manuell oder aus Transaktionen
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Verbindung hinzufügen'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Anchor-Produkt (Hauptartikel)</label>
                <select
                  value={form.anchor_product_id}
                  onChange={(e) => setForm((f) => ({ ...f, anchor_product_id: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                  required
                >
                  <option value="">Produkt wählen</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Assoziiertes Produkt („wird oft zusammen gekauft“)</label>
                <select
                  value={form.associated_product_id}
                  onChange={(e) => setForm((f) => ({ ...f, associated_product_id: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                  required
                >
                  <option value="">Produkt wählen</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Bundle-Rabatt (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={form.bundle_discount_percentage}
                  onChange={(e) => setForm((f) => ({ ...f, bundle_discount_percentage: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                />
              </div>
              <Button type="submit" variant="luxe" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Speichern
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : list.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <Package className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine FBT-Verbindungen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <Card key={r.association_id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="py-3 flex flex-row items-center justify-between">
                <div>
                  <p className="text-white">
                    <span className="font-medium">{r.anchor_name ?? r.anchor_product_id}</span>
                    {' → '}
                    <span>{r.associated_name ?? r.associated_product_id}</span>
                  </p>
                  <p className="text-sm text-luxe-silver">
                    {r.co_occurrence_count}× gemeinsam gekauft
                    {r.is_virtual_bundle && <Badge variant="secondary" className="ml-2">Manuell</Badge>}
                    {r.bundle_discount_percentage > 0 && ` · ${r.bundle_discount_percentage}% Rabatt`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
