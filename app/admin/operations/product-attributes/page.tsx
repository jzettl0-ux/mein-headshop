'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Loader2, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Row = { product_id: string; product_name?: string | null; physical_weight_grams: number | null; physical_thickness_mm: number | null }

export default function AdminProductAttributesPage() {
  const [list, setList] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ product_id: '', physical_weight_grams: '', physical_thickness_mm: '' })
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/product-attributes')
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
    if (!form.product_id.trim()) {
      toast({ title: 'Produkt-ID angeben', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/product-attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: form.product_id.trim(),
          physical_weight_grams: form.physical_weight_grams ? parseInt(form.physical_weight_grams, 10) : null,
          physical_thickness_mm: form.physical_thickness_mm ? parseInt(form.physical_thickness_mm, 10) : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Attribute gespeichert' })
      setForm({ product_id: '', physical_weight_grams: '', physical_thickness_mm: '' })
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (productId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/product-attributes/${encodeURIComponent(productId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          physical_weight_grams: form.physical_weight_grams ? parseInt(form.physical_weight_grams, 10) : null,
          physical_thickness_mm: form.physical_thickness_mm ? parseInt(form.physical_thickness_mm, 10) : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Attribute aktualisiert' })
      setEditingId(null)
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Attribute für dieses Produkt löschen?')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/product-attributes/${encodeURIComponent(productId)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      toast({ title: 'Attribute gelöscht' })
      setEditingId(null)
      load()
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (r: Row) => {
    setEditingId(r.product_id)
    setForm({
      product_id: r.product_id,
      physical_weight_grams: r.physical_weight_grams != null ? String(r.physical_weight_grams) : '',
      physical_thickness_mm: r.physical_thickness_mm != null ? String(r.physical_thickness_mm) : '',
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
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="w-7 h-7 text-luxe-primary" />
          Product Attributes (Small & Light)
        </h1>
        <p className="text-luxe-silver text-sm mt-1">
          Gewicht (g) und Dicke (mm) pro Produkt für Routing Rules.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader><CardTitle>Neue Attribute / Bearbeiten</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <div>
              <Label>Produkt-ID (UUID)</Label>
              <Input value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))} placeholder="UUID" className="bg-luxe-black border-luxe-gray w-64" disabled={!!editingId} />
            </div>
            <div>
              <Label>Gewicht (g)</Label>
              <Input type="number" min={0} value={form.physical_weight_grams} onChange={(e) => setForm((f) => ({ ...f, physical_weight_grams: e.target.value }))} className="bg-luxe-black border-luxe-gray w-24" />
            </div>
            <div>
              <Label>Dicke (mm)</Label>
              <Input type="number" min={0} value={form.physical_thickness_mm} onChange={(e) => setForm((f) => ({ ...f, physical_thickness_mm: e.target.value }))} className="bg-luxe-black border-luxe-gray w-24" />
            </div>
            {editingId ? (
              <>
                <Button type="button" onClick={() => handleUpdate(editingId)} disabled={saving}>Speichern</Button>
                <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Abbrechen</Button>
              </>
            ) : (
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Anlegen / Upsert</Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader><CardTitle>Einträge</CardTitle></CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver">Keine Product Attributes. Tabelle catalog.product_attributes über Migration angelegt.</p>
          ) : (
            <div className="space-y-2">
              {list.map((r) => (
                <div key={r.product_id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-mono text-sm">{r.product_id}</span>
                    <span>{r.product_name ?? '–'}</span>
                    <Link href={`/admin/products/${r.product_id}`} className="text-luxe-primary hover:underline flex items-center gap-1 text-sm"><ExternalLink className="w-4 h-4" /></Link>
                    <span>{r.physical_weight_grams != null ? `${r.physical_weight_grams} g` : '–'}</span>
                    <span>{r.physical_thickness_mm != null ? `${r.physical_thickness_mm} mm` : '–'}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(r)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(r.product_id)}><Trash2 className="w-4 h-4" /></Button>
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
