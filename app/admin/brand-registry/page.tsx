'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Plus, Loader2, Trash2, Edit, Store, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface Brand {
  id: string
  name: string
  slug: string
  owner_type: string
  owner_id: string | null
  status: string
  notes: string | null
  created_at: string
  updated_at: string
}

export default function AdminBrandRegistryPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [ownerType, setOwnerType] = useState<'shop' | 'vendor'>('shop')
  const [status, setStatus] = useState('active')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/brand-registry')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const slugify = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[äöüß]/g, (c: string) => ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }[c] ?? c))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  const openNew = () => {
    setEditingId(null)
    setName('')
    setSlug('')
    setOwnerType('shop')
    setStatus('active')
    setNotes('')
    setDialogOpen(true)
  }

  const openEdit = (b: Brand) => {
    setEditingId(b.id)
    setName(b.name)
    setSlug(b.slug)
    setOwnerType((b.owner_type as 'shop' | 'vendor') || 'shop')
    setStatus(b.status || 'active')
    setNotes(b.notes ?? '')
    setDialogOpen(true)
  }

  const handleNameChange = (v: string) => {
    setName(v)
    if (!editingId && !slug) setSlug(slugify(v))
  }

  const handleSave = async () => {
    const n = name.trim()
    if (!n) {
      toast({ title: 'Name erforderlich', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/brand-registry/${editingId}` : '/api/admin/brand-registry'
      const method = editingId ? 'PATCH' : 'POST'
      const body: Record<string, unknown> = { name: n, slug: slug.trim() || slugify(n), owner_type: ownerType, status, notes: notes.trim() || null }
      if (ownerType === 'vendor') body.owner_id = null
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: editingId ? 'Marke aktualisiert' : 'Marke angelegt' })
      setDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Marke wirklich aus dem Registry entfernen?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/brand-registry/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast({ title: d.error || 'Fehler', variant: 'destructive' })
        return
      }
      setBrands((prev) => prev.filter((b) => b.id !== id))
      toast({ title: 'Marke entfernt' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-luxe-gold" />
            Brand Registry
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Markenschutz & Katalog-Hoheit – registrierte Marken mit Inhaber (Shop oder Vendor).
          </p>
        </div>
        <Button variant="luxe" onClick={openNew}>
          <Plus className="w-5 h-5 mr-2" />
          Marke registrieren
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : brands.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <ShieldCheck className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Marken registriert.</p>
            <Button variant="luxe" className="mt-4" onClick={openNew}>
              Erste Marke registrieren
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {brands.map((b) => (
            <Card key={b.id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-luxe-gray flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-luxe-silver" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{b.name}</p>
                    <p className="text-sm text-luxe-silver">
                      {b.slug} · {b.owner_type === 'shop' ? 'Shop' : 'Vendor'}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={b.status === 'active' ? 'default' : b.status === 'suspended' ? 'destructive' : 'secondary'}>
                        {b.status === 'active' ? 'Aktiv' : b.status === 'suspended' ? 'Gesperrt' : 'Ausstehend'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="admin-outline" size="sm" onClick={() => openEdit(b)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="admin-outline"
                    size="sm"
                    className="text-red-400"
                    onClick={() => handleDelete(b.id)}
                    disabled={deletingId === b.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Marke bearbeiten' : 'Marke registrieren'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-luxe-silver">Name *</Label>
              <Input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="z. B. RAW, Storz & Bickel"
                className="bg-luxe-black border-luxe-gray text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-luxe-silver">Slug (URL-freundlich)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="raw, storz-bickel"
                className="bg-luxe-black border-luxe-gray text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-luxe-silver">Inhaber</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ownerType"
                    checked={ownerType === 'shop'}
                    onChange={() => setOwnerType('shop')}
                    className="text-luxe-gold"
                  />
                  <Store className="w-4 h-4 text-luxe-silver" />
                  <span className="text-sm">Shop (Plattform)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ownerType"
                    checked={ownerType === 'vendor'}
                    onChange={() => setOwnerType('vendor')}
                    className="text-luxe-gold"
                  />
                  <User className="w-4 h-4 text-luxe-silver" />
                  <span className="text-sm">Vendor</span>
                </label>
              </div>
            </div>
            <div>
              <Label className="text-luxe-silver">Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
              >
                <option value="active">Aktiv</option>
                <option value="pending">Ausstehend</option>
                <option value="suspended">Gesperrt</option>
              </select>
            </div>
            <div>
              <Label className="text-luxe-silver">Notizen (optional)</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="z. B. Lizenznachweis eingereicht"
                className="bg-luxe-black border-luxe-gray text-white mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-luxe-silver">
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving} variant="luxe">
              {saving ? 'Wird gespeichert…' : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
