'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, Loader2, ChevronRight, Plus } from 'lucide-react'
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

interface SafetClaim {
  claim_id: string
  vendor_id: string
  order_id: string
  claim_reason: string
  reason_label: string
  requested_amount: number
  granted_amount: number
  status: string
  status_label: string
  created_at: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'Alle' },
  { value: 'UNDER_INVESTIGATION', label: 'In Prüfung' },
  { value: 'AWAITING_SELLER_INFO', label: 'Warte auf Händler' },
  { value: 'GRANTED', label: 'Bewilligt' },
  { value: 'DENIED', label: 'Abgelehnt' },
]

const REASON_OPTIONS = [
  { value: 'RETURNED_EMPTY_BOX', label: 'Leere Box zurück' },
  { value: 'RETURNED_MATERIALLY_DIFFERENT', label: 'Anderer Artikel zurück' },
  { value: 'RETURNED_DAMAGED', label: 'Beschädigter Artikel' },
  { value: 'NEVER_RECEIVED_RETURN', label: 'Rücksendung nicht erhalten' },
]

export default function AdminSafetClaimsPage() {
  const { toast } = useToast()
  const [claims, setClaims] = useState<SafetClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [vendors, setVendors] = useState<{ id: string; company_name: string }[]>([])
  const [form, setForm] = useState({
    vendor_id: '',
    order_id: '',
    claim_reason: 'RETURNED_EMPTY_BOX',
    requested_amount: '',
    admin_notes: '',
  })

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/admin/safet-claims?${params}`)
      .then((r) => (r.ok ? r.json() : { claims: [] }))
      .then((d) => setClaims(d.claims ?? []))
      .catch(() => setClaims([]))
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(() => {
    fetch('/api/admin/vendors')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setVendors(Array.isArray(d) ? d : []))
      .catch(() => setVendors([]))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendor_id.trim() || !form.order_id.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/safet-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: form.vendor_id,
          order_id: form.order_id.trim(),
          claim_reason: form.claim_reason,
          requested_amount: parseFloat(form.requested_amount) || 0,
          admin_notes: form.admin_notes.trim() || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Fehler')
      }
      const created = await res.json()
      const withLabels = {
        ...created,
        status_label: STATUS_OPTIONS.find((o) => o.value === created.status)?.label ?? created.status,
        reason_label: REASON_OPTIONS.find((o) => o.value === created.claim_reason)?.label ?? created.claim_reason,
      }
      setClaims((prev) => [withLabels, ...prev])
      setForm({ vendor_id: '', order_id: '', claim_reason: 'RETURNED_EMPTY_BOX', requested_amount: '', admin_notes: '' })
      setShowForm(false)
      toast({ title: 'Claim angelegt' })
    } catch (e: unknown) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-luxe-primary" />
          SAFE-T Claims
        </h1>
        <p className="mt-1 text-luxe-silver">
          Händler-Schutz bei Retouren-Betrug (leere Box, beschädigte Ware). Payout aus Plattform-Risikofonds.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Neuer Claim</CardTitle>
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
                  <label className="block text-sm text-luxe-silver mb-1">Bestellung (Order-ID) *</label>
                  <input
                    type="text"
                    required
                    value={form.order_id}
                    onChange={(e) => setForm((f) => ({ ...f, order_id: e.target.value }))}
                    placeholder="UUID der Bestellung"
                    className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">Claim-Grund *</label>
                  <select
                    value={form.claim_reason}
                    onChange={(e) => setForm((f) => ({ ...f, claim_reason: e.target.value }))}
                    className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                  >
                    {REASON_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-luxe-silver mb-1">Beantragter Betrag (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.requested_amount}
                    onChange={(e) => setForm((f) => ({ ...f, requested_amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Admin-Notizen (optional)</label>
                <textarea
                  value={form.admin_notes}
                  onChange={(e) => setForm((f) => ({ ...f, admin_notes: e.target.value }))}
                  placeholder="z. B. Meldung vom Vendor per E-Mail"
                  rows={2}
                  className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                />
              </div>
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Claim anlegen
              </Button>
            </form>
          </CardContent>
        )}
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Eingereichte Claims</CardTitle>
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
          ) : claims.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">Keine SAFE-T Claims.</p>
          ) : (
            <div className="space-y-4">
              {claims.map((c) => (
                <Link
                  key={c.claim_id}
                  href={`/admin/safet-claims/${c.claim_id}`}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray hover:border-luxe-gold/50 transition-colors block"
                >
                  <div>
                    <p className="text-white font-medium">{c.reason_label}</p>
                    <p className="text-sm text-luxe-silver mt-1">
                      Bestellung: {c.order_id.slice(0, 8)}… · Beantragt: {c.requested_amount.toFixed(2)} €
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        c.status === 'GRANTED' ? 'default' : c.status === 'DENIED' ? 'destructive' : 'secondary'
                      }
                    >
                      {c.status_label}
                    </Badge>
                    <span className="text-xs text-luxe-silver">
                      {new Date(c.created_at).toLocaleDateString('de-DE')}
                    </span>
                    <ChevronRight className="w-4 h-4 text-luxe-silver" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
