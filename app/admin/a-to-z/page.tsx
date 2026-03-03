'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const REASON_LABELS: Record<string, string> = {
  ITEM_NOT_RECEIVED: 'Nicht erhalten',
  MATERIALLY_DIFFERENT: 'Erheblich abweichend',
  REFUND_NOT_ISSUED: 'Erstattung verweigert',
  OTHER: 'Sonstiges',
}

const STATUS_LABELS: Record<string, string> = {
  UNDER_REVIEW: 'In Prüfung',
  WAITING_ON_SELLER: 'Warten auf Verkäufer',
  GRANTED: 'Erstattet',
  DENIED: 'Abgelehnt',
  WITHDRAWN: 'Zurückgezogen',
}

interface Claim {
  claim_id: string
  order_id: string
  order_item_id: string | null
  claim_reason: string
  status: string
  claim_amount: number
  description: string | null
  admin_notes: string | null
  resolution_reason: string | null
  opened_at: string
  resolved_at: string | null
  orders?: { order_number: string; total: number; status: string; customer_email: string; customer_name: string }
  order_items?: { product_name: string; quantity: number; price: number } | null
}

export default function AdminAToZPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('_all')
  const [claimNotes, setClaimNotes] = useState<Record<string, { admin_notes: string; resolution_reason: string }>>({})
  const { toast } = useToast()

  const getNotes = (id: string) => claimNotes[id] ?? { admin_notes: '', resolution_reason: '' }
  const setNote = (id: string, key: 'admin_notes' | 'resolution_reason', value: string) => {
    setClaimNotes((prev) => ({ ...prev, [id]: { ...getNotes(id), [key]: value } }))
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/a-to-z-claims')
      if (!res.ok) throw new Error('Laden fehlgeschlagen')
      const data = await res.json()
      setClaims(Array.isArray(data) ? data : [])
    } catch {
      setClaims([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const init: Record<string, { admin_notes: string; resolution_reason: string }> = {}
    claims.forEach((c) => {
      if (c.admin_notes || c.resolution_reason) {
        init[c.claim_id] = {
          admin_notes: c.admin_notes ?? '',
          resolution_reason: c.resolution_reason ?? '',
        }
      }
    })
    if (Object.keys(init).length > 0) {
      setClaimNotes((prev) => ({ ...init, ...prev }))
    }
  }, [claims])

  const handleStatusChange = async (claimId: string, status: string) => {
    setUpdatingId(claimId)
    try {
      const res = await fetch(`/api/admin/a-to-z-claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          admin_notes: getNotes(claimId).admin_notes.trim() || undefined,
          resolution_reason: getNotes(claimId).resolution_reason.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Aktualisierung fehlgeschlagen')
      }
      setClaims((prev) =>
        prev.map((c) =>
          c.claim_id === claimId ? { ...c, status, resolved_at: ['GRANTED', 'DENIED', 'WITHDRAWN'].includes(status) ? new Date().toISOString() : null } : c
        )
      )
      toast({ title: 'Status aktualisiert' })
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Unbekannt', variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')
  const formatPrice = (n: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)

  const filtered = statusFilter && statusFilter !== '_all' ? claims.filter((c) => c.status === statusFilter) : claims
  const openCount = claims.filter((c) => ['UNDER_REVIEW', 'WAITING_ON_SELLER'].includes(c.status)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center">
          <ShieldCheck className="w-7 h-7 mr-2 text-luxe-gold" />
          A-bis-z-Garantie
        </h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-luxe-charcoal border-luxe-gray text-white">
            <SelectValue placeholder="Alle Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">Alle Status</SelectItem>
            <SelectItem value="UNDER_REVIEW">In Prüfung</SelectItem>
            <SelectItem value="WAITING_ON_SELLER">Warten auf Verkäufer</SelectItem>
            <SelectItem value="GRANTED">Erstattet</SelectItem>
            <SelectItem value="DENIED">Abgelehnt</SelectItem>
            <SelectItem value="WITHDRAWN">Zurückgezogen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-luxe-silver text-sm">
        Käuferschutz: Ansprüche bei nicht erhalten, erheblich abweichend oder verweigerter Erstattung. Offen: {openCount}
      </p>

      {loading ? (
        <p className="text-luxe-silver">Laden...</p>
      ) : filtered.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Ansprüche{statusFilter && statusFilter !== '_all' ? ' mit diesem Status' : ''} vorhanden.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const order = c.orders as Claim['orders']
            const isExpanded = expandedId === c.claim_id
            const isResolved = ['GRANTED', 'DENIED', 'WITHDRAWN'].includes(c.status)
            return (
              <Card key={c.claim_id} className="bg-luxe-charcoal border-luxe-gray">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Link
                          href={`/admin/orders/${c.order_id}`}
                          className="font-medium text-luxe-gold hover:underline"
                        >
                          #{order?.order_number ?? c.order_id.slice(0, 8)}
                        </Link>
                        <Badge variant={isResolved ? 'secondary' : 'default'}>{STATUS_LABELS[c.status] ?? c.status}</Badge>
                        <span className="text-luxe-silver text-sm">{REASON_LABELS[c.claim_reason] ?? c.claim_reason}</span>
                      </div>
                      <p className="text-sm text-luxe-silver">
                        {order?.customer_name} · {order?.customer_email} · {formatPrice(c.claim_amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isResolved && (
                        <Select
                          value={c.status}
                          onValueChange={(v) => handleStatusChange(c.claim_id, v)}
                          disabled={updatingId === c.claim_id}
                        >
                          <SelectTrigger className="w-48 bg-luxe-black border-luxe-gray text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="UNDER_REVIEW">In Prüfung</SelectItem>
                            <SelectItem value="WAITING_ON_SELLER">Warten auf Verkäufer</SelectItem>
                            <SelectItem value="GRANTED">Erstattet</SelectItem>
                            <SelectItem value="DENIED">Abgelehnt</SelectItem>
                            <SelectItem value="WITHDRAWN">Zurückgezogen</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="admin-outline"
                        size="icon"
                        onClick={() => setExpandedId(isExpanded ? null : c.claim_id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Link href={`/admin/orders/${c.order_id}`}>
                        <Button variant="admin-outline" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-luxe-gray space-y-3 text-sm text-luxe-silver">
                      <p><strong>Geöffnet:</strong> {formatDate(c.opened_at)}</p>
                      {c.resolved_at && <p><strong>Abgeschlossen:</strong> {formatDate(c.resolved_at)}</p>}
                      {c.description && <p><strong>Beschreibung:</strong> {c.description}</p>}
                      {c.order_items && (
                        <p><strong>Artikel:</strong> {c.order_items.product_name} × {c.order_items.quantity}</p>
                      )}
                      {(c.admin_notes || c.resolution_reason) && (
                        <>
                          {c.admin_notes && <p><strong>Admin-Notizen:</strong> {c.admin_notes}</p>}
                          {c.resolution_reason && <p><strong>Abschlussgrund:</strong> {c.resolution_reason}</p>}
                        </>
                      )}
                      {!isResolved && (
                        <div className="grid gap-2 pt-2">
                          <div>
                            <label className="text-xs text-luxe-silver block mb-1">Admin-Notizen (optional)</label>
                            <input
                              type="text"
                              value={getNotes(c.claim_id).admin_notes}
                              onChange={(e) => setNote(c.claim_id, 'admin_notes', e.target.value)}
                              placeholder="Interne Notiz"
                              className="w-full rounded bg-luxe-black border border-luxe-gray px-2 py-1.5 text-white text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-luxe-silver block mb-1">Abschlussgrund (bei Erstattung/Ablehnung)</label>
                            <input
                              type="text"
                              value={getNotes(c.claim_id).resolution_reason}
                              onChange={(e) => setNote(c.claim_id, 'resolution_reason', e.target.value)}
                              placeholder="z. B. Erstattung per Gutschrift"
                              className="w-full rounded bg-luxe-black border border-luxe-gray px-2 py-1.5 text-white text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
