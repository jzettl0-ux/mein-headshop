'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, ArrowLeft, Plus, Trash2, Loader2, FileText, ShoppingCart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface ProductOption {
  id: string
  name: string
  slug: string
}

interface Row {
  product_id: string
  product_name: string
  quantity: string
}

interface OpenPurchaseItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  quantity_pending: number
}

interface OpenPurchase {
  purchase: { id: string; invoice_number: string | null; invoice_date: string; supplier_name: string | null }
  items: OpenPurchaseItem[]
}

type Mode = 'purchase' | 'manual'

export default function WareneingangPage() {
  const [mode, setMode] = useState<Mode>('purchase')
  const [products, setProducts] = useState<ProductOption[]>([])
  const [openPurchases, setOpenPurchases] = useState<OpenPurchase[]>([])
  const [rows, setRows] = useState<Row[]>([{ product_id: '', product_name: '', quantity: '' }])
  const [loading, setLoading] = useState(true)
  const [loadingPurchases, setLoadingPurchases] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/products/list')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/admin/inventory/open-purchases')
      .then((r) => (r.ok ? r.json() : { purchases: [] }))
      .then((data) => setOpenPurchases(data.purchases ?? []))
      .catch(() => setOpenPurchases([]))
      .finally(() => setLoadingPurchases(false))
  }, [])

  const addRow = () => {
    setRows((r) => [...r, { product_id: '', product_name: '', quantity: '' }])
  }

  const removeRow = (index: number) => {
    setRows((r) => r.filter((_, i) => i !== index))
  }

  const setRow = (index: number, field: keyof Row, value: string) => {
    setRows((r) => {
      const next = [...r]
      next[index] = { ...next[index], [field]: value }
      if (field === 'product_id') {
        const p = products.find((x) => x.id === value)
        next[index].product_name = p ? p.name : ''
      }
      return next
    })
  }

  const handleManualSubmit = async () => {
    const entries = rows
      .map((row) => ({
        product_id: row.product_id.trim(),
        quantity: Math.max(0, parseInt(row.quantity, 10) || 0),
      }))
      .filter((e) => e.product_id && e.quantity > 0)
    if (entries.length === 0) {
      toast({ title: 'Keine gültigen Zeilen', description: 'Bitte mindestens ein Produkt und eine Menge eingeben.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/inventory/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Bestand aktualisiert', description: data.message || `Bestand für ${entries.length} Artikel erhöht.` })
      setRows([{ product_id: '', product_name: '', quantity: '' }])
    } catch {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePurchaseSubmit = async (purchaseId: string, itemQuantities: Record<string, number>) => {
    const entries = Object.entries(itemQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([purchase_item_id, quantity]) => ({ purchase_item_id, quantity }))
    if (entries.length === 0) {
      toast({ title: 'Keine Mengen', description: 'Bitte mindestens eine Menge eingeben.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/inventory/receive-from-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchase_id: purchaseId, entries }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Bestand gebucht', description: data.message || 'Bestand aus Einkauf gebucht.' })
      setOpenPurchases((prev) => prev.filter((p) => p.purchase.id !== purchaseId))
    } catch {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-neutral-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        Lade Produkte…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Lager
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
          <Package className="w-7 h-7 text-neutral-600" />
          Wareneingang
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Bestand aus offenen Einkäufen buchen oder manuell hinzufügen – sobald die Ware da ist.
        </p>
      </div>

      {/* Tab-Umschalter */}
      <div className="flex gap-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setMode('purchase')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            mode === 'purchase'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Von Einkauf buchen
            {openPurchases.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full">
                {openPurchases.length}
              </span>
            )}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            mode === 'manual'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Manuell
          </span>
        </button>
      </div>

      {mode === 'purchase' ? (
        <PurchaseMode
          openPurchases={openPurchases}
          loading={loadingPurchases}
          submitting={submitting}
          onSubmit={handlePurchaseSubmit}
        />
      ) : (
        <ManualMode
          products={products}
          rows={rows}
          addRow={addRow}
          removeRow={removeRow}
          setRow={setRow}
          onSubmit={handleManualSubmit}
          submitting={submitting}
        />
      )}
    </div>
  )
}

function PurchaseMode({
  openPurchases,
  loading,
  submitting,
  onSubmit,
}: {
  openPurchases: OpenPurchase[]
  loading: boolean
  submitting: boolean
  onSubmit: (purchaseId: string, itemQuantities: Record<string, number>) => void
}) {
  const [quantities, setQuantities] = useState<Record<string, Record<string, number>>>({})

  useEffect(() => {
    const next: Record<string, Record<string, number>> = {}
    for (const p of openPurchases) {
      next[p.purchase.id] = {}
      for (const it of p.items) {
        next[p.purchase.id][it.id] = it.quantity_pending ?? it.quantity ?? 0
      }
    }
    setQuantities(next)
  }, [openPurchases])

  const setQty = (purchaseId: string, itemId: string, value: number) => {
    setQuantities((q) => ({
      ...q,
      [purchaseId]: { ...(q[purchaseId] ?? {}), [itemId]: value },
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (openPurchases.length === 0) {
    return (
      <Card className="bg-white border border-neutral-200 shadow-sm">
        <CardContent className="py-12 text-center">
          <Package className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-600 font-medium">Keine offenen Einkäufe</p>
          <p className="text-sm text-neutral-500 mt-1">
            Einkäufe, bei denen der Bestand noch nicht gebucht wurde, erscheinen hier. Neuer Einkauf unter Einkauf → Neuer Einkauf (Bestand erst im Wareneingang buchen).
          </p>
          <Link href="/admin/operations/new">
            <Button variant="outline" size="sm" className="mt-4 border-neutral-300">
              Neuer Einkauf
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {openPurchases.map(({ purchase, items }) => {
        const label =
          purchase.invoice_number || new Date(purchase.invoice_date).toLocaleDateString('de-DE') || purchase.id.slice(0, 8)
        return (
          <Card key={purchase.id} className="bg-white border border-neutral-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>
                  {label}
                  {purchase.supplier_name && (
                    <span className="text-sm font-normal text-neutral-500 ml-2">({purchase.supplier_name})</span>
                  )}
                </span>
              </CardTitle>
              <p className="text-sm text-neutral-500 font-normal">
                Positionen aus diesem Einkauf – Mengen ggf. anpassen und buchen.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((it) => {
                const qty = quantities[purchase.id]?.[it.id] ?? it.quantity_pending ?? it.quantity
                return (
                  <div
                    key={it.id}
                    className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <Label className="text-xs text-neutral-500">Produkt</Label>
                      <p className="font-medium text-neutral-900 mt-0.5">{it.product_name}</p>
                    </div>
                    <div className="w-28">
                      <Label className="text-xs text-neutral-500">Menge (max. {it.quantity_pending})</Label>
                      <Input
                        type="number"
                        min={0}
                        max={it.quantity_pending}
                        value={qty}
                        onChange={(e) => setQty(purchase.id, it.id, Math.min(it.quantity_pending, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                        className="mt-0.5 bg-white"
                      />
                    </div>
                  </div>
                )
              })}
              <Button
                onClick={() => onSubmit(purchase.id, quantities[purchase.id] ?? {})}
                disabled={submitting}
                className="bg-neutral-900 hover:bg-neutral-800"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Bestand aus diesem Einkauf buchen
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ManualMode({
  products,
  rows,
  addRow,
  removeRow,
  setRow,
  onSubmit,
  submitting,
}: {
  products: ProductOption[]
  rows: Row[]
  addRow: () => void
  removeRow: (i: number) => void
  setRow: (i: number, f: keyof Row, v: string) => void
  onSubmit: () => void
  submitting: boolean
}) {
  return (
    <Card className="bg-white border border-neutral-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Manuell Bestand hinzufügen</CardTitle>
        <p className="text-sm text-neutral-500 font-normal">
          Produkt wählen und eingegangene Menge eintragen. Mehrere Zeilen möglich.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => (
          <div key={index} className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-xs text-neutral-500">Produkt</Label>
              <select
                value={row.product_id}
                onChange={(e) => setRow(index, 'product_id', e.target.value)}
                className="mt-0.5 w-full px-3 py-2 border border-neutral-300 rounded-md bg-white text-neutral-900 text-sm"
              >
                <option value="">— Produkt wählen —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <Label className="text-xs text-neutral-500">Menge</Label>
              <Input
                type="number"
                min={1}
                value={row.quantity}
                onChange={(e) => setRow(index, 'quantity', e.target.value)}
                placeholder="0"
                className="mt-0.5 bg-white"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-neutral-500 hover:text-red-600 shrink-0"
              onClick={() => removeRow(index)}
              disabled={rows.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={addRow} className="border-neutral-300">
            <Plus className="w-4 h-4 mr-1" />
            Zeile hinzufügen
          </Button>
          <Button onClick={onSubmit} disabled={submitting} className="bg-neutral-900 hover:bg-neutral-800">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Bestand buchen
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
