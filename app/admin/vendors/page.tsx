'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, Loader2, Plus, ChevronRight, CheckCircle, Clock, XCircle, FileWarning, ShieldCheck, Mail, Inbox, ExternalLink, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Vendor {
  id: string
  company_name: string
  legal_form?: string | null
  vat_id?: string | null
  contact_email?: string | null
  contact_person?: string | null
  kyb_status: string
  kyb_approved_at?: string | null
  is_active?: boolean
  created_at?: string
}

interface VendorInquiry {
  id: string
  partner_type?: 'influencer' | 'company'
  bfsg_micro_enterprise_exemption?: boolean
  company_name: string
  influencer_links?: Record<string, string> | null
  contact_email: string
  contact_person?: string | null
  contact_phone?: string | null
  legal_form?: string | null
  vat_id?: string | null
  address_street?: string | null
  address_zip?: string | null
  address_city?: string | null
  message?: string | null
  product_interest?: string | null
  status: string
  created_at: string
}

const emptyForm = {
  company_name: '',
  contact_email: '',
  legal_form: '',
  vat_id: '',
  contact_person: '',
  contact_phone: '',
}

function kybBadge(status: string, isActive?: boolean) {
  if (status === 'suspended' || isActive === false) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/50">
        <Clock className="w-3 h-3" />
        Gesperrt
      </span>
    )
  }
  switch (status) {
    case 'approved':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50">
          <CheckCircle className="w-3 h-3" />
          KYB freigegeben
        </span>
      )
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-500 border border-red-500/50">
          <XCircle className="w-3 h-3" />
          Abgelehnt
        </span>
      )
    case 'documents_review':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/50">
          <FileWarning className="w-3 h-3" />
          In Prüfung
        </span>
      )
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 border border-blue-500/50">
          <Clock className="w-3 h-3" />
          Eingereicht
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-luxe-gray text-luxe-silver border border-luxe-gray">
          <Clock className="w-3 h-3" />
          Entwurf
        </span>
      )
  }
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vatValidating, setVatValidating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [inquiries, setInquiries] = useState<VendorInquiry[]>([])
  const [metricsRefreshing, setMetricsRefreshing] = useState(false)
  const [inquiriesLoading, setInquiriesLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const loadInquiries = () => {
    setInquiriesLoading(true)
    fetch('/api/admin/vendor-inquiries')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setInquiries(Array.isArray(data) ? data : []))
      .catch(() => setInquiries([]))
      .finally(() => setInquiriesLoading(false))
  }

  const load = () => {
    setLoading(true)
    fetch('/api/admin/vendors')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setVendors(Array.isArray(data) ? data : []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    loadInquiries()
  }, [])

  const handleApproveInquiry = async (id: string) => {
    setActingId(id)
    try {
      const res = await fetch(`/api/admin/vendor-inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Genehmigung fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({ title: 'Vendor angelegt', description: 'Willkommens-E-Mail wurde versendet.' })
      load()
      loadInquiries()
    } finally {
      setActingId(null)
    }
  }

  const handleRefreshMetrics = async () => {
    setMetricsRefreshing(true)
    try {
      const res = await fetch('/api/admin/vendors/refresh-metrics', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({ title: 'Metriken aktualisiert', description: data.message })
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message || 'Metriken konnten nicht aktualisiert werden', variant: 'destructive' })
    } finally {
      setMetricsRefreshing(false)
    }
  }

  const handleRejectInquiry = async (id: string) => {
    setActingId(id)
    try {
      const res = await fetch(`/api/admin/vendor-inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejection_reason: rejectReason[id] || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Ablehnung fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({ title: 'Anfrage abgelehnt', description: 'Ablehnungs-E-Mail wurde versendet.' })
      loadInquiries()
    } finally {
      setActingId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.company_name.trim() || !form.contact_email.trim()) {
      toast({ title: 'Firmenname und E-Mail sind erforderlich', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name.trim(),
          contact_email: form.contact_email.trim(),
          legal_form: form.legal_form.trim() || undefined,
          vat_id: form.vat_id.trim() || undefined,
          contact_person: form.contact_person.trim() || undefined,
          contact_phone: form.contact_phone.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Vendor angelegt', description: form.company_name })
      setForm(emptyForm)
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleValidateVat = async () => {
    const vat = form.vat_id.trim()
    if (!vat) {
      toast({ title: 'Bitte USt-IdNr. eingeben', variant: 'destructive' })
      return
    }
    setVatValidating(true)
    try {
      const res = await fetch('/api/admin/vendors/validate-vat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vat_id: vat }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.valid) {
        toast({
          title: 'USt-IdNr. gültig',
          description: data.name ? `${data.name} – in VIES bestätigt` : 'In VIES bestätigt',
        })
      } else {
        toast({
          title: 'USt-IdNr. ungültig',
          description: data.error || 'Nicht in VIES gefunden',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Prüfung fehlgeschlagen', variant: 'destructive' })
    } finally {
      setVatValidating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Store className="w-8 h-8 text-luxe-primary" />
          Vendors (Marktplatz)
        </h1>
        <p className="text-luxe-silver">
          Verkäufer im Multi-Vendor-Marktplatz. KYB-Onboarding für Compliance. Bei Genehmigung einer Anfrage wird automatisch ein Vendor angelegt und eine Willkommens-E-Mail versendet.
        </p>
      </div>

      {inquiries.filter((i) => i.status === 'pending').length > 0 && (
        <Card className="bg-luxe-charcoal border-luxe-gray border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Inbox className="w-5 h-5 text-amber-500" />
              Offene Vendor-Anfragen
            </CardTitle>
            <p className="text-sm text-luxe-silver">
              Genehmigen überträgt die Daten in einen neuen Vendor und sendet eine Willkommens-E-Mail. Ablehnen sendet eine Ablehnungs-E-Mail.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {inquiriesLoading ? (
              <div className="flex items-center gap-2 text-luxe-silver"><Loader2 className="w-4 h-4 animate-spin" /> Laden...</div>
            ) : (
              inquiries
                .filter((i) => i.status === 'pending')
                .map((inq) => (
                  <div key={inq.id} className="p-4 rounded-lg border border-luxe-gray bg-luxe-black/50 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {inq.partner_type === 'influencer' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/50">Influencer</span>
                      )}
                      {inq.partner_type === 'company' && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/50">Firma</span>
                      )}
                      {inq.bfsg_micro_enterprise_exemption && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50" title="BFSG Kleinstunternehmen-Ausnahme">BFSG §2.17</span>
                      )}
                      <span className="font-medium text-white">{inq.company_name}</span>
                      {inq.legal_form && <span className="text-xs text-luxe-silver">({inq.legal_form})</span>}
                      <a
                        href={`mailto:${inq.contact_email}`}
                        className="inline-flex items-center gap-1 text-sm text-luxe-gold hover:underline"
                      >
                        <Mail className="w-4 h-4" />
                        {inq.contact_email}
                      </a>
                    </div>
                    {(inq.contact_person || inq.contact_phone) && (
                      <p className="text-sm text-luxe-silver">
                        {inq.contact_person}
                        {inq.contact_person && inq.contact_phone && ' · '}
                        {inq.contact_phone}
                      </p>
                    )}
                    {inq.address_street && (
                      <p className="text-sm text-luxe-silver">
                        {[inq.address_street, [inq.address_zip, inq.address_city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {inq.product_interest && <p className="text-sm text-luxe-silver">Verkauft: {inq.product_interest}</p>}
                    {inq.partner_type === 'influencer' && inq.influencer_links && Object.keys(inq.influencer_links).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(inq.influencer_links).map(([platform, url]) => (
                          url && (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded bg-violet-500/20 text-violet-300 border border-violet-500/50 hover:bg-violet-500/30"
                            >
                              {platform}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )
                        ))}
                      </div>
                    )}
                    {inq.message && <p className="text-sm text-luxe-silver whitespace-pre-wrap">{inq.message}</p>}
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <Button size="sm" variant="luxe" onClick={() => handleApproveInquiry(inq.id)} disabled={actingId !== null}>
                        {actingId === inq.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        Genehmigen
                      </Button>
                      <input
                        type="text"
                        placeholder="Ablehnungsgrund (optional, wird per E-Mail mitgeteilt)"
                        value={rejectReason[inq.id] ?? ''}
                        onChange={(e) => setRejectReason((r) => ({ ...r, [inq.id]: e.target.value }))}
                        className="flex-1 min-w-[200px] rounded-md border border-luxe-gray bg-luxe-black px-3 py-1.5 text-sm text-white placeholder:text-luxe-silver/60"
                      />
                      <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => handleRejectInquiry(inq.id)} disabled={actingId !== null}>
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-foreground">Vendor-Übersicht</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshMetrics}
              disabled={metricsRefreshing}
              className="flex items-center gap-2 border-luxe-gray text-foreground hover:bg-luxe-gray"
              title="ODR, LSR, VTR aus Bestellungen berechnen und Buy-Box aktualisieren"
            >
              {metricsRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Metriken aktualisieren
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 border-luxe-gray text-foreground hover:bg-luxe-gray"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Abbrechen' : 'Neuer Vendor'}
            </Button>
          </div>
        </CardHeader>

        {showForm && (
          <CardContent className="border-t border-luxe-gray pt-6 pb-4">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name" className="text-luxe-silver">Firmenname *</Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                    className="mt-1 bg-luxe-black border-luxe-gray text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_email" className="text-luxe-silver">E-Mail *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                    className="mt-1 bg-luxe-black border-luxe-gray text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="legal_form" className="text-luxe-silver">Rechtsform</Label>
                  <Input
                    id="legal_form"
                    placeholder="z. B. GmbH, UG"
                    value={form.legal_form}
                    onChange={(e) => setForm((f) => ({ ...f, legal_form: e.target.value }))}
                    className="mt-1 bg-luxe-black border-luxe-gray text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="vat_id" className="text-luxe-silver">USt-IdNr.</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="vat_id"
                      value={form.vat_id}
                      onChange={(e) => setForm((f) => ({ ...f, vat_id: e.target.value }))}
                      placeholder="z. B. DE123456789"
                      className="flex-1 bg-luxe-black border-luxe-gray text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1 border-luxe-gray"
                      onClick={handleValidateVat}
                      disabled={!form.vat_id.trim() || vatValidating}
                    >
                      {vatValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      Prüfen
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact_person" className="text-luxe-silver">Ansprechpartner</Label>
                  <Input
                    id="contact_person"
                    value={form.contact_person}
                    onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                    className="mt-1 bg-luxe-black border-luxe-gray text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone" className="text-luxe-silver">Telefon</Label>
                  <Input
                    id="contact_phone"
                    value={form.contact_phone}
                    onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                    className="mt-1 bg-luxe-black border-luxe-gray text-white"
                  />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
                <Button type="submit" disabled={saving} className="gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Anlegen
                </Button>
              </DialogFooter>
            </form>
          </CardContent>
        )}

        <CardContent className={showForm ? 'border-t border-luxe-gray' : ''}>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-luxe-silver">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : vendors.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">Noch keine Vendors vorhanden. Neuen Vendor anlegen, um zu starten.</p>
          ) : (
            <div className="space-y-2">
              {vendors.map((v) => (
                <Link
                  key={v.id}
                  href={`/admin/vendors/${v.id}`}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border border-luxe-gray bg-luxe-black/40 hover:bg-luxe-black/70 transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                    <span className="font-medium text-foreground truncate">{v.company_name}</span>
                    {v.contact_email && (
                      <a
                        href={`mailto:${v.contact_email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-sm text-luxe-gold hover:underline truncate"
                      >
                        <Mail className="w-4 h-4 shrink-0" />
                        {v.contact_email}
                      </a>
                    )}
                    {kybBadge(v.kyb_status, v.is_active)}
                  </div>
                  <ChevronRight className="w-5 h-5 text-luxe-silver shrink-0 group-hover:text-luxe-primary" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
