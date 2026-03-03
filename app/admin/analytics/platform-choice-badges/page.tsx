'use client'

import { useState, useEffect } from 'react'
import { Award, Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Badge = { badge_id: string; keyword: string; winning_asin: string; cvr_percentage: number; return_rate: number; awarded_at: string }

export default function AdminPlatformChoiceBadgesPage() {
  const [list, setList] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ keyword: '', winning_asin: '', cvr_percentage: '0', return_rate: '0' })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/platform-choice-badges')
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
    if (!form.keyword.trim() || !form.winning_asin.trim()) {
      toast({ title: 'Keyword und ASIN angeben', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/platform-choice-badges/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: form.keyword.trim(),
            winning_asin: form.winning_asin.trim().slice(0, 15),
            cvr_percentage: parseFloat(form.cvr_percentage) || 0,
            return_rate: parseFloat(form.return_rate) || 0,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
        toast({ title: 'Badge aktualisiert' })
        setEditingId(null)
      } else {
        const res = await fetch('/api/admin/platform-choice-badges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: form.keyword.trim(),
            winning_asin: form.winning_asin.trim().slice(0, 15),
            cvr_percentage: parseFloat(form.cvr_percentage) || 0,
            return_rate: parseFloat(form.return_rate) || 0,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
        toast({ title: 'Badge angelegt' })
        setShowForm(false)
      }
      setForm({ keyword: '', winning_asin: '', cvr_percentage: '0', return_rate: '0' })
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Badge löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/platform-choice-badges/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Badge gelöscht' })
      setEditingId(null)
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (b: Badge) => {
    setEditingId(b.badge_id)
    setForm({
      keyword: b.keyword,
      winning_asin: b.winning_asin,
      cvr_percentage: String(b.cvr_percentage),
      return_rate: String(b.return_rate),
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
            <Award className="w-7 h-7 text-luxe-primary" />
            Platform Choice Badges
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Keyword → gewinnender ASIN, CVR und Return-Rate. Tabelle nur bei vorhandenem catalog ASIN.
          </p>
        </div>
        <Button variant="luxe" onClick={() => { setEditingId(null); setShowForm(!showForm); setForm({ keyword: '', winning_asin: '', cvr_percentage: '0', return_rate: '0' }); }}>
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neuer Badge'}
        </Button>
      </div>

      {(showForm || editingId) && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader><CardTitle>{editingId ? 'Badge bearbeiten' : 'Neuer Badge'}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Keyword</Label>
                <Input value={form.keyword} onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Gewinnender ASIN</Label>
                <Input value={form.winning_asin} onChange={(e) => setForm((f) => ({ ...f, winning_asin: e.target.value }))} maxLength={15} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>CVR (%)</Label>
                <Input type="number" step="0.01" min={0} value={form.cvr_percentage} onChange={(e) => setForm((f) => ({ ...f, cvr_percentage: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div>
                <Label>Return-Rate (%)</Label>
                <Input type="number" step="0.01" min={0} value={form.return_rate} onChange={(e) => setForm((f) => ({ ...f, return_rate: e.target.value }))} className="bg-luxe-black border-luxe-gray" />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {editingId ? 'Speichern' : 'Anlegen'}</Button>
                {editingId && <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Abbrechen</Button>}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader><CardTitle>Badges</CardTitle></CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Keine Badges. Tabelle catalog_automation.platform_choice_badges ggf. über Migration (mit catalog ASIN) angelegt.</p>
          ) : (
            <div className="space-y-2">
              {list.map((b) => (
                <div key={b.badge_id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                  <div className="flex flex-wrap gap-4">
                    <span className="font-medium">{b.keyword}</span>
                    <span className="font-mono text-sm">{b.winning_asin}</span>
                    <span className="text-sm">CVR: {Number(b.cvr_percentage).toFixed(2)}%</span>
                    <span className="text-sm">Return: {Number(b.return_rate).toFixed(2)}%</span>
                    <span className="text-xs text-luxe-silver">seit {new Date(b.awarded_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(b)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(b.badge_id)}><Trash2 className="w-4 h-4" /></Button>
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
