'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Truck, Loader2, Zap, CheckCircle, XCircle, Plus, Mail, Globe, User, Phone, ExternalLink, Copy, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

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
  api_capable?: boolean
  connector_type?: string | null
  created_at?: string
}

type TestStatus = 'idle' | 'running' | 'success' | 'error'

interface OrderTemplateData {
  supplier: {
    name: string
    contact_email?: string | null
    order_email?: string | null
    contact_person?: string | null
    contact_phone?: string | null
    website?: string | null
    notes?: string | null
    minimum_order_value?: number | null
    payment_terms?: string | null
  }
  company_address: string
  products: { id: string; name: string; stock: number }[]
}

const emptyForm = {
  name: '',
  email: '',
  contact_phone: '',
  contact_person: '',
  order_email: '',
  website: '',
  notes: '',
  minimum_order_value: '',
  payment_terms: '',
  api_endpoint: '',
  api_key: '',
  type: 'manual' as 'email' | 'api' | 'manual',
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testMessage, setTestMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orderModalLoading, setOrderModalLoading] = useState(false)
  const [orderModalData, setOrderModalData] = useState<OrderTemplateData | null>(null)
  const [orderModalSubject, setOrderModalSubject] = useState('')
  const [orderModalBody, setOrderModalBody] = useState('')
  const [orderModalSupplierName, setOrderModalSupplierName] = useState('')
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    fetch('/api/admin/suppliers')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleTestConnector = async () => {
    setTestStatus('running')
    setTestMessage(null)
    try {
      const res = await fetch('/api/admin/sync/mock-test', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (data.success) {
        setTestStatus('success')
        setTestMessage(data.message ?? 'Sync erfolgreich')
        toast({ title: 'Schnittstelle getestet', description: data.message })
      } else {
        setTestStatus('error')
        setTestMessage(data.message ?? data.error ?? 'Unbekannter Fehler')
        toast({ title: 'Test fehlgeschlagen', description: data.message ?? data.error, variant: 'destructive' })
      }
    } catch {
      setTestStatus('error')
      setTestMessage('Netzwerkfehler')
      toast({ title: 'Fehler', description: 'Schnittstelle konnte nicht getestet werden.', variant: 'destructive' })
    }
  }

  const buildDefaultBody = (data: OrderTemplateData) => {
    const s = data.supplier
    const greeting = s.contact_person ? `Guten Tag ${s.contact_person},` : 'Guten Tag,'
    const productLines =
      data.products.length > 0
        ? data.products
            .map((p) => `- ${p.name} (aktuell Bestand: ${p.stock})`)
            .join('\n')
        : '- [Artikel eintragen]'
    const address = data.company_address || '[Firmenadresse unter Einstellungen eintragen]'
    return `${greeting}

bitte liefern Sie folgende Artikel an uns:

${productLines}

Lieferadresse:
${address}

Mit freundlichen Grüßen`
  }

  const openOrderModal = async (supplier: Supplier) => {
    setOrderModalOpen(true)
    setOrderModalLoading(true)
    setOrderModalSupplierName(supplier.name)
    setOrderModalData(null)
    setOrderModalSubject(`Bestellung – ${supplier.name}`)
    setOrderModalBody('')
    try {
      const res = await fetch(`/api/admin/suppliers/${supplier.id}/order-template`)
      if (!res.ok) {
        toast({ title: 'Fehler', description: 'Vorlage konnte nicht geladen werden.', variant: 'destructive' })
        setOrderModalOpen(false)
        return
      }
      const data: OrderTemplateData = await res.json()
      setOrderModalData(data)
      setOrderModalSubject(`Bestellung – ${data.supplier.name}`)
      setOrderModalBody(buildDefaultBody(data))
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
      setOrderModalOpen(false)
    } finally {
      setOrderModalLoading(false)
    }
  }

  const orderModalTo = orderModalData?.supplier?.order_email || orderModalData?.supplier?.contact_email || ''

  const handleOpenEmail = () => {
    if (!orderModalTo.trim()) {
      toast({ title: 'Keine E-Mail-Adresse', description: 'Beim Lieferanten keine Bestell-E-Mail hinterlegt.', variant: 'destructive' })
      return
    }
    const subject = encodeURIComponent(orderModalSubject)
    const body = encodeURIComponent(orderModalBody)
    window.location.href = `mailto:${orderModalTo}?subject=${subject}&body=${body}`
    setOrderModalOpen(false)
    toast({ title: 'E-Mail-Client geöffnet' })
  }

  const handleCopyOrder = async () => {
    try {
      await navigator.clipboard.writeText(orderModalBody)
      toast({ title: 'In Zwischenablage kopiert' })
    } catch {
      toast({ title: 'Kopieren fehlgeschlagen', variant: 'destructive' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast({ title: 'Name ist erforderlich', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          contact_phone: form.contact_phone.trim() || undefined,
          contact_person: form.contact_person.trim() || undefined,
          order_email: form.order_email.trim() || undefined,
          website: form.website.trim() || undefined,
          notes: form.notes.trim() || undefined,
          minimum_order_value: form.minimum_order_value ? parseFloat(form.minimum_order_value) : undefined,
          payment_terms: form.payment_terms.trim() || undefined,
          api_endpoint: form.type === 'api' ? (form.api_endpoint.trim() || undefined) : undefined,
          api_key: form.type === 'api' ? (form.api_key.trim() || undefined) : undefined,
          type: form.type,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Lieferant angelegt', description: form.name })
      setForm(emptyForm)
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const statusBadge = (s: Supplier) => {
    const t = s.type ?? (s.api_capable ? 'api' : 'manual')
    if (t === 'api')
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/50">
          <Globe className="w-3 h-3" />
          API
        </span>
      )
    if (t === 'email')
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-luxe-gray text-luxe-silver border border-luxe-gray">
          <Mail className="w-3 h-3" />
          E-Mail
        </span>
      )
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/50">
        <User className="w-3 h-3" />
        Manuell
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Truck className="w-8 h-8 text-luxe-primary" />
          Lieferanten
        </h1>
        <p className="text-luxe-silver">
          Lieferanten mit oder ohne Schnittstelle: Alle Infos an einem Ort. Bei Typ „Manuell“ oder „E-Mail“: Bestellung mit einem Klick per E-Mail-Vorlage ausführen. Firmenadresse unter Einstellungen hinterlegen.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-foreground">Lieferantenliste</CardTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 border-luxe-gray text-foreground hover:bg-luxe-gray"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Abbrechen' : 'Neuer Lieferant'}
            </Button>
            {testStatus === 'running' && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/50 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Test läuft…
              </span>
            )}
            {testStatus === 'success' && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/50">
                <CheckCircle className="w-3 h-3" />
                Verbunden
              </span>
            )}
            {testStatus === 'error' && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/50">
                <XCircle className="w-3 h-3" />
                Fehler
              </span>
            )}
            <Button
              variant="luxe"
              size="sm"
              onClick={handleTestConnector}
              disabled={testStatus === 'running'}
              className="flex items-center gap-2"
            >
              {testStatus === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Schnittstelle testen
            </Button>
          </div>
        </CardHeader>
        {showForm && (
          <CardContent className="pb-6 border-b border-luxe-gray">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
              <div>
                <Label className="text-luxe-silver">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="z. B. Großhändler XYZ"
                  className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-luxe-silver">E-Mail</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="info@lieferant.de"
                    className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-luxe-silver">Bestell-E-Mail (falls abweichend)</Label>
                  <Input
                    type="email"
                    value={form.order_email}
                    onChange={(e) => setForm((f) => ({ ...f, order_email: e.target.value }))}
                    placeholder="bestellung@lieferant.de"
                    className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-luxe-silver">Ansprechpartner</Label>
                  <Input
                    value={form.contact_person}
                    onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
                    placeholder="Name"
                    className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-luxe-silver">Telefon</Label>
                  <Input
                    value={form.contact_phone}
                    onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                    placeholder="+49 …"
                    className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-luxe-silver">Website / Katalog</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://…"
                  className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-luxe-silver">Mindestbestellwert (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.minimum_order_value}
                    onChange={(e) => setForm((f) => ({ ...f, minimum_order_value: e.target.value }))}
                    placeholder="z. B. 100"
                    className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                  />
                </div>
                <div>
                  <Label className="text-luxe-silver">Zahlungsbedingungen</Label>
                  <Input
                    value={form.payment_terms}
                    onChange={(e) => setForm((f) => ({ ...f, payment_terms: e.target.value }))}
                    placeholder="z. B. 14 Tage netto"
                    className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-luxe-silver">Notizen</Label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Lieferzeiten, Besonderheiten, Artikelnummern …"
                  rows={2}
                  className="w-full px-3 py-2 bg-luxe-gray border border-luxe-gray rounded-md text-foreground text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-luxe-silver">Übermittlung</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'email' | 'api' | 'manual' }))}
                  className="mt-1 w-full px-3 py-2 bg-luxe-gray border border-luxe-gray rounded-md text-foreground text-sm"
                >
                  <option value="manual">Manuell (ohne Schnittstelle – Bestellung per E-Mail/Klick)</option>
                  <option value="email">E-Mail (automatisch bei Zahlung)</option>
                  <option value="api">API (automatisch bei Zahlung)</option>
                </select>
              </div>
              {form.type === 'api' && (
                <>
                  <div>
                    <Label className="text-luxe-silver">API-Endpoint (URL)</Label>
                    <Input
                      value={form.api_endpoint}
                      onChange={(e) => setForm((f) => ({ ...f, api_endpoint: e.target.value }))}
                      placeholder="https://api.lieferant.de/orders"
                      className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-luxe-silver">API-Key (optional)</Label>
                    <Input
                      type="password"
                      value={form.api_key}
                      onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                      placeholder="Bearer-Token"
                      className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                      autoComplete="off"
                    />
                  </div>
                </>
              )}
              <Button type="submit" disabled={saving} variant="luxe">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? ' Wird gespeichert…' : ' Lieferant anlegen'}
              </Button>
            </form>
          </CardContent>
        )}
        <CardContent className={showForm ? 'pt-6' : ''}>
          {testMessage && (
            <p className="text-sm text-luxe-silver mb-4">
              {testStatus === 'success' && <span className="text-green-600 dark:text-green-400">{testMessage}</span>}
              {testStatus === 'error' && <span className="text-red-600 dark:text-red-400">{testMessage}</span>}
            </p>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-luxe-silver">
              <Loader2 className="w-6 h-6 animate-spin" />
              Lade Lieferanten…
            </div>
          ) : suppliers.length === 0 ? (
            <div className="py-12 text-center text-luxe-silver">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine Lieferanten angelegt.</p>
              <p className="text-sm mt-1">Klicke auf „Neuer Lieferant“ und trage alle Infos ein – dann ist die Bestellung mit einem Klick möglich.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-luxe-gray">
                    <th className="pb-3 pr-4 text-foreground font-medium">Name</th>
                    <th className="pb-3 pr-4 text-luxe-silver font-medium">Ansprechpartner</th>
                    <th className="pb-3 pr-4 text-luxe-silver font-medium">E-Mail / Telefon</th>
                    <th className="pb-3 pr-4 text-luxe-silver font-medium">Typ</th>
                    <th className="pb-3 pr-4 text-luxe-silver font-medium text-right">Aktion</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b border-luxe-gray/60 last:border-0">
                      <td className="py-3 pr-4">
                        <span className="font-medium text-foreground">{s.name}</span>
                        {s.website && (
                          <a
                            href={s.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-luxe-silver hover:text-luxe-primary inline-flex"
                            title="Website öffnen"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-luxe-silver text-sm">{s.contact_person ?? '—'}</td>
                      <td className="py-3 pr-4 text-luxe-silver text-sm">
                        {s.contact_email ?? '—'}
                        {s.contact_phone && <span className="block mt-0.5">{s.contact_phone}</span>}
                      </td>
                      <td className="py-3 pr-4">{statusBadge(s)}</td>
                      <td className="py-3 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/suppliers/${s.id}`}>
                            <Button variant="admin-outline" size="sm">
                              Bearbeiten
                            </Button>
                          </Link>
                          {(s.type === 'manual' || s.type === 'email' || !s.type) && (s.contact_email || s.order_email) && (
                            <Button
                              variant="admin-outline"
                              size="sm"
                              onClick={() => openOrderModal(s)}
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Bestellung ausführen
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={orderModalOpen} onOpenChange={setOrderModalOpen}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Bestellung ausführen – {orderModalSupplierName}</DialogTitle>
          </DialogHeader>
          {orderModalLoading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-luxe-silver">
              <Loader2 className="w-6 h-6 animate-spin" />
              Lade Vorlage…
            </div>
          ) : orderModalData && (
            <div className="space-y-4">
              <p className="text-sm text-luxe-silver">
                An: <strong className="text-foreground">{orderModalTo || '—'}</strong>
                {!orderModalTo && ' (Beim Lieferanten Bestell-E-Mail eintragen)'}
              </p>
              <div>
                <Label className="text-luxe-silver">Betreff</Label>
                <Input
                  value={orderModalSubject}
                  onChange={(e) => setOrderModalSubject(e.target.value)}
                  className="bg-luxe-gray border-luxe-gray text-foreground mt-1"
                />
              </div>
              <div>
                <Label className="text-luxe-silver">Nachricht (anpassbar)</Label>
                <textarea
                  value={orderModalBody}
                  onChange={(e) => setOrderModalBody(e.target.value)}
                  rows={14}
                  className="w-full px-3 py-2 bg-luxe-gray border border-luxe-gray rounded-md text-foreground text-sm mt-1 font-mono text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="admin-outline" onClick={() => setOrderModalOpen(false)}>
              Schließen
            </Button>
            <Button variant="admin-outline" onClick={handleCopyOrder}>
              <Copy className="w-4 h-4 mr-2" />
              Kopieren
            </Button>
            <Button variant="luxe" onClick={handleOpenEmail} disabled={!orderModalTo.trim()}>
              <Send className="w-4 h-4 mr-2" />
              E-Mail öffnen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}