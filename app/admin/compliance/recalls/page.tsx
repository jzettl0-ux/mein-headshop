'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldAlert, Loader2, Plus, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface Recall {
  recall_id: string
  product_id: string | null
  asin: string | null
  recall_reason: string
  regulatory_authority: string | null
  action_required: string | null
  is_active: boolean
  created_at: string
}

interface RecallWithNotify extends Recall {
  notifying?: boolean
  toggling?: boolean
}

const ACTION_LABELS: Record<string, string> = {
  DESTROY: 'Vernichten',
  RETURN_TO_VENDOR: 'An Vendor zurück',
  SOFTWARE_UPDATE: 'Software-Update',
}

export default function AdminProductRecallsPage() {
  const [recalls, setRecalls] = useState<RecallWithNotify[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    recall_reason: '',
    asin: '',
    product_id: '',
    regulatory_authority: '',
    public_announcement_url: '',
    action_required: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/product-recalls')
      .then((r) => (r.ok ? r.json() : { recalls: [] }))
      .then((d) => setRecalls(d.recalls ?? []))
      .catch(() => setRecalls([]))
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = async () => {
    if (!form.recall_reason.trim()) {
      toast({ title: 'Grund erforderlich', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/product-recalls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recall_reason: form.recall_reason.trim(),
          asin: form.asin.trim() || null,
          product_id: form.product_id || null,
          regulatory_authority: form.regulatory_authority.trim() || null,
          public_announcement_url: form.public_announcement_url.trim() || null,
          action_required: form.action_required || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Fehler')
      }
      const created = await res.json()
      setRecalls((prev) => [created, ...prev])
      setForm({ recall_reason: '', asin: '', product_id: '', regulatory_authority: '', public_announcement_url: '', action_required: '' })
      setShowForm(false)
      toast({ title: 'Rückruf angelegt' })
    } catch (e) {
      toast({ title: 'Fehler', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (recallId: string, newActive: boolean) => {
    setRecalls((prev) => prev.map((r) => (r.recall_id === recallId ? { ...r, toggling: true } : r)))
    try {
      const res = await fetch(`/api/admin/product-recalls/${recallId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newActive }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Fehler')
      }
      const updated = await res.json()
      setRecalls((prev) => prev.map((r) => (r.recall_id === recallId ? { ...r, ...updated, toggling: false } : r)))
      toast({ title: newActive ? 'Rückruf aktiviert' : 'Rückruf deaktiviert' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
      setRecalls((prev) => prev.map((r) => (r.recall_id === recallId ? { ...r, toggling: false } : r)))
    }
  }

  const handleNotifyCustomers = async (recallId: string) => {
    setRecalls((prev) =>
      prev.map((r) => (r.recall_id === recallId ? { ...r, notifying: true } : r))
    )
    try {
      const res = await fetch(`/api/admin/product-recalls/${recallId}/notify-customers`, {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({
        title: 'Kunden benachrichtigt',
        description: data.sent !== undefined ? `${data.sent} E-Mail(s) versendet.` : undefined,
      })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setRecalls((prev) =>
        prev.map((r) => (r.recall_id === recallId ? { ...r, notifying: false } : r))
      )
    }
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-luxe-silver hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Zurück
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldAlert className="h-7 w-7 text-amber-500" />
          Produktrückrufe
        </h1>
        <p className="mt-1 text-luxe-silver">
          Kill-Switch: Sofortige Katalog-Sperre, Logistik-Stopp und Kunden-Warnung bei Rueckrufen.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Aktive Rückrufe</CardTitle>
          <Button variant="luxe" size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="h-4 w-4" />
            Rückruf anlegen
          </Button>
        </CardHeader>
        {showForm && (
          <CardContent className="border-t border-luxe-gray pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Grund *</label>
                <textarea
                  value={form.recall_reason}
                  onChange={(e) => setForm((f) => ({ ...f, recall_reason: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                  rows={2}
                  placeholder="z. B. Akkuthema, behördliche Auflage"
                />
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">ASIN / Produkt-ID</label>
                <input
                  value={form.asin}
                  onChange={(e) => setForm((f) => ({ ...f, asin: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                  placeholder="B0XXYYZZ"
                />
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Behoerde</label>
                <input
                  value={form.regulatory_authority}
                  onChange={(e) => setForm((f) => ({ ...f, regulatory_authority: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                  placeholder="z. B. Bundesnetzagentur"
                />
              </div>
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Erforderliche Maßnahme</label>
                <select
                  value={form.action_required}
                  onChange={(e) => setForm((f) => ({ ...f, action_required: e.target.value }))}
                  className="w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                >
                  <option value="">—</option>
                  {Object.entries(ACTION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button variant="luxe" onClick={handleCreate} disabled={creating} className="gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Rückruf anlegen
            </Button>
          </CardContent>
        )}
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-luxe-silver" />
        </div>
      ) : recalls.length === 0 ? (
        <p className="text-luxe-silver py-8 text-center">Keine Rückrufe vorhanden.</p>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-0">
            <div className="divide-y divide-luxe-gray">
              {recalls.map((r) => (
                <div key={r.recall_id} className="p-4 flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-medium">{r.recall_reason}</p>
                    <p className="text-sm text-luxe-silver mt-1">
                      {r.asin && <span className="mr-3">ASIN: {r.asin}</span>}
                      {r.product_id && <span className="mr-3">Produkt: {r.product_id.slice(0, 8)}…</span>}
                      {r.regulatory_authority && <span>Behörde: {r.regulatory_authority}</span>}
                    </p>
                    {r.action_required && (
                      <Badge variant="secondary" className="mt-2">
                        {ACTION_LABELS[r.action_required] ?? r.action_required}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.is_active && (r.product_id || r.asin) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNotifyCustomers(r.recall_id)}
                        disabled={r.notifying}
                        className="gap-2"
                      >
                        {r.notifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        Kunden benachrichtigen
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(r.recall_id, !r.is_active)}
                      disabled={r.toggling}
                      className={`gap-2 ${r.is_active ? 'border-amber-500/50 text-amber-500 hover:bg-amber-500/10' : 'border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10'}`}
                    >
                      {r.toggling ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : null}
                      {r.is_active ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>
                    {r.is_active ? (
                      <Badge className="bg-amber-600">Aktiv</Badge>
                    ) : (
                      <Badge variant="secondary">Inaktiv</Badge>
                    )}
                    <span className="text-xs text-luxe-silver">
                      {new Date(r.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
