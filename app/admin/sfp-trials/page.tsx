'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Truck, Loader2, Pencil, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

type Trial = {
  trial_id: string
  vendor_id: string
  trial_start_date: string
  orders_shipped_count: number
  on_time_deliveries_count: number
  valid_tracking_count: number
  status: string
  on_time_delivery_rate: number
  last_evaluated_at: string | null
  vendor_name: string | null
  vendor_email: string | null
}

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'Läuft',
  APPROVED: 'Bestanden',
  FAILED: 'Nicht bestanden',
  REVOKED: 'Zurückgezogen',
}

export default function AdminSfpTrialsPage() {
  const [list, setList] = useState<Trial[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    orders_shipped_count: '0',
    on_time_deliveries_count: '0',
    valid_tracking_count: '0',
    status: 'IN_PROGRESS',
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/sfp-trials')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    load()
    setLoading(false)
  }, [])

  const startEdit = (t: Trial) => {
    setEditingId(t.trial_id)
    setForm({
      orders_shipped_count: String(t.orders_shipped_count ?? 0),
      on_time_deliveries_count: String(t.on_time_deliveries_count ?? 0),
      valid_tracking_count: String(t.valid_tracking_count ?? 0),
      status: t.status ?? 'IN_PROGRESS',
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/sfp-trials/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders_shipped_count: parseInt(form.orders_shipped_count, 10) || 0,
          on_time_deliveries_count: parseInt(form.on_time_deliveries_count, 10) || 0,
          valid_tracking_count: parseInt(form.valid_tracking_count, 10) || 0,
          status: form.status,
          last_evaluated_at: new Date().toISOString(),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'SFP-Trial aktualisiert' })
      setEditingId(null)
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Truck className="w-7 h-7 text-luxe-primary" />
          SFP Trials (Seller-Fulfilled Prime)
        </h1>
        <p className="text-luxe-silver text-sm mt-1">
          Pro Vendor ein Trial: pünktliche Lieferung, gültige Sendungsverfolgung. Status: IN_PROGRESS, APPROVED, FAILED, REVOKED.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle>Trials</CardTitle>
          <p className="text-sm text-luxe-silver">on_time_delivery_rate wird aus Zählern berechnet (GENERATED). Neue Trials über API POST mit vendor_id anlegen.</p>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Noch keine SFP-Trials. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">vendor_performance.sfp_trials</code> über Migration angelegt; neue Trials per API anlegen.</p>
          ) : (
            <div className="space-y-4">
              {list.map((t) => (
                <div
                  key={t.trial_id}
                  className="p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="font-medium">{t.vendor_name ?? t.vendor_id}</span>
                      {t.vendor_id && (
                        <Link href={`/admin/vendors/${t.vendor_id}`} className="text-sm text-luxe-primary hover:underline flex items-center gap-1">
                          <ExternalLink className="w-4 h-4" /> Vendor
                        </Link>
                      )}
                      <span className="text-sm text-luxe-silver">{STATUS_LABELS[t.status] ?? t.status}</span>
                      <span className="text-sm">Pünktlich: {(Number(t.on_time_delivery_rate) * 100).toFixed(2)}%</span>
                      <span className="text-sm">{t.orders_shipped_count} Versendet, {t.on_time_deliveries_count} pünktlich, {t.valid_tracking_count} Tracking</span>
                      {t.last_evaluated_at && (
                        <span className="text-xs text-luxe-silver">Bewertet: {new Date(t.last_evaluated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(t)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </div>
                  {editingId === t.trial_id && (
                    <form onSubmit={handleSave} className="mt-4 pt-4 border-t border-luxe-gray grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-xs text-luxe-silver">Versendet</label>
                        <input
                          type="number"
                          min={0}
                          value={form.orders_shipped_count}
                          onChange={(e) => setForm((f) => ({ ...f, orders_shipped_count: e.target.value }))}
                          className="w-full h-9 px-2 rounded bg-luxe-black border border-luxe-gray text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-luxe-silver">Pünktlich</label>
                        <input
                          type="number"
                          min={0}
                          value={form.on_time_deliveries_count}
                          onChange={(e) => setForm((f) => ({ ...f, on_time_deliveries_count: e.target.value }))}
                          className="w-full h-9 px-2 rounded bg-luxe-black border border-luxe-gray text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-luxe-silver">Gültiges Tracking</label>
                        <input
                          type="number"
                          min={0}
                          value={form.valid_tracking_count}
                          onChange={(e) => setForm((f) => ({ ...f, valid_tracking_count: e.target.value }))}
                          className="w-full h-9 px-2 rounded bg-luxe-black border border-luxe-gray text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-luxe-silver">Status</label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                          className="w-full h-9 px-2 rounded bg-luxe-black border border-luxe-gray text-foreground"
                        >
                          {Object.entries(STATUS_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2 md:col-span-4 flex gap-2">
                        <Button type="submit" disabled={saving}>
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Speichern
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                          Abbrechen
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
