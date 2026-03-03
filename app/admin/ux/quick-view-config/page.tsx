'use client'

import { useState, useEffect } from 'react'
import { Eye, Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Row = { asin: string; allow_quick_view: boolean; force_redirect_to_pdp: boolean }

export default function AdminQuickViewConfigPage() {
  const [list, setList] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingAsin, setEditingAsin] = useState<string | null>(null)
  const [form, setForm] = useState({ asin: '', allow_quick_view: true, force_redirect_to_pdp: false })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/quick-view-config')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setList(Array.isArray(d) ? d : []))
      .catch(() => setList([]))
  }

  useEffect(() => {
    load()
    setLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.asin.trim()) {
      toast({ title: 'ASIN angeben', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/quick-view-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asin: form.asin.trim().slice(0, 15),
          allow_quick_view: form.allow_quick_view,
          force_redirect_to_pdp: form.force_redirect_to_pdp,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Config gespeichert' })
      setShowForm(false)
      setForm({ asin: '', allow_quick_view: true, force_redirect_to_pdp: false })
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
      const res = await fetch(`/api/admin/quick-view-config/${encodeURIComponent(asin)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allow_quick_view: form.allow_quick_view, force_redirect_to_pdp: form.force_redirect_to_pdp }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Config aktualisiert' })
      setEditingAsin(null)
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (asin: string) => {
    if (!confirm('Quick-View-Config für diesen ASIN löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/quick-view-config/${encodeURIComponent(asin)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Config gelöscht' })
      setEditingAsin(null)
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (r: Row) => {
    setEditingAsin(r.asin)
    setForm({ asin: r.asin, allow_quick_view: r.allow_quick_view, force_redirect_to_pdp: r.force_redirect_to_pdp })
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
            <Eye className="w-7 h-7 text-luxe-primary" />
            Quick View Config
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Pro ASIN: Quick-View erlauben oder Redirect zur PDP. Nur bei catalog ASIN.
          </p>
        </div>
        <Button variant="luxe" onClick={() => { setEditingAsin(null); setShowForm(!showForm); setForm({ asin: '', allow_quick_view: true, force_redirect_to_pdp: false }); }}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neuer Eintrag'}
        </Button>
      </div>

      {(showForm || editingAsin) && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader><CardTitle>{editingAsin ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>ASIN</Label>
                <Input value={form.asin} onChange={(e) => setForm((f) => ({ ...f, asin: e.target.value }))} maxLength={15} className="bg-luxe-black border-luxe-gray" disabled={!!editingAsin} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="allow_qv" checked={form.allow_quick_view} onChange={(e) => setForm((f) => ({ ...f, allow_quick_view: e.target.checked }))} className="rounded border-luxe-gray" />
                <Label htmlFor="allow_qv">Quick View erlauben</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="force_pdp" checked={form.force_redirect_to_pdp} onChange={(e) => setForm((f) => ({ ...f, force_redirect_to_pdp: e.target.checked }))} className="rounded border-luxe-gray" />
                <Label htmlFor="force_pdp">Redirect zur PDP</Label>
              </div>
              <div className="md:col-span-2 flex gap-2">
                {editingAsin ? (
                  <>
                    <Button type="button" onClick={() => handleUpdate(editingAsin)} disabled={saving}>Speichern</Button>
                    <Button type="button" variant="outline" onClick={() => setEditingAsin(null)}>Abbrechen</Button>
                  </>
                ) : (
                  <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Anlegen</Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader><CardTitle>Einträge</CardTitle></CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Keine Quick-View-Config. Tabelle nur bei catalog ASIN.</p>
          ) : (
            <div className="space-y-2">
              {list.map((r) => (
                <div key={r.asin} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                  <div className="flex flex-wrap gap-4">
                    <span className="font-mono">{r.asin}</span>
                    <span className="text-sm">{r.allow_quick_view ? 'Quick View' : 'Kein Quick View'}</span>
                    <span className="text-sm">{r.force_redirect_to_pdp ? '→ PDP' : '–'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(r)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(r.asin)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
