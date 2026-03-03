'use client'

import { useState, useEffect } from 'react'
import { Plug, Plus, RefreshCw, Loader2, Trash2, Check, XCircle, Truck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

interface Integration {
  id: string
  name: string
  connector_type: string
  api_endpoint: string
  sync_interval_minutes: number
  is_active: boolean
  last_sync_at: string | null
  last_sync_status: 'success' | 'error' | 'pending' | null
  last_sync_message: string | null
  suppliers?: { id: string; name: string } | null
}

const CONNECTOR_TYPES = [
  { value: 'influencer_api', label: 'Influencer / Partner JSON-API' },
]

interface Supplier {
  id: string
  name: string
  contact_email?: string | null
  api_capable?: boolean
  connector_type?: string | null
}

export default function AdminIntegrationsPage() {
  const [list, setList] = useState<Integration[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    connector_type: 'influencer_api',
    api_endpoint: '',
    api_key: '',
    sync_interval_minutes: 60,
    supplier_id: '' as string,
  })
  const [saving, setSaving] = useState(false)
  const [dhlTesting, setDhlTesting] = useState(false)
  const [dhlStatus, setDhlStatus] = useState<{ ok: boolean; message: string; config?: Record<string, boolean> } | null>(null)
  const { toast } = useToast()

  const testDhlConnection = async () => {
    setDhlTesting(true)
    setDhlStatus(null)
    try {
      const res = await fetch('/api/admin/dhl/test-connection')
      const data = await res.json()
      setDhlStatus({ ok: data.ok, message: data.message, config: data.config })
      if (data.ok) toast({ title: 'DHL OAuth OK', description: data.message })
      else toast({ title: 'DHL-Verbindung', description: data.message, variant: 'destructive' })
    } catch {
      setDhlStatus({ ok: false, message: 'Netzwerkfehler' })
      toast({ title: 'Fehler', description: 'Verbindungstest fehlgeschlagen', variant: 'destructive' })
    } finally {
      setDhlTesting(false)
    }
  }

  const load = () => {
    setLoading(true)
    fetch('/api/admin/integrations')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    fetch('/api/admin/suppliers')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          connector_type: form.connector_type,
          api_endpoint: form.api_endpoint.trim(),
          api_key: form.api_key.trim() || undefined,
          sync_interval_minutes: form.sync_interval_minutes,
          supplier_id: form.supplier_id || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Schnittstelle angelegt', description: form.name })
      setForm({ name: '', connector_type: 'influencer_api', api_endpoint: '', api_key: '', sync_interval_minutes: 60, supplier_id: '' })
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async (id: string) => {
    setSyncingId(id)
    try {
      const res = await fetch(`/api/admin/integrations/${id}/sync`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (data.success) {
        toast({ title: 'Sync erfolgreich', description: data.message })
      } else {
        toast({ title: 'Sync fehlgeschlagen', description: data.message || data.error, variant: 'destructive' })
      }
      load()
    } catch {
      toast({ title: 'Fehler', description: 'Sync konnte nicht gestartet werden.', variant: 'destructive' })
    } finally {
      setSyncingId(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Schnittstelle „${name}“ wirklich löschen?`)) return
    try {
      const res = await fetch(`/api/admin/integrations/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({ title: 'Löschen fehlgeschlagen', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Schnittstelle gelöscht' })
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const statusBadge = (row: Integration) => {
    const s = row.last_sync_status
    if (!s || s === 'pending')
      return <span className="text-xs px-2 py-0.5 rounded bg-luxe-gray text-luxe-silver">Noch nie</span>
    if (s === 'success')
      return <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/50">Erfolg</span>
    return <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/50">Fehler</span>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Plug className="w-8 h-8 text-luxe-gold" />
          Schnittstellen
        </h1>
        <p className="text-luxe-silver">
          Externe APIs von Partnern und Influencern verwalten – Endpoints, API-Keys und Sync-Intervalle. Produktdaten und Bestände werden automatisch oder per „Sync Now“ abgeglichen.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-luxe-gold" />
              DHL Parcel DE API (Phase 2.1)
            </CardTitle>
            <p className="text-sm text-luxe-silver mt-1">OAuth & Label-Generierung. Credentials in .env.local (DHL_API_KEY, DHL_API_SECRET, DHL_GKP_*).</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testDhlConnection}
            disabled={dhlTesting}
            className="flex items-center gap-2 border-luxe-gray text-foreground hover:bg-luxe-gray"
          >
            {dhlTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Verbindung testen
          </Button>
        </CardHeader>
        {dhlStatus && (
          <CardContent className="pt-0">
            <div className={`p-4 rounded-lg border ${dhlStatus.ok ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
              <p className={dhlStatus.ok ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{dhlStatus.message}</p>
              {dhlStatus.config && (
                <p className="text-luxe-silver text-xs mt-2">
                  API-Key: {dhlStatus.config.hasApiKey ? '✓' : '✗'} · Secret: {dhlStatus.config.hasApiSecret ? '✓' : '✗'} ·
                  GKP: {dhlStatus.config.hasGkpUsername ? '✓' : '✗'} · Billing: {dhlStatus.config.hasBillingNumber ? '✓' : '✗'} ·
                  {dhlStatus.config.sandbox ? ' Sandbox' : ' Produktion'}
                </p>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <CardTitle className="text-white">Aktive Integrationen</CardTitle>
          <Button
            variant="luxe"
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Abbrechen' : 'Neue Schnittstelle'}
          </Button>
        </CardHeader>
        {showForm && (
          <CardContent className="pb-6 border-b border-luxe-gray">
            <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
              <div>
                <Label className="text-luxe-silver">Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="z. B. Partner X API"
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                  required
                />
              </div>
              <div>
                <Label className="text-luxe-silver">Schnittstellen-Typ</Label>
                <select
                  value={form.connector_type}
                  onChange={(e) => setForm((f) => ({ ...f, connector_type: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
                >
                  {CONNECTOR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-luxe-silver">API-Endpoint (URL)</Label>
                <Input
                  value={form.api_endpoint}
                  onChange={(e) => setForm((f) => ({ ...f, api_endpoint: e.target.value }))}
                  placeholder="https://api.partner.com/products"
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                  type="url"
                  required
                />
              </div>
              <div>
                <Label className="text-luxe-silver">API-Key (optional)</Label>
                <Input
                  value={form.api_key}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  placeholder="Bearer-Token oder Key"
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                  type="password"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label className="text-luxe-silver">Lieferant (optional)</Label>
                <select
                  value={form.supplier_id}
                  onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
                >
                  <option value="">— Keiner —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-luxe-silver">Sync-Intervall (Minuten)</Label>
                <Input
                  type="number"
                  min={5}
                  max={10080}
                  value={form.sync_interval_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, sync_interval_minutes: parseInt(e.target.value, 10) || 60 }))}
                  className="bg-luxe-gray border-luxe-silver text-white mt-1 w-32"
                />
                <p className="text-xs text-luxe-silver/80 mt-1">Cron führt den Sync automatisch in diesem Intervall aus.</p>
              </div>
              <Button type="submit" disabled={saving} variant="luxe">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? ' Wird gespeichert…' : ' Anlegen'}
              </Button>
            </form>
          </CardContent>
        )}
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-luxe-silver">
              <Loader2 className="w-6 h-6 animate-spin" />
              Lade Integrationen…
            </div>
          ) : list.length === 0 ? (
            <div className="py-12 text-center text-luxe-silver">
              <Plug className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine Schnittstellen angelegt.</p>
              <p className="text-sm mt-1">Klicke auf „Neue Schnittstelle“, um eine Partner- oder Influencer-API anzubinden.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-luxe-gray">
                    <th className="pb-3 pr-4 text-luxe-silver font-medium">Name</th>
                    <th className="pb-3 pr-4 text-luxe-silver font-medium">Typ</th>
                    <th className="pb-3 pr-4 text-luxe-silver font-medium">Endpoint</th>
                    <th className="pb-3 pr-4 text-luxe-silver font-medium">Intervall</th>
                    <th className="pb-3 pr-4 text-luxe-silver font-medium">Letzter Sync</th>
                    <th className="pb-3 text-luxe-silver font-medium text-right">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row.id} className="border-b border-luxe-gray/70 hover:bg-luxe-gray/30">
                      <td className="py-3 pr-4">
                        <span className="text-white font-medium">{row.name}</span>
                        {!row.is_active && (
                          <span className="ml-2 text-xs text-amber-400">(inaktiv)</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-luxe-silver text-sm">
                        {CONNECTOR_TYPES.find((t) => t.value === row.connector_type)?.label ?? row.connector_type}
                      </td>
                      <td className="py-3 pr-4 text-luxe-silver text-sm max-w-[200px] truncate" title={row.api_endpoint}>
                        {row.api_endpoint}
                      </td>
                      <td className="py-3 pr-4 text-luxe-silver text-sm">{row.sync_interval_minutes} min</td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-col gap-0.5">
                          {statusBadge(row)}
                          {row.last_sync_at && (
                            <span className="text-xs text-luxe-silver/80">{formatDate(row.last_sync_at)}</span>
                          )}
                          {row.last_sync_message && row.last_sync_status === 'error' && (
                            <span className="text-xs text-red-400 max-w-[180px] truncate" title={row.last_sync_message}>{row.last_sync_message}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-luxe-gold/50 text-luxe-gold hover:bg-luxe-gold/10"
                            onClick={() => handleSync(row.id)}
                            disabled={syncingId === row.id}
                          >
                            {syncingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {syncingId === row.id ? ' Sync…' : ' Sync Now'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => handleDelete(row.id, row.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white text-base">Lieferanten</CardTitle>
          <p className="text-sm text-luxe-silver">
            Optional: Lieferanten anlegen und bei Schnittstellen zuordnen. Produkte werden beim Sync mit dem gewählten Lieferanten verknüpft (supplier_id).
          </p>
        </CardHeader>
        <CardContent>
          <SupplierSection suppliers={suppliers} onAdded={load} />
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white text-base">Cron (automatischer Sync)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-luxe-silver">
            Rufe regelmäßig auf: <code className="bg-luxe-gray px-1.5 py-0.5 rounded text-luxe-gold text-xs">GET /api/cron/sync-products?secret=DEIN_CRON_SECRET</code>
            {' '}– dann werden alle aktiven Schnittstellen im konfigurierten Intervall abgeglichen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function SupplierSection({ suppliers, onAdded }: { suppliers: Supplier[]; onAdded: () => void }) {
  const [name, setName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [apiCapable, setApiCapable] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), contact_email: contactEmail.trim() || undefined, api_capable: apiCapable }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Lieferant angelegt', description: name })
      setName('')
      setContactEmail('')
      setApiCapable(false)
      onAdded()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-luxe-silver text-xs">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lieferant XY" className="bg-luxe-gray border-luxe-silver text-white mt-1 w-48" />
        </div>
        <div>
          <Label className="text-luxe-silver text-xs">Kontakt E-Mail</Label>
          <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} type="email" placeholder="partner@example.com" className="bg-luxe-gray border-luxe-silver text-white mt-1 w-52" />
        </div>
        <label className="flex items-center gap-2 text-luxe-silver text-sm cursor-pointer">
          <input type="checkbox" checked={apiCapable} onChange={(e) => setApiCapable(e.target.checked)} className="rounded text-luxe-gold" />
          API-fähig
        </label>
        <Button type="submit" disabled={saving || !name.trim()} size="sm" variant="outline" className="border-luxe-gold text-luxe-gold">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {saving ? ' …' : ' Anlegen'}
        </Button>
      </form>
      {suppliers.length > 0 && (
        <div className="text-sm text-luxe-silver">
          <span className="font-medium text-white">{suppliers.length} Lieferant(en):</span>{' '}
          {suppliers.map((s) => s.name).join(', ')}
        </div>
      )}
    </div>
  )
}
