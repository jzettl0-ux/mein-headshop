'use client'

import { useState, useEffect } from 'react'
import { Image, Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const MEDIA_TYPES: Record<string, string> = {
  HERO_IMAGE_1600PX: 'Hero 1600px',
  HOVER_PREVIEW_VIDEO: 'Hover-Video',
  '360_SPIN_FRAME': '360° Frame',
  LIFESTYLE_IMAGE: 'Lifestyle',
}

type Row = { media_id: string; asin: string; media_type: string; file_url: string; resolution_width: number | null; resolution_height: number | null; frame_sequence_number: number; alt_text: string | null }

export default function AdminProductMediaAssetsPage() {
  const [list, setList] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    asin: '',
    media_type: 'LIFESTYLE_IMAGE',
    file_url: '',
    resolution_width: '',
    resolution_height: '',
    frame_sequence_number: '0',
    alt_text: '',
  })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/product-media-assets')
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
    if (!form.asin.trim() || !form.file_url.trim()) {
      toast({ title: 'ASIN und file_url angeben', variant: 'destructive' })
      return
    }
    if (form.media_type === 'HERO_IMAGE_1600PX' && (Number(form.resolution_width) < 1600 || Number(form.resolution_height) < 1600)) {
      toast({ title: 'Hero 1600px erfordert Breite und Höhe >= 1600', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/product-media-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asin: form.asin.trim().slice(0, 15),
          media_type: form.media_type,
          file_url: form.file_url.trim(),
          resolution_width: form.resolution_width ? parseInt(form.resolution_width, 10) : null,
          resolution_height: form.resolution_height ? parseInt(form.resolution_height, 10) : null,
          frame_sequence_number: parseInt(form.frame_sequence_number, 10) || 0,
          alt_text: form.alt_text.trim() || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Media-Asset angelegt' })
      setShowForm(false)
      setForm({ asin: '', media_type: 'LIFESTYLE_IMAGE', file_url: '', resolution_width: '', resolution_height: '', frame_sequence_number: '0', alt_text: '' })
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Asset löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/product-media-assets/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Asset gelöscht' })
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Image className="w-7 h-7 text-luxe-primary" />
            Product Media Assets
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Hochauflösende Medien pro ASIN. Hero 1600px erfordert Auflösung ≥ 1600.
          </p>
        </div>
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neues Asset'}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader><CardTitle>Neues Media-Asset</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>ASIN</Label>
                <Input value={form.asin} onChange={(e) => setForm((f) => ({ ...f, asin: e.target.value }))} maxLength={15} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Typ</Label>
                <select value={form.media_type} onChange={(e) => setForm((f) => ({ ...f, media_type: e.target.value }))} className="w-full h-10 px-3 rounded-md bg-luxe-black border border-luxe-gray text-foreground">
                  {Object.entries(MEDIA_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <Label>URL</Label>
                <Input value={form.file_url} onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))} placeholder="https://…" className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Breite (für Hero 1600: ≥1600)</Label>
                <Input type="number" min={0} value={form.resolution_width} onChange={(e) => setForm((f) => ({ ...f, resolution_width: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Höhe</Label>
                <Input type="number" min={0} value={form.resolution_height} onChange={(e) => setForm((f) => ({ ...f, resolution_height: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Frame-Nr.</Label>
                <Input type="number" min={0} value={form.frame_sequence_number} onChange={(e) => setForm((f) => ({ ...f, frame_sequence_number: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Alt-Text</Label>
                <Input value={form.alt_text} onChange={(e) => setForm((f) => ({ ...f, alt_text: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Anlegen</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader><CardTitle>Assets</CardTitle></CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Keine Media-Assets. Tabelle nur bei catalog ASIN.</p>
          ) : (
            <div className="space-y-2">
              {list.map((r) => (
                <div key={r.media_id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                  <div className="flex flex-wrap gap-4">
                    <span className="font-mono">{r.asin}</span>
                    <span>{MEDIA_TYPES[r.media_type] ?? r.media_type}</span>
                    <span className="text-sm text-luxe-silver truncate max-w-[200px]">{r.file_url}</span>
                    {(r.resolution_width != null || r.resolution_height != null) && <span>{r.resolution_width}×{r.resolution_height}</span>}
                    <span className="text-sm">Frame {r.frame_sequence_number}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(r.media_id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
