'use client'

import { useState, useEffect } from 'react'
import { Image, Plus, Loader2, Pencil, Trash2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Editorial = {
  editorial_id: string
  title: string
  hero_image_url: string
  editorial_text?: string | null
  published_at: string
  hotspot_count?: number
}

type Hotspot = {
  hotspot_id: string
  editorial_id: string
  product_id: string | null
  pos_x_percentage: number
  pos_y_percentage: number
  pulse_animation_style: string
}

export default function AdminEditorialsPage() {
  const [editorials, setEditorials] = useState<Editorial[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detailEditorial, setDetailEditorial] = useState<(Editorial & { hotspots: Hotspot[] }) | null>(null)
  const [form, setForm] = useState({ title: '', hero_image_url: '', editorial_text: '' })
  const [hotspotForm, setHotspotForm] = useState({ pos_x_percentage: '50', pos_y_percentage: '50', product_id: '', pulse_animation_style: 'SUBTLE_GLOW' })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/editorials')
      .then((r) => (r.ok ? r.json() : { editorials: [] }))
      .then((d) => setEditorials(d.editorials ?? []))
      .catch(() => setEditorials([]))
  }

  useEffect(() => {
    load()
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!editingId) {
      setDetailEditorial(null)
      return
    }
    fetch(`/api/admin/editorials/${editingId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setDetailEditorial)
      .catch(() => setDetailEditorial(null))
  }, [editingId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.hero_image_url.trim()) {
      toast({ title: 'Titel und Hero-URL angeben', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/editorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          hero_image_url: form.hero_image_url.trim(),
          editorial_text: form.editorial_text.trim() || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Editorial angelegt' })
      setShowForm(false)
      setForm({ title: '', hero_image_url: '', editorial_text: '' })
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingId || !detailEditorial) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/editorials/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: detailEditorial.title,
          hero_image_url: detailEditorial.hero_image_url,
          editorial_text: detailEditorial.editorial_text ?? null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Editorial gespeichert' })
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Editorial und alle Hotspots löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/editorials/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Editorial gelöscht' })
      if (editingId === id) setEditingId(null)
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddHotspot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/editorials/${editingId}/hotspots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pos_x_percentage: parseFloat(hotspotForm.pos_x_percentage) || 50,
          pos_y_percentage: parseFloat(hotspotForm.pos_y_percentage) || 50,
          product_id: hotspotForm.product_id.trim() || null,
          pulse_animation_style: hotspotForm.pulse_animation_style,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Hotspot hinzugefügt' })
      setHotspotForm({ pos_x_percentage: '50', pos_y_percentage: '50', product_id: '', pulse_animation_style: 'SUBTLE_GLOW' })
      fetch(`/api/admin/editorials/${editingId}`).then((r) => r.ok && r.json()).then(setDetailEditorial)
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteHotspot = async (hotspotId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/editorial-hotspots/${hotspotId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Hotspot entfernt' })
      if (detailEditorial) fetch(`/api/admin/editorials/${detailEditorial.editorial_id}`).then((r) => r.ok && r.json()).then(setDetailEditorial)
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Image className="w-6 h-6 text-luxe-gold" />
            Shoppable Editorials
          </h1>
          <p className="text-sm text-luxe-silver mt-1">
            Lifestyle-Fotos mit Hotspots – klickbare Produkt-Links. Anlegen, bearbeiten, Hotspots setzen.
          </p>
        </div>
        <Button variant="luxe" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neues Editorial'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader><CardTitle>Neues Editorial</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Titel</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Hero-Bild-URL</Label>
                <Input value={form.hero_image_url} onChange={(e) => setForm((f) => ({ ...f, hero_image_url: e.target.value }))} placeholder="https://…" className="bg-luxe-black border-luxe-gray" />
              </div>
              <div className="md:col-span-2">
                <Label>Editorial-Text (optional)</Label>
                <textarea value={form.editorial_text} onChange={(e) => setForm((f) => ({ ...f, editorial_text: e.target.value }))} rows={3} className="w-full rounded-md bg-luxe-black border border-luxe-gray text-foreground p-3" />
              </div>
              <div><Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Anlegen</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {editorials.length === 0 && !showForm ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Editorials. Tabellen <code className="text-xs bg-luxe-black px-1 rounded">retail_media.editorials</code> und <code className="text-xs bg-luxe-black px-1 rounded">editorial_hotspots</code> über Migration anlegen. Dann hier „Neues Editorial“ nutzen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Editorials</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{editorials.length} Einträge</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {editorials.map((e) => (
              <div key={e.editorial_id} className="rounded-lg border border-luxe-gray bg-luxe-black/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{e.title}</p>
                    <p className="text-luxe-silver text-xs mt-0.5">{e.hotspot_count ?? 0} Hotspots</p>
                    <span className="text-luxe-silver text-xs">{new Date(e.published_at).toLocaleDateString('de-DE')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(editingId === e.editorial_id ? null : e.editorial_id)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(e.editorial_id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {editingId === e.editorial_id && detailEditorial?.editorial_id === e.editorial_id && (
                  <div className="mt-4 pt-4 border-t border-luxe-gray space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Titel</Label>
                        <Input value={detailEditorial.title} onChange={(ev) => setDetailEditorial((d) => d ? { ...d, title: ev.target.value } : null)} className="bg-luxe-black border-luxe-gray" />
                      </div>
                      <div>
                        <Label>Hero-URL</Label>
                        <Input value={detailEditorial.hero_image_url} onChange={(ev) => setDetailEditorial((d) => d ? { ...d, hero_image_url: ev.target.value } : null)} className="bg-luxe-black border-luxe-gray" />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Text</Label>
                        <textarea value={detailEditorial.editorial_text ?? ''} onChange={(ev) => setDetailEditorial((d) => d ? { ...d, editorial_text: ev.target.value } : null)} rows={2} className="w-full rounded-md bg-luxe-black border border-luxe-gray text-foreground p-2" />
                      </div>
                      <div><Button size="sm" onClick={handleUpdate} disabled={saving}>Speichern</Button></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white mb-2 flex items-center gap-1"><MapPin className="w-4 h-4" /> Hotspots</p>
                      <ul className="space-y-1 text-sm text-luxe-silver mb-3">
                        {detailEditorial.hotspots.map((h) => (
                          <li key={h.hotspot_id} className="flex items-center justify-between">
                            <span>Position {Number(h.pos_x_percentage).toFixed(0)}% / {Number(h.pos_y_percentage).toFixed(0)}% {h.product_id ? `· Produkt ${h.product_id}` : ''}</span>
                            <Button variant="ghost" size="sm" className="text-red-400 h-6" onClick={() => handleDeleteHotspot(h.hotspot_id)}>Entfernen</Button>
                          </li>
                        ))}
                      </ul>
                      <form onSubmit={handleAddHotspot} className="flex flex-wrap gap-2 items-end">
                        <div>
                          <Label className="text-xs">X %</Label>
                          <Input type="number" min={0} max={100} step={0.5} value={hotspotForm.pos_x_percentage} onChange={(ev) => setHotspotForm((f) => ({ ...f, pos_x_percentage: ev.target.value }))} className="h-9 w-20 bg-luxe-black border-luxe-gray" />
                        </div>
                        <div>
                          <Label className="text-xs">Y %</Label>
                          <Input type="number" min={0} max={100} step={0.5} value={hotspotForm.pos_y_percentage} onChange={(ev) => setHotspotForm((f) => ({ ...f, pos_y_percentage: ev.target.value }))} className="h-9 w-20 bg-luxe-black border-luxe-gray" />
                        </div>
                        <div>
                          <Label className="text-xs">Produkt-ID (optional)</Label>
                          <Input value={hotspotForm.product_id} onChange={(ev) => setHotspotForm((f) => ({ ...f, product_id: ev.target.value }))} placeholder="UUID" className="h-9 w-48 bg-luxe-black border-luxe-gray" />
                        </div>
                        <div>
                          <Label className="text-xs">Animation</Label>
                          <select value={hotspotForm.pulse_animation_style} onChange={(ev) => setHotspotForm((f) => ({ ...f, pulse_animation_style: ev.target.value }))} className="h-9 px-2 rounded bg-luxe-black border border-luxe-gray text-foreground text-sm">
                            <option value="SUBTLE_GLOW">SUBTLE_GLOW</option>
                            <option value="PULSE">PULSE</option>
                            <option value="NONE">NONE</option>
                          </select>
                        </div>
                        <Button type="submit" size="sm" disabled={saving}>Hotspot hinzufügen</Button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
