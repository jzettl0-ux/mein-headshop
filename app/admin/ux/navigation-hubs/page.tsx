'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const LAYOUT_OPTIONS = [
  { value: 'BENTO_GRID', label: 'Bento Grid' },
  { value: 'EDITORIAL_FEED', label: 'Editorial Feed' },
  { value: 'PRODUCT_LIST', label: 'Produktliste' },
  { value: 'COUNTDOWN_VAULT', label: 'Countdown Vault' },
] as const

type Hub = {
  hub_id: string
  hub_name: string
  ui_layout_type: string
  slug_url: string
  is_active: boolean
  sort_order: number
}

export default function AdminNavigationHubsPage() {
  const [list, setList] = useState<Hub[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    hub_name: '',
    slug_url: '',
    ui_layout_type: 'PRODUCT_LIST' as string,
    is_active: true,
    sort_order: '0',
  })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/navigation-hubs')
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
    const slug = form.slug_url.trim().toLowerCase().replace(/\s+/g, '-')
    if (!form.hub_name.trim()) {
      toast({ title: 'Name fehlt', variant: 'destructive' })
      return
    }
    if (!slug) {
      toast({ title: 'Slug fehlt', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/navigation-hubs/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hub_name: form.hub_name.trim(),
            slug_url: slug,
            ui_layout_type: form.ui_layout_type,
            is_active: form.is_active,
            sort_order: parseInt(form.sort_order, 10) || 0,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
        toast({ title: 'Hub aktualisiert' })
        setEditingId(null)
      } else {
        const res = await fetch('/api/admin/navigation-hubs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hub_name: form.hub_name.trim(),
            slug_url: slug,
            ui_layout_type: form.ui_layout_type,
            is_active: form.is_active,
            sort_order: parseInt(form.sort_order, 10) || 0,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
        toast({ title: 'Navigation Hub angelegt' })
        setShowForm(false)
      }
      setForm({ hub_name: '', slug_url: '', ui_layout_type: 'PRODUCT_LIST', is_active: true, sort_order: '0' })
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (hubId: string) => {
    if (!confirm('Hub wirklich löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/navigation-hubs/${hubId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Hub gelöscht' })
      load()
      if (editingId === hubId) setEditingId(null)
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (h: Hub) => {
    setEditingId(h.hub_id)
    setForm({
      hub_name: h.hub_name,
      slug_url: h.slug_url,
      ui_layout_type: h.ui_layout_type || 'PRODUCT_LIST',
      is_active: h.is_active ?? true,
      sort_order: String(h.sort_order ?? 0),
    })
    setShowForm(false)
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
            <LayoutGrid className="w-7 h-7 text-luxe-primary" />
            Navigation Hubs (Intentions-Hubs)
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Intentions-basierte Hubs mit Layout-Typ: Bento, Editorial, Produktliste, Countdown.
          </p>
        </div>
        <Button
          variant="luxe"
          onClick={() => {
            setEditingId(null)
            setShowForm(!showForm)
            setForm({ hub_name: '', slug_url: '', ui_layout_type: 'PRODUCT_LIST', is_active: true, sort_order: '0' })
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neuer Hub'}
        </Button>
      </div>

      {(showForm || editingId) && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle>{editingId ? 'Hub bearbeiten' : 'Neuer Navigation Hub'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.hub_name}
                  onChange={(e) => setForm((f) => ({ ...f, hub_name: e.target.value }))}
                  placeholder="z. B. Neu für dich"
                  className="bg-luxe-black border-luxe-gray"
                />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input
                  value={form.slug_url}
                  onChange={(e) => setForm((f) => ({ ...f, slug_url: e.target.value }))}
                  placeholder="z. B. neu-fuer-dich"
                  className="bg-luxe-black border-luxe-gray"
                />
              </div>
              <div>
                <Label>Layout-Typ</Label>
                <select
                  value={form.ui_layout_type}
                  onChange={(e) => setForm((f) => ({ ...f, ui_layout_type: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md bg-luxe-black border border-luxe-gray text-foreground"
                >
                  {LAYOUT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Sortierung</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="bg-luxe-black border-luxe-gray"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hub_is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-luxe-gray"
                />
                <Label htmlFor="hub_is_active">Aktiv</Label>
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingId ? 'Speichern' : 'Anlegen'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={() => setEditingId(null)}>
                    Abbrechen
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle>Hubs</CardTitle>
          <p className="text-sm text-luxe-silver">Reihenfolge nach sort_order. Slug für Frontend-Routen nutzbar.</p>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Noch keine Navigation Hubs. Legen Sie einen an für Intentions-basierte Bereiche.</p>
          ) : (
            <div className="space-y-2">
              {list.map((h) => (
                <div
                  key={h.hub_id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-medium">{h.hub_name}</span>
                    <span className="text-luxe-silver">/{h.slug_url}</span>
                    <span className="text-sm text-luxe-silver">{h.ui_layout_type}</span>
                    <span className="text-sm">Reihe {h.sort_order}</span>
                    {!h.is_active && <span className="text-amber-500">Inaktiv</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(h)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(h.hub_id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
