'use client'

import { useState, useEffect } from 'react'
import { Truck, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

export default function AdminBlendedShippingPage() {
  const [list, setList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    cart_vendor_count: '2',
    customer_shipping_fee: '5.99',
    vendor_subsidy_percentage: '50',
  })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/blended-shipping')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    load()
    setLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/blended-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_vendor_count: parseInt(form.cart_vendor_count, 10) || 1,
          customer_shipping_fee: parseFloat(form.customer_shipping_fee) || 0,
          vendor_subsidy_percentage: parseFloat(form.vendor_subsidy_percentage) || 0,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Fehler')
      }
      load()
      setShowForm(false)
      toast({ title: 'Blended-Shipping-Regel angelegt' })
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
            <Truck className="w-7 h-7 text-luxe-gold" />
            Blended Shipping Rules
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Mischkalkulation bei Multi-Vendor-Warenkorb
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neue Regel'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Anzahl Vendors im Warenkorb</label>
                <input
                  type="number"
                  min="1"
                  value={form.cart_vendor_count}
                  onChange={(e) => setForm((f) => ({ ...f, cart_vendor_count: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Versandkosten Kunde (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.customer_shipping_fee}
                  onChange={(e) => setForm((f) => ({ ...f, customer_shipping_fee: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Vendor-Subvention (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.vendor_subsidy_percentage}
                  onChange={(e) => setForm((f) => ({ ...f, vendor_subsidy_percentage: e.target.value }))}
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
            <Truck className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Blended-Shipping-Regeln.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((r) => (
            <Card key={r.rule_id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="py-3 flex flex-row items-center justify-between">
                <div>
                  <p className="font-medium text-white">{r.cart_vendor_count} Vendor(s) im Warenkorb</p>
                  <p className="text-sm text-luxe-silver">
                    Kunde zahlt {formatPrice(r.customer_shipping_fee)} · Vendor-Subvention {Number(r.vendor_subsidy_percentage)}%
                  </p>
                </div>
                {r.is_active ? (
                  <span className="text-emerald-500 text-sm">Aktiv</span>
                ) : (
                  <span className="text-luxe-silver text-sm">Inaktiv</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
