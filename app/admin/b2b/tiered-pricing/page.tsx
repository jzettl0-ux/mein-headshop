'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Percent, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

export default function AdminB2BTieredPricingPage() {
  const [tiers, setTiers] = useState<any[]>([])
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [productId, setProductId] = useState('')
  const [minQty, setMinQty] = useState('10')
  const [unitPrice, setUnitPrice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/b2b/tiered-pricing')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setTiers(Array.isArray(data) ? data : []))
      .catch(() => setTiers([]))
    fetch('/api/admin/products/list')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(minQty, 10)
    const price = parseFloat(unitPrice)
    if (!productId || qty < 1 || isNaN(price) || price < 0) {
      toast({ title: 'Produkt, Mindestmenge (≥1) und Preis eingeben', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/b2b/tiered-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, min_quantity: qty, unit_price: price }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'Staffelpreis angelegt' })
      setProductId('')
      setMinQty('10')
      setUnitPrice('')
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Staffelpreis löschen?')) return
    try {
      const res = await fetch(`/api/admin/b2b/tiered-pricing/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setTiers((prev) => prev.filter((t) => t.id !== id))
      toast({ title: 'Gelöscht' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/b2b" className="inline-flex items-center text-luxe-silver hover:text-white">
        ← Zurück zu B2B-Konten
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Percent className="w-7 h-7 text-luxe-gold" />
          Staffelpreise
        </h1>
        <p className="text-luxe-silver text-sm mt-1">
          B2B-Kunden erhalten ab der Mindestmenge den Staffelpreis. Sortiert nach Menge – höchste passende Stufe gewinnt.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label className="text-luxe-silver">Produkt</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white mt-1">
                  <SelectValue placeholder="Produkt wählen" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-luxe-silver">Ab Menge (Stück)</Label>
              <Input type="number" min={1} value={minQty} onChange={(e) => setMinQty(e.target.value)} className="bg-luxe-black border-luxe-gray text-white mt-1" />
            </div>
            <div>
              <Label className="text-luxe-silver">Preis pro Stück (€)</Label>
              <Input type="number" step="0.01" min={0} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="bg-luxe-black border-luxe-gray text-white mt-1" />
            </div>
            <Button type="submit" variant="luxe" disabled={submitting}>
              {submitting ? '…' : <><Plus className="w-4 h-4 mr-2" />Staffelpreis anlegen</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Aktuelle Staffelpreise</h2>
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        ) : tiers.length === 0 ? (
          <p className="text-luxe-silver">Noch keine Staffelpreise.</p>
        ) : (
          <div className="space-y-2">
            {tiers.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-luxe-black/50">
                <span className="text-white">{t.products?.name ?? t.product_id} · ab {t.min_quantity} Stück: {formatPrice(t.unit_price)}/Stück</span>
                <Button size="sm" variant="admin-outline" className="text-red-400" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
