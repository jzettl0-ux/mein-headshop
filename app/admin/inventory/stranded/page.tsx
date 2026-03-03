'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Plus, Loader2, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const REASONS: Record<string, string> = {
  LISTING_DELETED: 'Listing gelöscht',
  ACCOUNT_SUSPENDED: 'Konto gesperrt',
  COMPLIANCE_MISSING: 'Compliance fehlt',
}
const STATUSES: Record<string, string> = {
  PENDING_ACTION: 'Maßnahme ausstehend',
  REMOVAL_REQUESTED: 'Entfernung beantragt',
  LIQUIDATED: 'Verwertet',
  DESTROYED: 'Vernichtet',
}

type Row = {
  stranded_id: string
  vendor_id: string
  vendor_name?: string | null
  asin: string
  stranded_quantity: number
  stranded_reason: string
  stranded_since: string
  accumulated_fees: number
  liquidation_eligible_at: string | null
  status: string
}

export default function AdminStrandedInventoryPage() {
  const [list, setList] = useState<Row[]>([])
  const [vendors, setVendors] = useState<Array<{ id: string; company_name: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    vendor_id: '',
    asin: '',
    stranded_quantity: '1',
    stranded_reason: 'LISTING_DELETED',
    accumulated_fees: '0',
    status: 'PENDING_ACTION',
  })
  const [editForm, setEditForm] = useState({ stranded_quantity: '0', accumulated_fees: '0', status: 'PENDING_ACTION' })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/stranded-inventory')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    load()
    fetch('/api/admin/vendors')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setVendors(Array.isArray(d) ? d : []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.vendor_id || !form.asin.trim()) {
      toast({ title: 'Vendor und ASIN angeben', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/stranded-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: form.vendor_id,
          asin: form.asin.trim().slice(0, 15),
          stranded_quantity: parseInt(form.stranded_quantity, 10) || 0,
          stranded_reason: form.stranded_reason,
          accumulated_fees: parseFloat(form.accumulated_fees) || 0,
          status: form.status,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Stranded-Inventory-Eintrag angelegt' })
      setShowForm(false)
      setForm({ vendor_id: '', asin: '', stranded_quantity: '1', stranded_reason: 'LISTING_DELETED', accumulated_fees: '0', status: 'PENDING_ACTION' })
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/stranded-inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stranded_quantity: parseInt(editForm.stranded_quantity, 10) ?? 0,
          accumulated_fees: parseFloat(editForm.accumulated_fees) || 0,
          status: editForm.status,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Eintrag aktualisiert' })
      setEditingId(null)
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eintrag wirklich löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/stranded-inventory/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Eintrag gelöscht' })
      setEditingId(null)
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (r: Row) => {
    setEditingId(r.stranded_id)
    setEditForm({
      stranded_quantity: String(r.stranded_quantity),
      accumulated_fees: String(r.accumulated_fees ?? 0),
      status: r.status ?? 'PENDING_ACTION',
    })
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-7 h-7 text-luxe-primary" />
            Stranded Inventory
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Gestrandete Bestände (Listing gelöscht, Konto gesperrt, Compliance). liquidation_eligible_at nach 60 Tagen (Trigger).
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neuer Eintrag'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader><CardTitle>Neuer Stranded-Inventory-Eintrag</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Vendor</Label>
                <select
                  value={form.vendor_id}
                  onChange={(e) => setForm((f) => ({ ...f, vendor_id: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md bg-luxe-black border border-luxe-gray text-foreground"
                >
                  <option value="">— wählen —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.company_name ?? v.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>ASIN</Label>
                <Input value={form.asin} onChange={(e) => setForm((f) => ({ ...f, asin: e.target.value }))} placeholder="B0…" maxLength={15} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Menge</Label>
                <Input type="number" min={0} value={form.stranded_quantity} onChange={(e) => setForm((f) => ({ ...f, stranded_quantity: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Grund</Label>
                <select value={form.stranded_reason} onChange={(e) => setForm((f) => ({ ...f, stranded_reason: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-luxe-black border border-luxe-gray text-foreground">
                  {Object.entries(REASONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div>
                <Label>Gebühren (€)</Label>
                <Input type="number" step="0.01" min={0} value={form.accumulated_fees} onChange={(e) => setForm((f) => ({ ...f, accumulated_fees: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Status</Label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-luxe-black border border-luxe-gray text-foreground">
                  {Object.entries(STATUSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Anlegen</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader><CardTitle>Einträge</CardTitle></CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Keine Stranded-Inventory-Einträge.</p>
          ) : (
            <div className="space-y-2">
              {list.map((r) => (
                <div key={r.stranded_id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-mono">{r.asin}</span>
                    <span>{r.vendor_name ?? r.vendor_id}</span>
                    {r.vendor_id && (
                      <Link href={`/admin/vendors/${r.vendor_id}`} className="text-sm text-luxe-primary hover:underline flex items-center gap-1"><ExternalLink className="w-4 h-4" /></Link>
                    )}
                    <span>Menge: {r.stranded_quantity}</span>
                    <span className="text-luxe-silver">{REASONS[r.stranded_reason] ?? r.stranded_reason}</span>
                    <span className="text-sm">{STATUSES[r.status] ?? r.status}</span>
                    <span className="text-sm">Gebühren: {Number(r.accumulated_fees).toFixed(2)} €</span>
                    {r.liquidation_eligible_at && <span className="text-xs text-luxe-silver">Liquidierbar ab: {new Date(r.liquidation_eligible_at).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(r)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(r.stranded_id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  {editingId === r.stranded_id && (
                    <div className="w-full mt-3 pt-3 border-t border-luxe-gray flex flex-wrap gap-3 items-end">
                      <div>
                        <label className="text-xs text-luxe-silver">Menge</label>
                        <Input type="number" min={0} value={editForm.stranded_quantity} onChange={(e) => setEditForm((f) => ({ ...f, stranded_quantity: e.target.value }))} className="h-9 w-24 bg-luxe-black border-luxe-gray" />
                      </div>
                      <div>
                        <label className="text-xs text-luxe-silver">Gebühren</label>
                        <Input type="number" step="0.01" min={0} value={editForm.accumulated_fees} onChange={(e) => setEditForm((f) => ({ ...f, accumulated_fees: e.target.value }))} className="h-9 w-24 bg-luxe-black border-luxe-gray" />
                      </div>
                      <div>
                        <label className="text-xs text-luxe-silver">Status</label>
                        <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="h-9 px-2 rounded bg-luxe-black border border-luxe-gray text-foreground">
                          {Object.entries(STATUSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                      </div>
                      <Button size="sm" onClick={() => handleUpdate(r.stranded_id)} disabled={saving}>Speichern</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Abbrechen</Button>
                    </div>
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
