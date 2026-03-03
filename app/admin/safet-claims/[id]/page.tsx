'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ShieldCheck, ArrowLeft, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const STATUS_OPTIONS = [
  { value: 'UNDER_INVESTIGATION', label: 'In Prüfung' },
  { value: 'AWAITING_SELLER_INFO', label: 'Warte auf Händler-Infos' },
  { value: 'GRANTED', label: 'Bewilligt' },
  { value: 'DENIED', label: 'Abgelehnt' },
]

const REASON_LABELS: Record<string, string> = {
  RETURNED_EMPTY_BOX: 'Leere Box zurück',
  RETURNED_MATERIALLY_DIFFERENT: 'Anderer Artikel zurück',
  RETURNED_DAMAGED: 'Beschädigter Artikel',
  NEVER_RECEIVED_RETURN: 'Rücksendung nicht erhalten',
}

interface Claim {
  claim_id: string
  vendor_id: string
  order_id: string
  order_item_id?: string | null
  order_line_id?: string | null
  claim_reason: string
  requested_amount: number
  granted_amount: number
  evidence_urls: string[] | unknown
  status: string
  admin_notes: string | null
  created_at: string
  resolved_at: string | null
}

export default function AdminSafetClaimDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const id = typeof params?.id === 'string' ? params.id : ''
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusInput, setStatusInput] = useState('')
  const [grantedAmountInput, setGrantedAmountInput] = useState('')
  const [adminNotesInput, setAdminNotesInput] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/safet-claims/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        setClaim(c ?? null)
        if (c) {
          setStatusInput(c.status || '')
          setGrantedAmountInput(String(c.granted_amount ?? ''))
          setAdminNotesInput(c.admin_notes || '')
        }
      })
      .catch(() => setClaim(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async () => {
    if (!id || !claim) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = {}
      if (statusInput && statusInput !== claim.status) body.status = statusInput
      if (grantedAmountInput !== String(claim.granted_amount ?? ''))
        body.granted_amount = parseFloat(grantedAmountInput) || 0
      if (adminNotesInput !== (claim.admin_notes || '')) body.admin_notes = adminNotesInput
      if (Object.keys(body).length === 0) {
        toast({ title: 'Keine Änderungen', variant: 'default' })
        setSaving(false)
        return
      }
      const res = await fetch(`/api/admin/safet-claims/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Speichern fehlgeschlagen')
      }
      const updated = await res.json()
      setClaim(updated)
      setGrantedAmountInput(String(updated.granted_amount ?? ''))
      setAdminNotesInput(updated.admin_notes || '')
      toast({ title: 'Änderungen gespeichert' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-luxe-primary" />
      </div>
    )
  }
  if (!claim) {
    return (
      <div className="space-y-6">
        <Link href="/admin/safet-claims" className="inline-flex items-center gap-2 text-luxe-silver hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Link>
        <p className="text-luxe-silver">Claim nicht gefunden.</p>
      </div>
    )
  }

  const evidence = Array.isArray(claim.evidence_urls) ? claim.evidence_urls : []
  const reasonLabel = REASON_LABELS[claim.claim_reason] ?? claim.claim_reason

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/safet-claims"
            className="inline-flex items-center gap-2 text-luxe-silver hover:text-white mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Zurück zu SAFE-T Claims
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-luxe-primary" />
            Claim: {reasonLabel}
          </h1>
          <p className="mt-1 text-luxe-silver">
            {claim.claim_id.slice(0, 8)}… · Erstellt {new Date(claim.created_at).toLocaleString('de-DE')}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-luxe-silver">Begründung</p>
              <p className="text-white font-medium">{reasonLabel}</p>
            </div>
            <div>
              <p className="text-sm text-luxe-silver">Beantragter Betrag</p>
              <p className="text-white">{Number(claim.requested_amount).toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-sm text-luxe-silver">Order / Items</p>
              <Link
                href={`/admin/orders/${claim.order_id}`}
                className="inline-flex items-center gap-1 text-luxe-primary hover:underline"
              >
                {claim.order_id.slice(0, 8)}…
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            {evidence.length > 0 && (
              <div>
                <p className="text-sm text-luxe-silver">Beweismittel</p>
                <ul className="text-sm">
                  {evidence.map((url, i) => (
                    <li key={i}>
                      <a
                        href={typeof url === 'string' ? url : String(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-luxe-primary hover:underline"
                      >
                        Link {i + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Bearbeiten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Status</label>
              <Select value={statusInput} onValueChange={setStatusInput}>
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Bewilligter Betrag (€)</label>
              <input
                type="number"
                step="0.01"
                value={grantedAmountInput}
                onChange={(e) => setGrantedAmountInput(e.target.value)}
                className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Admin-Notizen</label>
              <Textarea
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                className="bg-luxe-black border-luxe-gray text-white min-h-[100px]"
                placeholder="Interne Notizen…"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Badge
              variant={
                claim.status === 'GRANTED'
                  ? 'default'
                  : claim.status === 'DENIED'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {claim.status}
            </Badge>
            {claim.resolved_at && (
              <span className="text-sm text-luxe-silver">
                Abgeschlossen: {new Date(claim.resolved_at).toLocaleString('de-DE')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
