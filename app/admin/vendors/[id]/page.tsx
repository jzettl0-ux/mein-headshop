'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Store,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Package,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Eye,
  Search,
  BarChart3,
  Lock,
  Trash2,
  Link2,
  Unlink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface LegalFlags {
  vendor_id: string
  bfsg_micro_enterprise_exemption: boolean
}

interface VendorDetail {
  id: string
  company_name: string
  legal_form?: string | null
  registration_number?: string | null
  vat_id?: string | null
  tax_number?: string | null
  address_street?: string | null
  address_zip?: string | null
  address_city?: string | null
  address_country?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  contact_person?: string | null
  kyb_status: string
  kyb_rejection_reason?: string | null
  kyb_approved_at?: string | null
  bank_iban?: string | null
  bank_bic?: string | null
  bank_holder?: string | null
  mollie_organization_id?: string | null
  notes?: string | null
  is_active?: boolean
  created_at?: string
  ubos: Array<{
    id: string
    first_name: string
    last_name: string
    date_of_birth?: string | null
    nationality?: string | null
    role?: string | null
    share_percent?: number | null
  }>
  documents: Array<{
    id: string
    document_type: string
    file_name?: string | null
    file_path: string
    review_status: string
    review_notes?: string | null
  }>
  legal_flags?: LegalFlags | null
  offers: Array<{
    id: string
    price: number
    stock: number
    sku?: string | null
    is_active: boolean
    products?: { id: string; name: string; slug: string; price: number } | null
  }>
}

const KYB_STATUS_OPTIONS = ['draft', 'submitted', 'documents_review', 'approved', 'rejected', 'suspended'] as const

function docTypeLabel(t: string) {
  const labels: Record<string, string> = {
    handelsregister: 'Handelsregisterauszug',
    ust_bescheinigung: 'USt-Bescheinigung',
    id_pass: 'Ausweis (Reisepass)',
    id_id_card: 'Ausweis (Personalausweis)',
    company_extract: 'Firmenauszug',
    other: 'Sonstiges',
  }
  return labels[t] ?? t
}

export default function AdminVendorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [vendor, setVendor] = useState<VendorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [docUploadType, setDocUploadType] = useState('handelsregister')
  const [docUploadFile, setDocUploadFile] = useState<File | null>(null)
  const [docUploading, setDocUploading] = useState(false)
  const [docReviewing, setDocReviewing] = useState<string | null>(null)
  const [docNotes, setDocNotes] = useState<Record<string, string>>({})
  const [docRejectModal, setDocRejectModal] = useState<{ docId: string } | null>(null)
  const [vatValidating, setVatValidating] = useState(false)
  const [resendWelcomeLoading, setResendWelcomeLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [metrics, setMetrics] = useState<{ order_defect_rate: number; late_shipment_rate: number; valid_tracking_rate: number; is_buybox_eligible: boolean } | null>(null)
  const [metricsSaving, setMetricsSaving] = useState(false)
  const [metricsEdit, setMetricsEdit] = useState(false)
  const [metricsForm, setMetricsForm] = useState({ odr: '0', lsr: '0', vtr: '1', eligible: true })
  const [bfsgSaving, setBfsgSaving] = useState(false)
  const [mollieDisconnectLoading, setMollieDisconnectLoading] = useState(false)
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const DOC_TYPES = [
    { value: 'handelsregister', label: 'Handelsregisterauszug' },
    { value: 'ust_bescheinigung', label: 'USt-Bescheinigung' },
    { value: 'id_pass', label: 'Ausweis (Reisepass)' },
    { value: 'id_id_card', label: 'Ausweis (Personalausweis)' },
    { value: 'company_extract', label: 'Firmenauszug' },
    { value: 'other', label: 'Sonstiges' },
  ]

  const load = () => {
    if (!id) return
    setLoading(true)
    fetch(`/api/admin/vendors/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Nicht gefunden')
        return res.json()
      })
      .then(setVendor)
      .catch(() => setVendor(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [id])

  // Mollie Connect Rückkehr: Toast anzeigen und Query-Parameter entfernen
  useEffect(() => {
    const status = searchParams.get('mollie_connect')
    if (!status || !id) return
    const reason = searchParams.get('reason') || ''
    if (status === 'ok') {
      toast({ title: 'Mollie verbunden', description: 'Die Vendor-Organisation wurde für Split-Payments hinterlegt.' })
      load()
    }
    if (status === 'error') {
      const messages: Record<string, string> = {
        unauthorized: 'Nicht autorisiert.',
        service: 'Service nicht verfügbar.',
        missing_code_or_state: 'OAuth-Code oder State fehlen.',
        connect_not_configured: 'Mollie Connect ist nicht konfiguriert (MOLLIE_CONNECT_CLIENT_ID/SECRET).',
        token_exchange_failed: 'Token-Austausch mit Mollie fehlgeschlagen.',
        no_access_token: 'Kein Access Token von Mollie erhalten.',
        org_fetch_failed: 'Mollie-Organisation konnte nicht abgerufen werden.',
        invalid_org_id: 'Ungültige Organisations-ID.',
        db_update_failed: 'Speichern der Organisations-ID fehlgeschlagen.',
      }
      toast({
        title: 'Mollie-Verbindung fehlgeschlagen',
        description: reason ? (messages[reason] ?? reason) : 'Unbekannter Fehler.',
        variant: 'destructive',
      })
    }
    const url = new URL(window.location.href)
    url.searchParams.delete('mollie_connect')
    url.searchParams.delete('reason')
    window.history.replaceState({}, '', url.pathname + url.search)
  }, [searchParams, id, toast])

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/vendors/${id}/metrics`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setMetrics({ order_defect_rate: d.order_defect_rate ?? 0, late_shipment_rate: d.late_shipment_rate ?? 0, valid_tracking_rate: d.valid_tracking_rate ?? 1, is_buybox_eligible: d.is_buybox_eligible !== false })
          setMetricsForm({ odr: String(d.order_defect_rate ?? 0), lsr: String(d.late_shipment_rate ?? 0), vtr: String(d.valid_tracking_rate ?? 1), eligible: d.is_buybox_eligible !== false })
        }
      })
      .catch(() => setMetrics(null))
  }, [id])

  const saveMetrics = async (payload: { order_defect_rate?: number; late_shipment_rate?: number; valid_tracking_rate?: number; is_buybox_eligible?: boolean }) => {
    setMetricsSaving(true)
    try {
      const res = await fetch(`/api/admin/vendors/${id}/metrics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Metriken aktualisiert', description: 'Buy-Box-Scoring berücksichtigt die neuen Werte.' })
      setMetrics((m) => (m ? { ...m, ...payload } : null))
      setMetricsEdit(false)
    } finally {
      setMetricsSaving(false)
    }
  }

  const updateKybStatus = async (status: string, extra?: { kyb_rejection_reason?: string }) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kyb_status: status, ...extra }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'KYB-Status aktualisiert', description: status === 'approved' ? 'Vendor freigegeben' : status })
      setShowRejectModal(false)
      setRejectionReason('')
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!docUploadFile) {
      toast({ title: 'Bitte Datei auswählen', variant: 'destructive' })
      return
    }
    setDocUploading(true)
    try {
      const fd = new FormData()
      fd.set('document_type', docUploadType)
      fd.set('file', docUploadFile)
      const res = await fetch(`/api/admin/vendors/${id}/documents/upload`, {
        method: 'POST',
        body: fd,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Upload fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({ title: 'Dokument hochgeladen' })
      setDocUploadFile(null)
      load()
    } finally {
      setDocUploading(false)
    }
  }

  const handleViewDoc = async (docId: string) => {
    try {
      const res = await fetch(`/api/admin/vendors/documents/${docId}/url`)
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        window.open(data.url, '_blank')
      } else {
        toast({ title: 'Fehler', description: 'Dokument konnte nicht geladen werden', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const handleDocApprove = async (docId: string) => {
    setDocReviewing(docId)
    try {
      const res = await fetch(`/api/admin/vendors/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_status: 'approved', review_notes: docNotes[docId] ?? '' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Dokument freigegeben' })
      setDocNotes((prev) => { const n = { ...prev }; delete n[docId]; return n })
      load()
    } finally {
      setDocReviewing(null)
    }
  }

  const handleDocReject = async (docId: string) => {
    const notes = docNotes[docId] ?? ''
    if (!notes.trim()) {
      toast({ title: 'Bitte Ablehnungsgrund angeben', variant: 'destructive' })
      return
    }
    setDocReviewing(docId)
    try {
      const res = await fetch(`/api/admin/vendors/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_status: 'rejected', review_notes: notes }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Dokument abgelehnt' })
      setDocNotes((prev) => { const n = { ...prev }; delete n[docId]; return n })
      setDocRejectModal(null)
      load()
    } finally {
      setDocReviewing(null)
    }
  }

  const handleValidateVat = async () => {
    const vat = vendor?.vat_id?.trim()
    if (!vat) {
      toast({ title: 'Keine USt-IdNr. hinterlegt', variant: 'destructive' })
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

  const handleResendWelcome = async () => {
    if (!id) return
    setResendWelcomeLoading(true)
    try {
      const res = await fetch(`/api/admin/vendors/${id}/resend-welcome`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'E-Mail konnte nicht gesendet werden', variant: 'destructive' })
        return
      }
      toast({ title: 'Willkommens-E-Mail erneut gesendet', description: 'Der Vendor wurde per E-Mail benachrichtigt.' })
    } catch {
      toast({ title: 'Fehler', description: 'E-Mail konnte nicht gesendet werden', variant: 'destructive' })
    } finally {
      setResendWelcomeLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false, kyb_status: 'suspended' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({ title: 'Fehler', description: data.error || 'Sperrung fehlgeschlagen', variant: 'destructive' })
        return
      }
      const updated = await res.json()
      setVendor(updated)
      toast({ title: 'Vendor gesperrt', description: 'Das Konto ist deaktiviert. Angebote werden nicht mehr angezeigt.' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUnsuspend = async () => {
    if (!id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true, kyb_status: 'approved' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({ title: 'Fehler', description: data.error || 'Entsperrung fehlgeschlagen', variant: 'destructive' })
        return
      }
      const updated = await res.json()
      setVendor(updated)
      toast({ title: 'Vendor entsperrt', description: 'Das Konto ist wieder aktiv.' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({ title: 'Fehler', description: data.error || 'Löschung fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({ title: 'Vendor gelöscht' })
      setShowDeleteModal(false)
      router.push('/admin/vendors')
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleMollieDisconnect = async () => {
    if (!id) return
    setMollieDisconnectLoading(true)
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mollie_organization_id: null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Trennen fehlgeschlagen', variant: 'destructive' })
        return
      }
      setVendor((v) => (v ? { ...v, mollie_organization_id: null } : null))
      toast({ title: 'Mollie getrennt', description: 'Split-Payments für diesen Vendor deaktiviert.' })
    } finally {
      setMollieDisconnectLoading(false)
    }
  }

  const handleBfsgToggle = async (value: boolean) => {
    if (!id) return
    setBfsgSaving(true)
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bfsg_micro_enterprise_exemption: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      setVendor((v) => (v ? { ...v, legal_flags: data.legal_flags ?? v.legal_flags } : null))
      toast({ title: 'BFSG-Flag aktualisiert' })
    } finally {
      setBfsgSaving(false)
    }
  }

  const handleApprove = () => updateKybStatus('approved')
  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({ title: 'Bitte Ablehnungsgrund angeben', variant: 'destructive' })
      return
    }
    updateKybStatus('rejected', { kyb_rejection_reason: rejectionReason.trim() })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin text-luxe-primary" />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="space-y-4">
        <p className="text-luxe-silver">Vendor nicht gefunden.</p>
        <Link href="/admin/vendors">
          <Button variant="outline">Zurück zur Liste</Button>
        </Link>
      </div>
    )
  }

  const canChangeKyb = ['submitted', 'documents_review'].includes(vendor.kyb_status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/admin/vendors">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Store className="w-6 h-6 text-luxe-primary" />
              {vendor.company_name}
            </h1>
            <p className="text-luxe-silver text-sm">Vendor-Detail & KYB</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm px-3 py-1 rounded ${
              vendor.kyb_status === 'approved' && vendor.is_active !== false
                ? 'bg-emerald-500/20 text-emerald-500'
                : vendor.kyb_status === 'suspended' || vendor.is_active === false
                ? 'bg-amber-500/20 text-amber-500'
                : vendor.kyb_status === 'rejected'
                ? 'bg-red-500/20 text-red-500'
                : 'bg-luxe-gray/40 text-luxe-silver'
            }`}
          >
            {vendor.kyb_status === 'suspended' || vendor.is_active === false ? 'Gesperrt' : `KYB: ${vendor.kyb_status}`}
          </span>
          {vendor.kyb_status === 'approved' && vendor.kyb_approved_at && (
            <span className="text-xs text-luxe-silver">
              Freigegeben: {new Date(vendor.kyb_approved_at).toLocaleDateString('de-DE')}
            </span>
          )}
        </div>
      </div>

      {/* KYB-Actions */}
      {canChangeKyb && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              KYB freigeben oder ablehnen
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="default"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApprove}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Freigeben
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setShowRejectModal(true)}
              disabled={saving}
            >
              <XCircle className="w-4 h-4" />
              Ablehnen
            </Button>
          </CardContent>
        </Card>
      )}

      {vendor.kyb_status === 'rejected' && vendor.kyb_rejection_reason && (
        <Card className="bg-red-500/10 border-red-500/50">
          <CardContent className="pt-4">
            <p className="text-sm text-red-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span><strong>Ablehnungsgrund:</strong> {vendor.kyb_rejection_reason}</span>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stammdaten */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3 items-start">
              <Mail className="w-4 h-4 text-luxe-silver shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <Label className="text-luxe-silver text-xs">E-Mail</Label>
                {vendor.contact_email ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${vendor.contact_email}`}
                      className="text-luxe-gold hover:underline break-all"
                    >
                      {vendor.contact_email}
                    </a>
                    <a href={`mailto:${vendor.contact_email}`}>
                      <Button variant="outline" size="sm" className="border-luxe-gray text-luxe-gold shrink-0">
                        E-Mail senden
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-luxe-gray text-luxe-silver hover:text-luxe-gold shrink-0"
                      disabled={resendWelcomeLoading}
                      onClick={handleResendWelcome}
                    >
                      {resendWelcomeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Willkommens-E-Mail erneut senden'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-foreground">–</p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="w-4 h-4 text-luxe-silver shrink-0 mt-0.5" />
              <div>
                <Label className="text-luxe-silver text-xs">Telefon</Label>
                <p className="text-foreground">{vendor.contact_phone || '–'}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="w-4 h-4 text-luxe-silver shrink-0 mt-0.5" />
              <div>
                <Label className="text-luxe-silver text-xs">Ansprechpartner</Label>
                <p className="text-foreground">{vendor.contact_person || '–'}</p>
              </div>
            </div>
            <div>
              <Label className="text-luxe-silver text-xs">Rechtsform / USt-IdNr.</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-foreground">{[vendor.legal_form, vendor.vat_id].filter(Boolean).join(' · ') || '–'}</p>
                {vendor.vat_id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-luxe-silver hover:text-luxe-gold"
                    onClick={handleValidateVat}
                    disabled={vatValidating}
                  >
                    {vatValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    VIES prüfen
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-luxe-gray">
            <Label className="text-luxe-silver text-xs">Mollie Split / Zahlung</Label>
            {vendor.mollie_organization_id ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-foreground text-sm">
                  <span className="text-luxe-silver">Mollie Org ID:</span>{' '}
                  <code className="font-mono bg-luxe-black px-1.5 py-0.5 rounded">{vendor.mollie_organization_id}</code>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 gap-1"
                  onClick={handleMollieDisconnect}
                  disabled={mollieDisconnectLoading}
                >
                  {mollieDisconnectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                  Trennen
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <a href={`/api/admin/mollie-connect/authorize?vendor_id=${id}`}>
                  <Button type="button" variant="outline" size="sm" className="gap-1 border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10">
                    <Link2 className="w-4 h-4" />
                    Mit Mollie verbinden
                  </Button>
                </a>
                <span className="text-luxe-silver text-xs">OAuth2 – Organisation für Split-Payments verknüpfen</span>
              </div>
            )}
            {(vendor.bank_holder || vendor.bank_iban) && (
              <p className="text-foreground text-sm">
                {vendor.bank_holder && <>Kontoinhaber: {vendor.bank_holder}</>}
                {vendor.bank_holder && vendor.bank_iban && ' · '}
                {vendor.bank_iban && <>IBAN: {vendor.bank_iban}</>}
              </p>
            )}
          </div>
          {(vendor.address_street || vendor.address_city) && (
            <div className="flex gap-3">
              <MapPin className="w-4 h-4 text-luxe-silver shrink-0 mt-0.5" />
              <div>
                <Label className="text-luxe-silver text-xs">Adresse</Label>
                <p className="text-foreground">
                  {[vendor.address_street, `${vendor.address_zip || ''} ${vendor.address_city || ''}`.trim(), vendor.address_country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>
            </div>
          )}
          {vendor.notes && (
            <div>
              <Label className="text-luxe-silver text-xs">Notizen</Label>
              <p className="text-foreground text-sm">{vendor.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BFSG Compliance */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            BFSG Barrierefreiheit
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            §2 Nr.17 BFSG: Kleinstunternehmen (&lt;10 Beschäftigte, &lt;2 Mio € Umsatz) sind von der Barrierefreiheitspflicht ausgenommen.
          </p>
        </CardHeader>
        <CardContent>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={vendor.legal_flags?.bfsg_micro_enterprise_exemption ?? false}
              onChange={(e) => handleBfsgToggle(e.target.checked)}
              disabled={bfsgSaving}
              className="rounded border-luxe-gray"
            />
            <span className="text-white">
              BFSG Kleinstunternehmen-Ausnahme
              {bfsgSaving && <Loader2 className="inline w-4 h-4 animate-spin ml-2" />}
            </span>
          </label>
        </CardContent>
      </Card>

      {/* UBOs */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            UBOs (wirtschaftliche Eigentümer)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendor.ubos.length === 0 ? (
            <p className="text-luxe-silver text-sm">Noch keine UBOs erfasst.</p>
          ) : (
            <div className="space-y-2">
              {vendor.ubos.map((ubo) => (
                <div
                  key={ubo.id}
                  className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-luxe-black/40 border border-luxe-gray"
                >
                  <span className="font-medium">{ubo.first_name} {ubo.last_name}</span>
                  {ubo.role && <span className="text-sm text-luxe-silver">{ubo.role}</span>}
                  {ubo.share_percent != null && (
                    <span className="text-sm text-luxe-silver">({ubo.share_percent}%)</span>
                  )}
                  {ubo.nationality && (
                    <span className="text-xs px-2 py-0.5 rounded bg-luxe-gray/40">{ubo.nationality}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dokumente – Upload + Maker-Checker */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            KYB-Dokumente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleDocUpload} className="flex flex-wrap items-end gap-4 p-4 rounded-lg bg-luxe-black/40 border border-luxe-gray">
            <div>
              <Label className="text-luxe-silver text-xs">Dokumenttyp</Label>
              <select
                value={docUploadType}
                onChange={(e) => setDocUploadType(e.target.value)}
                className="mt-1 h-9 px-3 rounded-md bg-luxe-black border border-luxe-gray text-white text-sm"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-luxe-silver text-xs">Datei (PDF, JPG, PNG, WebP, max. 10 MB)</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
                onChange={(e) => setDocUploadFile(e.target.files?.[0] ?? null)}
                className="mt-1 bg-luxe-black border-luxe-gray text-white text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-luxe-gold/20 file:text-luxe-gold"
              />
            </div>
            <Button type="submit" size="sm" disabled={!docUploadFile || docUploading} className="gap-2">
              {docUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Hochladen
            </Button>
          </form>

          {vendor.documents.length === 0 ? (
            <p className="text-luxe-silver text-sm">Noch keine Dokumente hochgeladen.</p>
          ) : (
            <div className="space-y-3">
              {vendor.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-lg bg-luxe-black/40 border border-luxe-gray space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-medium">{docTypeLabel(doc.document_type)}</span>
                      {doc.file_name && (
                        <span className="text-sm text-luxe-silver ml-2">{doc.file_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => handleViewDoc(doc.id)}
                      >
                        <Eye className="w-4 h-4" />
                        Ansehen
                      </Button>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          doc.review_status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-500'
                            : doc.review_status === 'rejected'
                            ? 'bg-red-500/20 text-red-500'
                            : 'bg-amber-500/20 text-amber-500'
                        }`}
                      >
                        {doc.review_status === 'approved' ? 'Freigegeben' : doc.review_status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                      </span>
                    </div>
                  </div>
                  {doc.review_notes && (
                    <p className="text-xs text-luxe-silver">Notiz: {doc.review_notes}</p>
                  )}
                  {doc.review_status === 'pending' && (
                    <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-luxe-gray">
                      <div className="flex-1 min-w-[200px]">
                        <Label className="text-luxe-silver text-xs">Notiz (optional, bei Ablehnung empfohlen)</Label>
                        <Input
                          value={docNotes[doc.id] ?? ''}
                          onChange={(e) => setDocNotes((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                          placeholder="z. B. Bild unscharf, USt-Bescheinigung abgelaufen …"
                          className="mt-1 bg-luxe-black border-luxe-gray text-white text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/20"
                          onClick={() => handleDocApprove(doc.id)}
                          disabled={!!docReviewing}
                        >
                          {docReviewing === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          Freigeben
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => setDocRejectModal({ docId: doc.id })}
                          disabled={!!docReviewing}
                        >
                          <XCircle className="w-4 h-4" />
                          Ablehnen
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dokument-Ablehnung Modal (mit Pflichtfeld Notiz) */}
      {docRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-luxe-charcoal border-luxe-gray">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Dokument ablehnen</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setDocRejectModal(null)}>×</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="doc_reject_notes">Ablehnungsgrund *</Label>
                <textarea
                  id="doc_reject_notes"
                  value={docNotes[docRejectModal.docId] ?? ''}
                  onChange={(e) => setDocNotes((prev) => ({ ...prev, [docRejectModal.docId]: e.target.value }))}
                  rows={3}
                  className="w-full mt-2 rounded-md border border-luxe-gray bg-luxe-black text-white p-2"
                  placeholder="z. B. Dokument unleserlich, USt-Bescheinigung abgelaufen …"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDocRejectModal(null)}>Abbrechen</Button>
                <Button
                  variant="destructive"
                  onClick={() => docRejectModal && handleDocReject(docRejectModal.docId)}
                  disabled={!(docNotes[docRejectModal.docId] ?? '').trim() || !!docReviewing}
                >
                  {docReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Ablehnen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Angebote */}
      {/* Performance-Metriken (Buy-Box-Scoring) */}
      {vendor.kyb_status === 'approved' && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Performance-Metriken (Buy Box)
              </span>
              {!metricsEdit ? (
                <Button variant="admin-outline" size="sm" onClick={() => setMetricsEdit(true)}>Bearbeiten</Button>
              ) : (
                <Button variant="admin-outline" size="sm" onClick={() => setMetricsEdit(false)}>Abbrechen</Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              metricsEdit ? (
                <form onSubmit={(e) => { e.preventDefault(); saveMetrics({
                  order_defect_rate: parseFloat(metricsForm.odr) || 0,
                  late_shipment_rate: parseFloat(metricsForm.lsr) || 0,
                  valid_tracking_rate: parseFloat(metricsForm.vtr) ?? 1,
                  is_buybox_eligible: metricsForm.eligible,
                }); }}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-white text-sm">ODR (Order Defect Rate)</Label>
                      <Input type="number" step="0.0001" min={0} max={1} value={metricsForm.odr} onChange={(e) => setMetricsForm((f) => ({ ...f, odr: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
                      <p className="text-xs text-luxe-silver mt-1">Schwelle 1% = Buy-Box-Entzug</p>
                    </div>
                    <div>
                      <Label className="text-white text-sm">LSR (Late Shipment Rate)</Label>
                      <Input type="number" step="0.0001" min={0} max={1} value={metricsForm.lsr} onChange={(e) => setMetricsForm((f) => ({ ...f, lsr: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
                      <p className="text-xs text-luxe-silver mt-1">Schwelle 4% = Penalty</p>
                    </div>
                    <div>
                      <Label className="text-white text-sm">VTR (Valid Tracking Rate)</Label>
                      <Input type="number" step="0.01" min={0} max={1} value={metricsForm.vtr} onChange={(e) => setMetricsForm((f) => ({ ...f, vtr: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
                      <p className="text-xs text-luxe-silver mt-1">Schwelle 95%</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 mb-4">
                    <input type="checkbox" checked={metricsForm.eligible} onChange={(e) => setMetricsForm((f) => ({ ...f, eligible: e.target.checked }))} className="rounded" />
                    <span className="text-white text-sm">Buy-Box-berechtigt</span>
                  </label>
                  <Button type="submit" variant="luxe" disabled={metricsSaving}>{metricsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Speichern</Button>
                </form>
              ) : (
                <div className="flex flex-wrap gap-6">
                  <div>
                    <span className="text-luxe-silver text-sm">ODR</span>
                    <p className="text-white font-semibold">{(metrics.order_defect_rate * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <span className="text-luxe-silver text-sm">LSR</span>
                    <p className="text-white font-semibold">{(metrics.late_shipment_rate * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <span className="text-luxe-silver text-sm">VTR</span>
                    <p className="text-white font-semibold">{(metrics.valid_tracking_rate * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <span className="text-luxe-silver text-sm">Buy Box</span>
                    <p className="text-white font-semibold">{metrics.is_buybox_eligible ? 'Berechtigt' : 'Nicht berechtigt'}</p>
                  </div>
                </div>
              )
            ) : (
              <p className="text-luxe-silver text-sm">Metriken werden geladen…</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Angebote ({vendor.offers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vendor.offers.length === 0 ? (
            <p className="text-luxe-silver text-sm">Noch keine Produktangebote.</p>
          ) : (
            <div className="space-y-2">
              {vendor.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg bg-luxe-black/40 border border-luxe-gray"
                >
                  <div>
                    {offer.products && (
                      <Link
                        href={`/admin/products/${offer.products.id}/edit`}
                        className="font-medium text-luxe-primary hover:underline"
                      >
                        {offer.products.name}
                      </Link>
                    )}
                    {!offer.products && <span className="font-medium">Produkt (gelöscht)</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{Number(offer.price).toFixed(2)} €</span>
                    <span className="text-luxe-silver">Lager: {offer.stock}</span>
                    {!offer.is_active && (
                      <span className="text-amber-500">Inaktiv</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Konto-Verwaltung: Sperren / Löschen */}
      <Card className="bg-luxe-charcoal border-luxe-gray border-amber-500/20">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Konto-Verwaltung
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Sperren deaktiviert das Konto (Angebote werden ausgeblendet). Löschen entfernt den Vendor endgültig – gemäß DSGVO und Aufbewahrungsfristen prüfen.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {vendor.kyb_status === 'suspended' || vendor.is_active === false ? (
            <Button variant="default" className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={handleUnsuspend} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Konto entsperren
            </Button>
          ) : (
            <Button variant="outline" className="gap-2 border-amber-500/50 text-amber-500 hover:bg-amber-500/10" onClick={handleSuspend} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Konto sperren
            </Button>
          )}
          <Button variant="destructive" className="gap-2" onClick={() => setShowDeleteModal(true)} disabled={saving}>
            <Trash2 className="w-4 h-4" />
            Vendor-Konto löschen
          </Button>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-luxe-charcoal border-red-500/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-red-400">Vendor endgültig löschen</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDeleteModal(false)}>×</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-luxe-silver text-sm">
                Der Vendor <strong className="text-white">{vendor.company_name}</strong> wird unwiderruflich gelöscht. UBOs, Dokumente und Angebote werden mit entfernt.
              </p>
              <p className="text-xs text-amber-500">
                Hinweis: Bei bestehenden Bestellungen/Abrechnungen können gesetzliche Aufbewahrungsfristen (z. B. 10 Jahre GoBD) gelten. Vor Löschung prüfen.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Abbrechen</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Endgültig löschen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full bg-luxe-charcoal border-luxe-gray">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ablehnungsgrund</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowRejectModal(false)}>×</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label htmlFor="rejection_reason">Grund für die Ablehnung (wird dem Vendor mitgeteilt)</Label>
              <textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-luxe-gray bg-luxe-black text-white p-2"
                placeholder="z. B. Unvollständige Dokumente, USt-IdNr. ungültig …"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRejectModal(false)}>Abbrechen</Button>
                <Button variant="destructive" onClick={handleReject} disabled={saving || !rejectionReason.trim()}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Ablehnen
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
