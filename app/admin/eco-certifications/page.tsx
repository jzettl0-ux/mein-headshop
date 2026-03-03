'use client'

import { useState, useEffect, useCallback } from 'react'
import { Leaf, Loader2, Check, X, Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface EcoCert {
  cert_id: string
  product_id: string | null
  asin: string | null
  vendor_id: string
  certification_type: string
  status: string
  status_label: string
  created_at: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'Alle' },
  { value: 'PENDING', label: 'Ausstehend' },
  { value: 'VERIFIED', label: 'Verifiziert' },
  { value: 'REJECTED', label: 'Abgelehnt' },
]

const CERT_TYPES = [
  { value: 'FSC', label: 'FSC' },
  { value: 'EU-BIO', label: 'EU-Bio' },
  { value: 'GOTS', label: 'GOTS' },
  { value: 'OEKO_TEX', label: 'Oeko-Tex' },
  { value: 'B_CORP', label: 'B Corp' },
]

export default function AdminEcoCertificationsPage() {
  const { toast } = useToast()
  const [certs, setCerts] = useState<EcoCert[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [vendors, setVendors] = useState<{ id: string; company_name: string }[]>([])
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    vendor_id: '',
    product_id: '',
    asin: '',
    certification_type: 'FSC',
    document_url: '',
  })

  const loadCerts = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/admin/eco-certifications?${params}`)
      .then((r) => (r.ok ? r.json() : { certifications: [] }))
      .then((d) => setCerts(d.certifications ?? []))
      .catch(() => setCerts([]))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const handleVerify = async (certId: string) => {
    setUpdating(certId)
    try {
      const res = await fetch(`/api/admin/eco-certifications/${certId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VERIFIED' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Fehler')
      }
      toast({ title: 'Zertifikat verifiziert' })
      loadCerts()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setUpdating(null)
    }
  }

  const handleReject = async (certId: string) => {
    setUpdating(certId)
    try {
      const res = await fetch(`/api/admin/eco-certifications/${certId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Fehler')
      }
      toast({ title: 'Zertifikat abgelehnt' })
      loadCerts()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setUpdating(null)
    }
  }

  useEffect(() => {
    loadCerts()
  }, [loadCerts])

  useEffect(() => {
    fetch('/api/admin/vendors')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setVendors(Array.isArray(d) ? d : []))
      .catch(() => setVendors([]))
  }, [])
  useEffect(() => {
    fetch('/api/admin/products/list')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendor_id || !form.certification_type || !form.document_url.trim()) {
      toast({ title: 'Vendor, Zertifikatstyp und Dokumenten-URL erforderlich', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/eco-certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: form.vendor_id,
          product_id: form.product_id || null,
          asin: form.asin.trim() || null,
          certification_type: form.certification_type,
          document_url: form.document_url.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Fehler')
      }
      toast({ title: 'Zertifikat angelegt (ausstehend)' })
      setForm({ vendor_id: '', product_id: '', asin: '', certification_type: 'FSC', document_url: '' })
      setShowForm(false)
      loadCerts()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Leaf className="h-7 w-7 text-emerald-500" />
          Eco-Zertifizierungen
        </h1>
        <p className="mt-1 text-luxe-silver">
          Nachhaltigkeits-Badges (FSC, EU-Bio, GOTS). Badge nach Admin-Review.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Neues Zertifikat</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            {showForm ? 'Abbrechen' : 'Anlegen'}
          </Button>
        </CardHeader>
        {showForm && (
          <CardContent className="pt-0">
            <form onSubmit={handleCreate} className="space-y-4 p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">Vendor *</label>
                  <select
                    required
                    value={form.vendor_id}
                    onChange={(e) => setForm((f) => ({ ...f, vendor_id: e.target.value }))}
                    className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                  >
                    <option value="">— wählen —</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.company_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">Produkt (optional)</label>
                  <select
                    value={form.product_id}
                    onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                    className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                  >
                    <option value="">— keins —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">Zertifikatstyp *</label>
                  <select
                    value={form.certification_type}
                    onChange={(e) => setForm((f) => ({ ...f, certification_type: e.target.value }))}
                    className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                  >
                    {CERT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">ASIN (optional)</label>
                  <input
                    type="text"
                    value={form.asin}
                    onChange={(e) => setForm((f) => ({ ...f, asin: e.target.value }))}
                    placeholder="z. B. B08XYZ123"
                    className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Dokumenten-URL *</label>
                <input
                  type="url"
                  required
                  value={form.document_url}
                  onChange={(e) => setForm((f) => ({ ...f, document_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                />
              </div>
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Anlegen (Status: Ausstehend)
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Zertifikate</CardTitle>
          <Select value={statusFilter || '_all'} onValueChange={(v) => setStatusFilter(v === '_all' ? '' : v)}>
            <SelectTrigger className="w-48 bg-luxe-black border-luxe-gray text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value || '_all'} value={o.value || '_all'}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-luxe-silver" />
            </div>
          ) : certs.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">Keine Zertifikate vorhanden.</p>
          ) : (
            <div className="space-y-4">
              {certs.map((c) => (
                <div
                  key={c.cert_id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray"
                >
                  <div>
                    <p className="text-white font-medium">{c.certification_type}</p>
                    <p className="text-sm text-luxe-silver mt-1">
                      {c.asin && `ASIN: ${c.asin} · `}
                      Produkt: {c.product_id?.slice(0, 8) ?? '–'}…
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 border-emerald-600 hover:bg-emerald-600/20"
                          disabled={!!updating}
                          onClick={() => handleVerify(c.cert_id)}
                        >
                          {updating === c.cert_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Verifizieren
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 border-red-500 hover:bg-red-500/20"
                          disabled={!!updating}
                          onClick={() => handleReject(c.cert_id)}
                        >
                          {updating === c.cert_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          Ablehnen
                        </Button>
                      </>
                    )}
                    <Badge
                      variant={
                        c.status === 'VERIFIED' ? 'default' : c.status === 'REJECTED' ? 'destructive' : 'secondary'
                      }
                    >
                      {c.status_label}
                    </Badge>
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
