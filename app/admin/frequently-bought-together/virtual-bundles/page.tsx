'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Plus, Loader2, Pencil, Trash2, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Bundle = { bundle_asin: string; vendor_id: string; vendor_name?: string | null; bundle_title: string; bundle_price: number; is_active: boolean }
type BundleFull = Bundle & { components: Array<{ mapping_id: string; component_asin: string; quantity_required: number }> }

export default function AdminVirtualBundlesPage() {
  const [list, setList] = useState<Bundle[]>([])
  const [vendors, setVendors] = useState<Array<{ id: string; company_name: string | null }>>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [expandedAsin, setExpandedAsin] = useState<string | null>(null)
  const [fullBundle, setFullBundle] = useState<BundleFull | null>(null)
  const [form, setForm] = useState({ bundle_asin: '', vendor_id: '', bundle_title: '', bundle_price: '', is_active: true })
  const [editForm, setEditForm] = useState({ bundle_title: '', bundle_price: '', is_active: true })
  const [editingAsin, setEditingAsin] = useState<string | null>(null)
  const [newComponentAsin, setNewComponentAsin] = useState('')
  const [newComponentQty, setNewComponentQty] = useState('1')
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/virtual-bundles')
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

  useEffect(() => {
    if (!expandedAsin) {
      setFullBundle(null)
      return
    }
    fetch(`/api/admin/virtual-bundles/${encodeURIComponent(expandedAsin)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setFullBundle)
      .catch(() => setFullBundle(null))
  }, [expandedAsin])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.bundle_asin.trim() || !form.vendor_id || !form.bundle_title.trim()) {
      toast({ title: 'ASIN, Vendor und Titel angeben', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/virtual-bundles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundle_asin: form.bundle_asin.trim().slice(0, 15),
          vendor_id: form.vendor_id,
          bundle_title: form.bundle_title.trim(),
          bundle_price: parseFloat(form.bundle_price) || 0,
          is_active: form.is_active,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Bundle angelegt' })
      setShowForm(false)
      setForm({ bundle_asin: '', vendor_id: '', bundle_title: '', bundle_price: '', is_active: true })
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (asin: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/virtual-bundles/${encodeURIComponent(asin)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundle_title: editForm.bundle_title.trim(),
          bundle_price: parseFloat(editForm.bundle_price) || 0,
          is_active: editForm.is_active,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Bundle aktualisiert' })
      setEditingAsin(null)
      load()
      if (expandedAsin === asin) fetch(`/api/admin/virtual-bundles/${encodeURIComponent(asin)}`).then((r) => r.ok && r.json()).then(setFullBundle)
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (asin: string) => {
    if (!confirm('Bundle und alle Komponenten löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/virtual-bundles/${encodeURIComponent(asin)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Bundle gelöscht' })
      setExpandedAsin(null)
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddComponent = async (bundleAsin: string) => {
    if (!newComponentAsin.trim()) {
      toast({ title: 'Komponenten-ASIN angeben', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/virtual-bundles/${encodeURIComponent(bundleAsin)}/components`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ component_asin: newComponentAsin.trim().slice(0, 15), quantity_required: parseInt(newComponentQty, 10) || 1 }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Komponente hinzugefügt' })
      setNewComponentAsin('')
      setNewComponentQty('1')
      fetch(`/api/admin/virtual-bundles/${encodeURIComponent(bundleAsin)}`).then((r) => r.ok && r.json()).then(setFullBundle)
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteComponent = async (mappingId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/virtual-bundle-components/${mappingId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Komponente entfernt' })
      if (fullBundle) fetch(`/api/admin/virtual-bundles/${encodeURIComponent(fullBundle.bundle_asin)}`).then((r) => r.ok && r.json()).then(setFullBundle)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-7 h-7 text-luxe-primary" />
            Virtual Bundles
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Bundle-ASIN, Vendor, Titel, Preis; Komponenten (ASIN + Menge). Nur bei catalog ASIN.
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neues Bundle'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader><CardTitle>Neues Bundle</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Bundle-ASIN</Label>
                <Input value={form.bundle_asin} onChange={(e) => setForm((f) => ({ ...f, bundle_asin: e.target.value }))} maxLength={15} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Vendor</Label>
                <select value={form.vendor_id} onChange={(e) => setForm((f) => ({ ...f, vendor_id: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-luxe-black border border-luxe-gray text-foreground">
                  <option value="">— wählen —</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.company_name ?? v.id}</option>)}
                </select>
              </div>
              <div>
                <Label>Titel</Label>
                <Input value={form.bundle_title} onChange={(e) => setForm((f) => ({ ...f, bundle_title: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Preis (€)</Label>
                <Input type="number" step="0.01" min={0} value={form.bundle_price} onChange={(e) => setForm((f) => ({ ...f, bundle_price: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="bundle_active" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} className="rounded border-luxe-gray" />
                <Label htmlFor="bundle_active">Aktiv</Label>
              </div>
              <div><Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Anlegen</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader><CardTitle>Bundles</CardTitle></CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Keine Virtual Bundles. Tabelle nur bei catalog ASIN.</p>
          ) : (
            <div className="space-y-2">
              {list.map((b) => (
                <div key={b.bundle_asin} className="rounded-lg border border-luxe-gray bg-luxe-black/50">
                  <div className="flex items-center gap-2 p-3">
                    <button type="button" onClick={() => setExpandedAsin(expandedAsin === b.bundle_asin ? null : b.bundle_asin)} className="p-1">
                      {expandedAsin === b.bundle_asin ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {editingAsin === b.bundle_asin ? (
                      <>
                        <Input value={editForm.bundle_title} onChange={(e) => setEditForm((f) => ({ ...f, bundle_title: e.target.value }))} className="h-9 w-48 bg-luxe-black border-luxe-gray" />
                        <Input type="number" step="0.01" value={editForm.bundle_price} onChange={(e) => setEditForm((f) => ({ ...f, bundle_price: e.target.value }))} className="h-9 w-20 bg-luxe-black border-luxe-gray" />
                        <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm((f) => ({ ...f, is_active: e.target.checked }))} />
                        <Button size="sm" onClick={() => handleUpdate(b.bundle_asin)} disabled={saving}>Speichern</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingAsin(null)}>Abbrechen</Button>
                      </>
                    ) : (
                      <>
                        <span className="font-mono">{b.bundle_asin}</span>
                        <span>{b.bundle_title}</span>
                        <span>{Number(b.bundle_price).toFixed(2)} €</span>
                        <span className="text-luxe-silver">{b.vendor_name ?? b.vendor_id}</span>
                        {!b.is_active && <span className="text-amber-500 text-sm">Inaktiv</span>}
                        <Button variant="ghost" size="sm" onClick={() => { setEditingAsin(b.bundle_asin); setEditForm({ bundle_title: b.bundle_title, bundle_price: String(b.bundle_price), is_active: b.is_active }); }}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(b.bundle_asin)}><Trash2 className="w-4 h-4" /></Button>
                      </>
                    )}
                  </div>
                  {expandedAsin === b.bundle_asin && fullBundle?.bundle_asin === b.bundle_asin && (
                    <div className="border-t border-luxe-gray p-4 space-y-2">
                      <p className="text-sm font-medium">Komponenten</p>
                      {fullBundle.components.map((c) => (
                        <div key={c.mapping_id} className="flex items-center gap-2 text-sm">
                          <span className="font-mono">{c.component_asin}</span>
                          <span>× {c.quantity_required}</span>
                          <Button variant="ghost" size="sm" className="text-red-400 h-6" onClick={() => handleDeleteComponent(c.mapping_id)}>Entfernen</Button>
                        </div>
                      ))}
                      <div className="flex gap-2 items-center pt-2">
                        <Input placeholder="Komponenten-ASIN" value={newComponentAsin} onChange={(e) => setNewComponentAsin(e.target.value)} className="h-9 w-36 bg-luxe-black border-luxe-gray" />
                        <Input type="number" min={1} value={newComponentQty} onChange={(e) => setNewComponentQty(e.target.value)} className="h-9 w-16 bg-luxe-black border-luxe-gray" />
                        <Button size="sm" onClick={() => handleAddComponent(b.bundle_asin)} disabled={saving}>Hinzufügen</Button>
                      </div>
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
