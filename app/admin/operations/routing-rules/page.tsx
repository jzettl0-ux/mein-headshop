'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Rule = {
  rule_id: string
  max_weight_grams: number
  max_thickness_mm: number
  max_price_value: number
  assigned_shipping_method: string
  is_active: boolean
}

export default function AdminRoutingRulesPage() {
  const [list, setList] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    max_weight_grams: '500',
    max_thickness_mm: '30',
    max_price_value: '10.00',
    assigned_shipping_method: 'LETTER_TRACKED',
    is_active: true,
  })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/routing-rules')
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
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/routing-rules/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            max_weight_grams: parseInt(form.max_weight_grams, 10) || 0,
            max_thickness_mm: parseInt(form.max_thickness_mm, 10) || 0,
            max_price_value: parseFloat(form.max_price_value) || 0,
            assigned_shipping_method: form.assigned_shipping_method,
            is_active: form.is_active,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
        toast({ title: 'Regel aktualisiert' })
        setEditingId(null)
      } else {
        const res = await fetch('/api/admin/routing-rules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            max_weight_grams: parseInt(form.max_weight_grams, 10) || 0,
            max_thickness_mm: parseInt(form.max_thickness_mm, 10) || 0,
            max_price_value: parseFloat(form.max_price_value) || 0,
            assigned_shipping_method: form.assigned_shipping_method,
            is_active: form.is_active,
          }),
        })
        if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
        toast({ title: 'Neue Routing-Regel angelegt' })
        setShowForm(false)
      }
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Regel wirklich löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/routing-rules/${ruleId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Regel gelöscht' })
      load()
      if (editingId === ruleId) setEditingId(null)
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (r: Rule) => {
    setEditingId(r.rule_id)
    setForm({
      max_weight_grams: String(r.max_weight_grams),
      max_thickness_mm: String(r.max_thickness_mm),
      max_price_value: String(r.max_price_value),
      assigned_shipping_method: r.assigned_shipping_method || 'LETTER_TRACKED',
      is_active: r.is_active ?? true,
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
            <Package className="w-7 h-7 text-luxe-primary" />
            Small & Light – Routing Rules
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Briefversand: Artikel unter Gewicht/Dicke/Preis-Schwelle werden auf LETTER_TRACKED geroutet.
          </p>
        </div>
        <Button
          variant="luxe"
          onClick={() => {
            setEditingId(null)
            setShowForm(!showForm)
            setForm({ max_weight_grams: '500', max_thickness_mm: '30', max_price_value: '10.00', assigned_shipping_method: 'LETTER_TRACKED', is_active: true })
          }}
        >
          <Plus className="w-5 h-5 mr-2" />
          {showForm ? 'Abbrechen' : 'Neue Regel'}
        </Button>
      </div>

      {(showForm || editingId) && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle>{editingId ? 'Regel bearbeiten' : 'Neue Routing-Regel'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Max. Gewicht (g)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.max_weight_grams}
                  onChange={(e) => setForm((f) => ({ ...f, max_weight_grams: e.target.value }))}
                  className="bg-luxe-black border-luxe-gray"
                />
              </div>
              <div>
                <Label>Max. Dicke (mm)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.max_thickness_mm}
                  onChange={(e) => setForm((f) => ({ ...f, max_thickness_mm: e.target.value }))}
                  className="bg-luxe-black border-luxe-gray"
                />
              </div>
              <div>
                <Label>Max. Preis (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.max_price_value}
                  onChange={(e) => setForm((f) => ({ ...f, max_price_value: e.target.value }))}
                  className="bg-luxe-black border-luxe-gray"
                />
              </div>
              <div>
                <Label>Versandmethode</Label>
                <select
                  value={form.assigned_shipping_method}
                  onChange={(e) => setForm((f) => ({ ...f, assigned_shipping_method: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md bg-luxe-black border border-luxe-gray text-foreground"
                >
                  <option value="LETTER_TRACKED">LETTER_TRACKED</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded border-luxe-gray"
                />
                <Label htmlFor="is_active">Aktiv</Label>
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
          <CardTitle>Regeln</CardTitle>
          <p className="text-sm text-luxe-silver">Reihenfolge nach max_price_value (kleinster zuerst). Erste passende Regel gewinnt.</p>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Noch keine Routing-Regeln. Legen Sie eine an, um Small & Light (Briefversand) zu nutzen.</p>
          ) : (
            <div className="space-y-2">
              {list.map((r) => (
                <div
                  key={r.rule_id}
                  className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray"
                >
                  <div className="flex flex-wrap gap-4">
                    <span>≤ {r.max_weight_grams} g</span>
                    <span>≤ {r.max_thickness_mm} mm</span>
                    <span>≤ {Number(r.max_price_value).toFixed(2)} €</span>
                    <span className="text-luxe-silver">→ {r.assigned_shipping_method}</span>
                    {!r.is_active && <span className="text-amber-500">Inaktiv</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(r)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(r.rule_id)}>
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
