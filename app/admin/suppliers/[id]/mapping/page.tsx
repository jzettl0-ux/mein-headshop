'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Loader2, Save, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface ProductRow {
  id: string
  name: string
  supplier_sku: string | null
  supplier_product_name: string | null
  cost_price: number | null
}

export default function SupplierMappingPage() {
  const params = useParams()
  const id = (typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '') ?? ''
  const [supplierName, setSupplierName] = useState<string>('')
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [edits, setEdits] = useState<Record<string, { supplier_sku: string; supplier_product_name: string }>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    Promise.all([
      fetch(`/api/admin/suppliers/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/admin/suppliers/${id}/products`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([supplier, prods]) => {
      setSupplierName(supplier?.name ?? '')
      setProducts(Array.isArray(prods) ? prods : [])
      const initial: Record<string, { supplier_sku: string; supplier_product_name: string }> = {}
      for (const p of Array.isArray(prods) ? prods : []) {
        initial[p.id] = {
          supplier_sku: p.supplier_sku ?? '',
          supplier_product_name: p.supplier_product_name ?? '',
        }
      }
      setEdits(initial)
    }).finally(() => setLoading(false))
  }, [id])

  const handleSave = async (productId: string) => {
    const e = edits[productId]
    if (!e) return
    setSavingId(productId)
    try {
      const res = await fetch(`/api/admin/suppliers/${id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          supplier_sku: e.supplier_sku.trim() || null,
          supplier_product_name: e.supplier_product_name.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, supplier_sku: e.supplier_sku.trim() || null, supplier_product_name: e.supplier_product_name.trim() || null }
            : p
        )
      )
      toast({ title: 'Gespeichert', description: 'Lieferanten-SKU gespeichert. One-Click-Fulfillment nutzt diese Daten.' })
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center admin-area">
        <div className="flex items-center gap-2 text-[var(--luxe-silver,#4A6B4A)]">
          <Loader2 className="w-6 h-6 animate-spin" />
          Lade Mapping…
        </div>
      </div>
    )
  }

  return (
    <div className="admin-area min-h-[60vh]">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <Link
          href={`/admin/suppliers/${id}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--luxe-silver)] hover:text-[var(--luxe-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zu {supplierName || 'Lieferant'}
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--luxe-charcoal,#1a2e1a)] flex items-center gap-2">
            <Package className="w-7 h-7 text-[var(--luxe-primary)]" />
            SKU-Mapping-Center
          </h1>
          <p className="text-sm text-[var(--luxe-silver)] mt-1">
            Verknüpfe Shop-Produkte mit den Artikelnummern (SKUs) des Lieferanten. Jede Bestellung an den Lieferanten nutzt automatisch diese Daten beim „An Lieferanten übermitteln“.
          </p>
        </div>

        <Card className="bg-[var(--luxe-charcoal)] border border-[var(--luxe-gray)] shadow-sm overflow-hidden">
          <CardHeader className="border-b border-[var(--luxe-gray)]">
            <CardTitle className="text-[var(--luxe-charcoal)] text-lg">{supplierName || 'Lieferant'}</CardTitle>
            <p className="text-sm text-[var(--luxe-silver)] font-normal">
              Nur Produkte, die diesem Lieferanten zugeordnet sind (Produkt-Stammdaten → Lieferant), erscheinen hier. Speichern schreibt in die Lieferanten-Mapping-Tabelle – E-Mail/API nutzen diese SKUs.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {products.length === 0 ? (
              <div className="py-12 text-center text-[var(--luxe-silver)]">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Keine Produkte diesem Lieferanten zugeordnet.</p>
                <p className="text-sm mt-1">
                  In der <Link href="/admin/products" className="text-[var(--luxe-primary)] underline hover:no-underline">Produktverwaltung</Link> beim jeweiligen Produkt den Lieferanten auswählen, dann erscheint es hier.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--luxe-gray)] bg-[var(--luxe-gray)]/50">
                      <th className="text-left font-semibold text-[var(--luxe-charcoal)] py-3 px-4">Produkt (Shop)</th>
                      <th className="text-left font-semibold text-[var(--luxe-charcoal)] py-3 px-4">Supplier SKU</th>
                      <th className="text-left font-semibold text-[var(--luxe-charcoal)] py-3 px-4">Supplier Produktname</th>
                      <th className="text-right font-semibold text-[var(--luxe-charcoal)] py-3 px-4">Einkaufspreis</th>
                      <th className="text-right font-semibold text-[var(--luxe-charcoal)] py-3 px-4 w-[180px]">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-[var(--luxe-gray)]/70 hover:bg-[var(--luxe-gray)]/30">
                        <td className="py-3 px-4">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="font-medium text-[var(--luxe-charcoal)] hover:text-[var(--luxe-primary)] inline-flex items-center gap-1"
                          >
                            {p.name}
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            value={edits[p.id]?.supplier_sku ?? ''}
                            onChange={(e) =>
                              setEdits((prev) => ({
                                ...prev,
                                [p.id]: { ...(prev[p.id] ?? { supplier_sku: '', supplier_product_name: '' }), supplier_sku: e.target.value },
                              }))
                            }
                            placeholder="Artikelnummer beim Lieferanten"
                            className="h-9 bg-[var(--luxe-black)] border-[var(--luxe-gray)] text-[var(--luxe-charcoal)] placeholder:text-[var(--luxe-silver)]"
                          />
                        </td>
                        <td className="py-2 px-4">
                          <Input
                            value={edits[p.id]?.supplier_product_name ?? ''}
                            onChange={(e) =>
                              setEdits((prev) => ({
                                ...prev,
                                [p.id]: { ...(prev[p.id] ?? { supplier_sku: '', supplier_product_name: '' }), supplier_product_name: e.target.value },
                              }))
                            }
                            placeholder="Bezeichnung beim Lieferanten"
                            className="h-9 bg-[var(--luxe-black)] border-[var(--luxe-gray)] text-[var(--luxe-charcoal)] placeholder:text-[var(--luxe-silver)]"
                          />
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--luxe-silver)]">
                          {p.cost_price != null ? `${Number(p.cost_price).toFixed(2)} €` : '—'}
                        </td>
                        <td className="py-2 px-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[var(--luxe-primary)] text-[var(--luxe-primary)] hover:bg-[var(--luxe-primary)]/10"
                            disabled={savingId === p.id}
                            onClick={() => handleSave(p.id)}
                          >
                            {savingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                            Speichern
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-[var(--luxe-silver)] mt-4">
          One-Click-Fulfillment: In der Bestellansicht „An Lieferanten übermitteln“ nutzt automatisch die hier hinterlegten Supplier-SKUs und -Namen (E-Mail oder API).
        </p>
      </div>
    </div>
  )
}
