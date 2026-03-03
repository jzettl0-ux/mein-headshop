'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Loader2, Upload } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Supplier = { id: string; name: string }
type Product = { id: string; name: string; slug: string; default_bundle_size?: number | null }

type LineItem = {
  id: string
  product_id: string
  product_name: string
  description: string
  quantity: string
  unit_price_eur: string
  isProduct: boolean
  isBundle: boolean
  bundleSize: string
  bundleCount: string
}

export default function AdminOperationsNewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [supplierId, setSupplierId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [invoicePdfUrl, setInvoicePdfUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [addToStockImmediately, setAddToStockImmediately] = useState(false)

  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), product_id: '', product_name: '', description: '', quantity: '1', unit_price_eur: '', isProduct: false, isBundle: false, bundleSize: '', bundleCount: '1' },
  ])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/suppliers').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/admin/products/list').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([s, p]) => {
        setSuppliers(Array.isArray(s) ? s : [])
        setProducts(Array.isArray(p) ? p : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), product_id: '', product_name: '', description: '', quantity: '1', unit_price_eur: '', isProduct: false, isBundle: false, bundleSize: '', bundleCount: '1' },
    ])
  }

  const removeItem = (id: string) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const updateItem = (id: string, field: keyof LineItem, value: string | boolean) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const next = { ...i, [field]: value }
        if (field === 'product_id') {
          const p = products.find((x) => x.id === value)
          next.product_name = p ? p.name : ''
          next.description = p ? p.name : next.description
          next.isProduct = !!p
          if (p?.default_bundle_size != null && p.default_bundle_size > 0) {
            next.bundleSize = String(p.default_bundle_size)
            next.isBundle = true
          } else {
            next.bundleSize = ''
            next.bundleCount = '1'
          }
        }
        if (field === 'description' && !next.isProduct) {
          next.product_id = ''
          next.product_name = ''
        }
        if (field === 'isBundle' && value === false) {
          next.bundleSize = ''
          next.bundleCount = '1'
        }
        return next
      })
    )
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') {
      toast({ title: 'Bitte eine PDF-Datei wählen', variant: 'destructive' })
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/finances/expenses/upload', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Upload fehlgeschlagen', description: data.error, variant: 'destructive' })
        return
      }
      if (data.url) {
        setInvoicePdfUrl(data.url)
        toast({ title: 'Rechnung hochgeladen', description: 'Die URL wurde übernommen.' })
      }
    } catch {
      toast({ title: 'Upload fehlgeschlagen', variant: 'destructive' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = items
      .filter((i) => {
        const q = effectiveQuantity(i)
        return (i.description?.trim() || i.product_name?.trim()) && q > 0 && Number(i.unit_price_eur) >= 0
      })
      .map((i) => {
        const q = effectiveQuantity(i)
        const payload: {
          product_id: string | null
          description: string
          quantity: number
          unit_price_eur: number
          bundle_size?: number
          bundle_count?: number
        } = {
          product_id: i.isProduct && i.product_id ? i.product_id : null,
          description: i.description?.trim() || i.product_name || 'Position',
          quantity: q,
          unit_price_eur: Number(i.unit_price_eur) || 0,
        }
        if (i.isBundle && Number(i.bundleSize) > 0 && Number(i.bundleCount) > 0) {
          payload.bundle_size = Number(i.bundleSize)
          payload.bundle_count = Number(i.bundleCount)
        }
        return payload
      })
    if (validItems.length === 0) {
      toast({ title: 'Mindestens eine gültige Position', description: 'Beschreibung oder Produkt, Menge und Preis eingeben.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: supplierId || null,
          invoice_number: invoiceNumber.trim() || null,
          invoice_date: invoiceDate,
          type: 'wareneinkauf',
          invoice_pdf_url: invoicePdfUrl.trim() || null,
          notes: notes.trim() || null,
          add_to_stock_immediately: addToStockImmediately,
          items: validItems,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({
        title: 'Einkauf erfasst',
        description: addToStockImmediately && validItems.some((i) => i.product_id)
          ? 'Bestand erhöht und Einkaufspreis aktualisiert bei verknüpften Produkten.'
          : validItems.some((i) => i.product_id)
            ? 'Einkauf gespeichert. Bestand im Wareneingang buchen, sobald die Ware da ist.'
            : undefined,
      })
      router.push('/admin/operations')
    } catch {
      toast({ title: 'Speichern fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const effectiveQuantity = (i: LineItem) =>
    i.isBundle && Number(i.bundleSize) > 0 && Number(i.bundleCount) > 0
      ? Number(i.bundleSize) * Number(i.bundleCount)
      : Number(i.quantity) || 0
  const total = items.reduce((s, i) => s + effectiveQuantity(i) * (Number(i.unit_price_eur) || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-white/80">
        <Loader2 className="w-6 h-6 animate-spin" />
        Lade Lieferanten und Produkte…
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <Link href="/admin/operations" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Zurück zur Übersicht
      </Link>

      <h1 className="text-2xl font-bold text-white">Neuer Produkt-Einkauf</h1>
      <p className="text-white/80 text-sm">Produkte mit Lieferant erfassen. Bestand und Einkaufspreis werden automatisch aktualisiert. Sonstige Ausgaben (Verpackung, Miete, Werbung) unter Ausgaben (BWA).</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Grunddaten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white/90">Lieferant</Label>
                <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="mt-1 w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white">
                  <option value="">– Keiner –</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-white/90">Rechnungsdatum</Label>
                <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="mt-1 bg-luxe-black border-luxe-gray text-white" />
              </div>
              <div>
                <Label className="text-white/90">Rechnungsnummer (optional)</Label>
                <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="z.B. RE-2026-001" className="mt-1 bg-luxe-black border-luxe-gray text-white" />
              </div>
            </div>
            <div>
              <Label className="text-white/90">Rechnungs-PDF</Label>
              <p className="text-xs text-white/60 mt-0.5 mb-2">Optional: PDF vom PC hochladen – erhaelt eine Internetadresse</p>
              <div className="flex gap-2">
                <Input value={invoicePdfUrl} onChange={(e) => setInvoicePdfUrl(e.target.value)} placeholder="URL oder per Upload" className="flex-1 bg-luxe-black border-luxe-gray text-white" />
                <input type="file" ref={fileInputRef} accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
                <Button type="button" variant="admin-outline" className="shrink-0" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? ' Lädt…' : ' Hochladen'}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-white/90">Notizen (optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Z.B. Lieferzeit, Besonderheiten" className="mt-1 bg-luxe-black border-luxe-gray text-white" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="add-to-stock"
                checked={addToStockImmediately}
                onChange={(e) => setAddToStockImmediately(e.target.checked)}
                className="rounded border-luxe-gray bg-luxe-charcoal text-luxe-gold"
              />
              <Label htmlFor="add-to-stock" className="text-white/90 cursor-pointer">
                Bestand sofort erhöhen (ansonsten erst im Wareneingang buchen, wenn die Ware da ist)
              </Label>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Positionen</CardTitle>
            <Button type="button" variant="admin-outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-1" /> Position
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-white/70 mb-4">Produkt auswählen: Bestand und Einkaufspreis werden automatisch aktualisiert. Freitext nur für Produkte, die noch nicht angelegt sind.</p>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex flex-wrap gap-2 items-end p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray/50">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-white/70">Produkt oder Freitext</Label>
                    <select
                      value={item.product_id}
                      onChange={(e) => {
                        const v = e.target.value
                        updateItem(item.id, 'product_id', v)
                        if (v) updateItem(item.id, 'isProduct', true)
                        else updateItem(item.id, 'isProduct', false)
                      }}
                      className="mt-1 w-full rounded-md border border-luxe-gray bg-luxe-charcoal px-3 py-2 text-sm text-white"
                    >
                      <option value="">– Freitext –</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {!item.isProduct && (
                      <Input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="z.B. 1000x Versandkartons" className="mt-1 bg-luxe-charcoal border-luxe-gray text-white" />
                    )}
                  </div>
                  {item.isProduct && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`bundle-${item.id}`}
                        checked={item.isBundle}
                        onChange={(e) => updateItem(item.id, 'isBundle', e.target.checked)}
                        className="rounded border-luxe-gray bg-luxe-charcoal text-luxe-gold"
                      />
                      <Label htmlFor={`bundle-${item.id}`} className="text-xs text-white/70 cursor-pointer">Als Bundle</Label>
                    </div>
                  )}
                  {item.isProduct && item.isBundle ? (
                    <>
                      <div className="w-24">
                        <Label className="text-xs text-white/70">Stück/Bundle</Label>
                        <Input type="number" min={1} step="1" value={item.bundleSize} onChange={(e) => updateItem(item.id, 'bundleSize', e.target.value)} className="mt-1 bg-luxe-charcoal border-luxe-gray text-white" />
                      </div>
                      <div className="w-24">
                        <Label className="text-xs text-white/70">Anzahl Bundles</Label>
                        <Input type="number" min={1} step="1" value={item.bundleCount} onChange={(e) => updateItem(item.id, 'bundleCount', e.target.value)} className="mt-1 bg-luxe-charcoal border-luxe-gray text-white" />
                      </div>
                      <div className="self-end pb-2 text-sm text-white/70">
                        = {effectiveQuantity(item)} Stück (für Bestand)
                      </div>
                    </>
                  ) : (
                    <div className="w-20">
                      <Label className="text-xs text-white/70">Menge (Stück)</Label>
                      <Input type="number" min={0} step="0.001" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} className="mt-1 bg-luxe-charcoal border-luxe-gray text-white" />
                    </div>
                  )}
                  <div className="w-28">
                    <Label className="text-xs text-white/70">Einzelpreis EUR</Label>
                    <Input type="number" min={0} step="0.01" value={item.unit_price_eur} onChange={(e) => updateItem(item.id, 'unit_price_eur', e.target.value)} className="mt-1 bg-luxe-charcoal border-luxe-gray text-white" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.id)} disabled={items.length <= 1} className="text-white/60 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm font-medium text-white">Summe: {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(total)}</p>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" variant="luxe" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Einkauf speichern
          </Button>
          <Link href="/admin/operations">
            <Button type="button" variant="admin-outline">Abbrechen</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
