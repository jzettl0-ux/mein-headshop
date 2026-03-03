'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Truck,
  Loader2,
  ArrowLeft,
  Save,
  User,
  Package,
  Settings,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  Link2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type TabId = 'stammdaten' | 'artikel' | 'produkte' | 'api'

interface Supplier {
  id: string
  name: string
  contact_email?: string | null
  contact_phone?: string | null
  contact_person?: string | null
  order_email?: string | null
  website?: string | null
  notes?: string | null
  minimum_order_value?: number | null
  payment_terms?: string | null
  type?: 'email' | 'api' | 'manual' | null
  api_endpoint?: string | null
  api_key?: string | null
  api_headers?: Record<string, string> | null
  vat_id?: string | null
  bank_iban?: string | null
  bank_bic?: string | null
  bank_holder?: string | null
  shipping_provider?: string | null
}

interface ProductRow {
  id: string
  name: string
  supplier_sku?: string | null
  supplier_product_name?: string | null
  cost_price?: number | null
}

interface SupplierArticle {
  id: string
  supplier_id: string
  supplier_sku: string
  supplier_product_name: string | null
  product_id: string | null
  api_product_id: string | null
  order_url: string | null
  notes: string | null
  product: { id: string; name: string; slug: string } | null
}

export default function AdminSupplierDetailPage() {
  const params = useParams()
  const id = (typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '') ?? ''
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<TabId>('stammdaten')
  const [form, setForm] = useState<Record<string, string | number>>({})
  const [apiHeadersJson, setApiHeadersJson] = useState('{}')
  const [articles, setArticles] = useState<SupplierArticle[]>([])
  const [articlesLoading, setArticlesLoading] = useState(false)
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; slug: string }[]>([])
  const [newArticle, setNewArticle] = useState({ supplier_sku: '', supplier_product_name: '', product_id: '', api_product_id: '', order_url: '', notes: '' })
  const [addingArticle, setAddingArticle] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editArticle, setEditArticle] = useState<Record<string, { supplier_sku?: string; supplier_product_name?: string; product_id?: string; api_product_id?: string; order_url?: string; notes?: string }>>({})
  const { toast } = useToast()

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    Promise.all([
      fetch(`/api/admin/suppliers/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/admin/suppliers/${id}/products`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([sup, prods]) => {
      setSupplier(sup ?? null)
      setProducts(Array.isArray(prods) ? prods : [])
      if (sup) {
        setForm({
          name: sup.name ?? '',
          contact_email: sup.contact_email ?? '',
          contact_phone: sup.contact_phone ?? '',
          contact_person: sup.contact_person ?? '',
          order_email: sup.order_email ?? '',
          website: sup.website ?? '',
          notes: sup.notes ?? '',
          minimum_order_value: sup.minimum_order_value ?? '',
          payment_terms: sup.payment_terms ?? '',
          vat_id: sup.vat_id ?? '',
          bank_iban: sup.bank_iban ?? '',
          bank_bic: sup.bank_bic ?? '',
          bank_holder: sup.bank_holder ?? '',
          shipping_provider: sup.shipping_provider ?? '',
          type: sup.type ?? 'manual',
          api_endpoint: sup.api_endpoint ?? '',
          api_key: sup.api_key ?? '',
        })
        setApiHeadersJson(
          typeof sup.api_headers === 'object' && sup.api_headers !== null
            ? JSON.stringify(sup.api_headers, null, 2)
            : '{}'
        )
      }
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id || tab !== 'artikel') return
    setArticlesLoading(true)
    Promise.all([
      fetch(`/api/admin/suppliers/${id}/articles`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch('/api/admin/products/list').then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ]).then(([arts, prods]) => {
      setArticles(Array.isArray(arts) ? arts : [])
      setAllProducts(Array.isArray(prods) ? prods : [])
    }).finally(() => setArticlesLoading(false))
  }, [id, tab])

  const loadArticles = () => {
    if (!id) return
    fetch(`/api/admin/suppliers/${id}/articles`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setArticles(Array.isArray(data) ? data : []))
      .catch(() => {})
  }

  const handleAddArticle = async () => {
    if (!id || !newArticle.supplier_sku.trim()) {
      toast({ title: 'SKU fehlt', description: 'Supplier SKU ist Pflicht.', variant: 'destructive' })
      return
    }
    setAddingArticle(true)
    try {
      const res = await fetch(`/api/admin/suppliers/${id}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_sku: newArticle.supplier_sku.trim(),
          supplier_product_name: newArticle.supplier_product_name.trim() || null,
          product_id: newArticle.product_id || null,
          api_product_id: newArticle.api_product_id.trim() || null,
          order_url: newArticle.order_url.trim() || null,
          notes: newArticle.notes.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      setNewArticle({ supplier_sku: '', supplier_product_name: '', product_id: '', api_product_id: '', order_url: '', notes: '' })
      loadArticles()
      toast({ title: 'Artikel angelegt', description: 'Lieferanten-Artikel wurde gespeichert.' })
    } finally {
      setAddingArticle(false)
    }
  }

  const handleUpdateArticle = async (articleId: string) => {
    if (!id) return
    const e = editArticle[articleId]
    if (!e) return
    try {
      const res = await fetch(`/api/admin/suppliers/${id}/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_sku: e.supplier_sku?.trim() || undefined,
          supplier_product_name: e.supplier_product_name?.trim() ?? null,
          product_id: e.product_id || null,
          api_product_id: e.api_product_id?.trim() ?? null,
          order_url: e.order_url?.trim() ?? null,
          notes: e.notes?.trim() ?? null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      setEditingId(null)
      setEditArticle((prev) => { const n = { ...prev }; delete n[articleId]; return n })
      loadArticles()
      toast({ title: 'Gespeichert', description: 'Artikel aktualisiert.' })
    } catch {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen.', variant: 'destructive' })
    }
  }

  const handleDeleteArticle = async (articleId: string) => {
    if (!id || !confirm('Diesen Lieferanten-Artikel wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/suppliers/${id}/articles/${articleId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      setEditingId(null)
      loadArticles()
      toast({ title: 'Gelöscht', description: 'Artikel entfernt.' })
    } catch {
      toast({ title: 'Fehler', description: 'Löschen fehlgeschlagen.', variant: 'destructive' })
    }
  }

  const handleSaveStammdaten = async () => {
    if (!id || !supplier) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/suppliers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || undefined,
          email: form.contact_email || undefined,
          contact_phone: form.contact_phone || undefined,
          contact_person: form.contact_person || undefined,
          order_email: form.order_email || undefined,
          website: form.website || undefined,
          notes: form.notes || undefined,
          minimum_order_value: form.minimum_order_value !== '' ? Number(form.minimum_order_value) : undefined,
          payment_terms: form.payment_terms || undefined,
          vat_id: form.vat_id || undefined,
          bank_iban: form.bank_iban || undefined,
          bank_bic: form.bank_bic || undefined,
          bank_holder: form.bank_holder || undefined,
          shipping_provider: form.shipping_provider || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast({ title: 'Fehler', description: d.error || res.statusText, variant: 'destructive' })
        return
      }
      const data = await res.json()
      setSupplier((s) => (s ? { ...s, ...data } : null))
      toast({ title: 'Gespeichert', description: 'Stammdaten aktualisiert.' })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveApi = async () => {
    if (!id) return
    let api_headers: Record<string, string> = {}
    try {
      api_headers = JSON.parse(apiHeadersJson) || {}
    } catch {
      toast({ title: 'Ungültiges JSON', description: 'api_headers muss gültiges JSON sein.', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/suppliers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type || 'manual',
          api_endpoint: form.api_endpoint || undefined,
          api_key: form.api_key || undefined,
          api_headers,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast({ title: 'Fehler', description: d.error || res.statusText, variant: 'destructive' })
        return
      }
      const data = await res.json()
      setSupplier((s) => (s ? { ...s, ...data } : null))
      toast({ title: 'Gespeichert', description: 'API-Einstellungen aktualisiert.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading || !supplier) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-neutral-500">
          <Loader2 className="w-6 h-6 animate-spin" />
          Lade Lieferant…
        </div>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'stammdaten', label: 'Stammdaten', icon: User },
    { id: 'artikel', label: 'Artikel', icon: Link2 },
    { id: 'produkte', label: 'Produkte', icon: Package },
    { id: 'api', label: 'API-Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <Link
          href="/admin/suppliers"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Liste
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
            <Truck className="w-7 h-7 text-neutral-600" />
            {supplier.name}
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/suppliers/${id}/mapping`}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1.5"
            >
              <Package className="w-4 h-4" />
              SKU-Mapping
            </Link>
            {supplier.website && (
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Website
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200 mb-6">
          <nav className="flex gap-1">
            {tabs.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-neutral-900 text-neutral-900 bg-white'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab: Stammdaten */}
        {tab === 'stammdaten' && (
          <Card className="bg-white border border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-neutral-900 text-lg">Stammdaten</CardTitle>
              <p className="text-sm text-neutral-500 font-normal">Kontakt, USt-IdNr., Bankverbindung, Versanddienstleister.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-neutral-700">Name *</Label>
                  <Input
                    value={String(form.name ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div>
                  <Label className="text-neutral-700">E-Mail</Label>
                  <Input
                    type="email"
                    value={String(form.contact_email ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div>
                  <Label className="text-neutral-700">Bestell-E-Mail (falls abweichend)</Label>
                  <Input
                    type="email"
                    value={String(form.order_email ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, order_email: e.target.value }))}
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div>
                  <Label className="text-neutral-700">Ansprechpartner</Label>
                  <Input
                    value={String(form.contact_person ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div>
                  <Label className="text-neutral-700">Telefon</Label>
                  <Input
                    value={String(form.contact_phone ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-neutral-700">Website</Label>
                  <Input
                    value={String(form.website ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="https://…"
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-neutral-700">USt-IdNr.</Label>
                  <Input
                    value={String(form.vat_id ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, vat_id: e.target.value }))}
                    placeholder="DE123456789"
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div>
                  <Label className="text-neutral-700">Kontoinhaber</Label>
                  <Input
                    value={String(form.bank_holder ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, bank_holder: e.target.value }))}
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div>
                  <Label className="text-neutral-700">IBAN</Label>
                  <Input
                    value={String(form.bank_iban ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, bank_iban: e.target.value }))}
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div>
                  <Label className="text-neutral-700">BIC</Label>
                  <Input
                    value={String(form.bank_bic ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, bank_bic: e.target.value }))}
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div>
                  <Label className="text-neutral-700">Versanddienstleister</Label>
                  <Input
                    value={String(form.shipping_provider ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, shipping_provider: e.target.value }))}
                    placeholder="z. B. DHL, DPD"
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div>
                  <Label className="text-neutral-700">Mindestbestellwert (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.minimum_order_value === '' ? '' : form.minimum_order_value}
                    onChange={(e) => setForm((f) => ({ ...f, minimum_order_value: e.target.value === '' ? '' : parseFloat(e.target.value) || 0 }))}
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div>
                  <Label className="text-neutral-700">Zahlungsbedingungen</Label>
                  <Input
                    value={String(form.payment_terms ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, payment_terms: e.target.value }))}
                    placeholder="z. B. 14 Tage netto"
                    className="mt-1 bg-white border-neutral-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-neutral-700">Interne Besonderheiten / Notizen</Label>
                  <textarea
                    value={String(form.notes ?? '')}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white text-neutral-900 text-sm mt-1"
                  />
                </div>
              </div>
              <Button onClick={handleSaveStammdaten} disabled={saving} className="bg-neutral-900 hover:bg-neutral-800">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Speichern
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tab: Artikel – einzeln anlegen, mit Shop verknüpfen, API/Bestell-URL */}
        {tab === 'artikel' && (
          <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-neutral-900 text-lg">Lieferanten-Artikel</CardTitle>
              <p className="text-sm text-neutral-500 font-normal">
                Artikel einzeln anlegen und mit Shop-Produkt verknüpfen. Wird für automatische Bestellung (API) und manuelle Bestellungen genutzt.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
                <Label className="text-neutral-700 font-medium">Neuer Artikel</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-neutral-500">Supplier SKU *</Label>
                    <Input
                      value={newArticle.supplier_sku}
                      onChange={(e) => setNewArticle((a) => ({ ...a, supplier_sku: e.target.value }))}
                      placeholder="Artikelnummer beim Lieferanten"
                      className="mt-0.5 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500">Bezeichnung beim Lieferanten</Label>
                    <Input
                      value={newArticle.supplier_product_name}
                      onChange={(e) => setNewArticle((a) => ({ ...a, supplier_product_name: e.target.value }))}
                      placeholder="Produktname"
                      className="mt-0.5 bg-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-neutral-500">Shop-Produkt verknüpfen</Label>
                    <select
                      value={newArticle.product_id}
                      onChange={(e) => setNewArticle((a) => ({ ...a, product_id: e.target.value }))}
                      className="mt-0.5 w-full px-3 py-2 border border-neutral-300 rounded-md bg-white text-neutral-900 text-sm"
                    >
                      <option value="">— Kein Shop-Produkt —</option>
                      {allProducts.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500">API-Produkt-ID (für Auto-Bestellung)</Label>
                    <Input
                      value={newArticle.api_product_id}
                      onChange={(e) => setNewArticle((a) => ({ ...a, api_product_id: e.target.value }))}
                      placeholder="z. B. externe ID"
                      className="mt-0.5 bg-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-500">Bestell-URL (Direktlink)</Label>
                    <Input
                      value={newArticle.order_url}
                      onChange={(e) => setNewArticle((a) => ({ ...a, order_url: e.target.value }))}
                      placeholder="https://…"
                      className="mt-0.5 bg-white"
                    />
                  </div>
                </div>
                <Button onClick={handleAddArticle} disabled={addingArticle} size="sm" className="bg-neutral-900 hover:bg-neutral-800">
                  {addingArticle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                  Artikel anlegen
                </Button>
              </div>

              {articlesLoading ? (
                <div className="flex items-center gap-2 text-neutral-500 py-8">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Lade Artikel…
                </div>
              ) : articles.length === 0 ? (
                <p className="text-neutral-500 py-6 text-center">Noch keine Artikel. Lege oben einen an oder verknüpfe Produkte im Tab &quot;Produkte&quot; mit diesem Lieferanten.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="text-left font-medium text-neutral-700 py-2 px-3">SKU</th>
                        <th className="text-left font-medium text-neutral-700 py-2 px-3">Name (Lieferant)</th>
                        <th className="text-left font-medium text-neutral-700 py-2 px-3">Shop-Produkt</th>
                        <th className="text-left font-medium text-neutral-700 py-2 px-3">API-ID / URL</th>
                        <th className="text-right font-medium text-neutral-700 py-2 px-3 w-24">Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {articles.map((a) => (
                        <tr key={a.id} className="border-b border-neutral-100">
                          {editingId === a.id ? (
                            <>
                              <td className="py-2 px-3">
                                <Input
                                  value={editArticle[a.id]?.supplier_sku ?? a.supplier_sku}
                                  onChange={(e) => setEditArticle((prev) => ({ ...prev, [a.id]: { ...prev[a.id], supplier_sku: e.target.value } }))}
                                  className="h-8 text-sm"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  value={editArticle[a.id]?.supplier_product_name ?? a.supplier_product_name ?? ''}
                                  onChange={(e) => setEditArticle((prev) => ({ ...prev, [a.id]: { ...prev[a.id], supplier_product_name: e.target.value } }))}
                                  className="h-8 text-sm"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  value={editArticle[a.id]?.product_id ?? a.product_id ?? ''}
                                  onChange={(e) => setEditArticle((prev) => ({ ...prev, [a.id]: { ...prev[a.id], product_id: e.target.value } }))}
                                  className="h-8 w-full max-w-[180px] text-sm border rounded px-2 bg-white"
                                >
                                  <option value="">—</option>
                                  {allProducts.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-3">
                                <Input
                                  value={editArticle[a.id]?.api_product_id ?? a.api_product_id ?? ''}
                                  onChange={(e) => setEditArticle((prev) => ({ ...prev, [a.id]: { ...prev[a.id], api_product_id: e.target.value } }))}
                                  placeholder="API-ID"
                                  className="h-8 text-sm mb-1"
                                />
                                <Input
                                  value={editArticle[a.id]?.order_url ?? a.order_url ?? ''}
                                  onChange={(e) => setEditArticle((prev) => ({ ...prev, [a.id]: { ...prev[a.id], order_url: e.target.value } }))}
                                  placeholder="Bestell-URL"
                                  className="h-8 text-sm"
                                />
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Button size="sm" variant="outline" className="mr-1" onClick={() => handleUpdateArticle(a.id)}>Speichern</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditArticle((prev) => { const n = { ...prev }; delete n[a.id]; return n }) }}>Abbr.</Button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-3 font-medium text-neutral-900">{a.supplier_sku}</td>
                              <td className="py-2 px-3 text-neutral-600">{a.supplier_product_name ?? '—'}</td>
                              <td className="py-2 px-3">
                                {a.product ? (
                                  <Link href={`/admin/products/${a.product.id}/edit`} className="text-neutral-700 hover:text-neutral-900 inline-flex items-center gap-1">
                                    {a.product.name}
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                ) : '—'}
                              </td>
                              <td className="py-2 px-3 text-neutral-600">
                                {a.api_product_id && <span className="block text-xs">{a.api_product_id}</span>}
                                {a.order_url && (
                                  <a href={a.order_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate max-w-[160px] inline-block">
                                    Link
                                  </a>
                                )}
                                {!a.api_product_id && !a.order_url && '—'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Button size="sm" variant="ghost" className="text-neutral-600" onClick={() => { setEditingId(a.id); setEditArticle((prev) => ({ ...prev, [a.id]: { supplier_sku: a.supplier_sku, supplier_product_name: a.supplier_product_name ?? '', product_id: a.product_id ?? '', api_product_id: a.api_product_id ?? '', order_url: a.order_url ?? '', notes: a.notes ?? '' } })) }}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteArticle(a.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: Produkte */}
        {tab === 'produkte' && (
          <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
            <CardHeader>
              <CardTitle className="text-neutral-900 text-lg">Produkte (Mapping)</CardTitle>
              <p className="text-sm text-neutral-500 font-normal">Produkte mit diesem Lieferanten. Supplier SKU und Name in der Produktbearbeitung setzen oder im Tab &quot;Artikel&quot; verwalten.</p>
            </CardHeader>
            <CardContent className="p-0">
              {products.length === 0 ? (
                <p className="text-neutral-500 py-8 text-center">Keine Produkte diesem Lieferanten zugeordnet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 bg-neutral-50">
                        <th className="text-left font-medium text-neutral-700 py-3 px-4">Produkt</th>
                        <th className="text-left font-medium text-neutral-700 py-3 px-4">Supplier SKU</th>
                        <th className="text-left font-medium text-neutral-700 py-3 px-4">Supplier Produktname</th>
                        <th className="text-right font-medium text-neutral-700 py-3 px-4">Einkaufspreis</th>
                        <th className="text-right font-medium text-neutral-700 py-3 px-4">Aktion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-neutral-100">
                          <td className="py-3 px-4 font-medium text-neutral-900">{p.name}</td>
                          <td className="py-3 px-4 text-neutral-600">{p.supplier_sku ?? '—'}</td>
                          <td className="py-3 px-4 text-neutral-600">{p.supplier_product_name ?? '—'}</td>
                          <td className="py-3 px-4 text-right text-neutral-700">
                            {p.cost_price != null ? `${Number(p.cost_price).toFixed(2)} €` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/admin/products/${p.id}/edit`}
                              className="text-neutral-600 hover:text-neutral-900 text-sm font-medium"
                            >
                              Bearbeiten
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tab: API-Settings */}
        {tab === 'api' && (
          <Card className="bg-white border border-neutral-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-neutral-900 text-lg">API-Konfiguration</CardTitle>
              <p className="text-sm text-neutral-500 font-normal">Endpoint, Auth-Token und optionale Header (JSON).</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-neutral-700">Übermittlungstyp</Label>
                <select
                  value={String(form.type ?? 'manual')}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 border border-neutral-300 rounded-md bg-white text-neutral-900"
                >
                  <option value="manual">Manuell</option>
                  <option value="email">E-Mail</option>
                  <option value="api">API</option>
                </select>
              </div>
              {(form.type === 'api' || supplier.type === 'api') && (
                <>
                  <div>
                    <Label className="text-neutral-700">API-Endpoint (URL)</Label>
                    <Input
                      value={String(form.api_endpoint ?? '')}
                      onChange={(e) => setForm((f) => ({ ...f, api_endpoint: e.target.value }))}
                      placeholder="https://api.lieferant.de/orders"
                      className="mt-1 bg-white border-neutral-300"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-700">Auth-Token / API-Key</Label>
                    <Input
                      type="password"
                      value={String(form.api_key ?? '')}
                      onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                      placeholder="Bearer-Token oder API-Key"
                      className="mt-1 bg-white border-neutral-300"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <Label className="text-neutral-700">API-Header (JSON)</Label>
                    <textarea
                      value={apiHeadersJson}
                      onChange={(e) => setApiHeadersJson(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md bg-white text-neutral-900 font-mono text-sm mt-1"
                      placeholder='{"X-Custom-Header": "value", "Accept-Language": "de"}'
                    />
                    <p className="text-xs text-neutral-500 mt-1">Zusätzliche HTTP-Header als JSON-Objekt (Schlüssel: Wert).</p>
                  </div>
                </>
              )}
              <Button onClick={handleSaveApi} disabled={saving} className="bg-neutral-900 hover:bg-neutral-800">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                API-Einstellungen speichern
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
