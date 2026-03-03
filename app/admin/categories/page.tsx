'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Save, Pencil, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface ProductCategory {
  id: string
  slug: string
  name: string
  sort_order: number
}

interface ProductSubcategory {
  id: string
  parent_category: string
  slug: string
  name: string
  sort_order: number
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [subcategories, setSubcategories] = useState<ProductSubcategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingSubcategories, setLoadingSubcategories] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedParent, setSelectedParent] = useState<string>('')
  const [newCatForm, setNewCatForm] = useState({ slug: '', name: '', sort_order: 0 })
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatForm, setEditCatForm] = useState({ slug: '', name: '', sort_order: 0 })
  const [newSubForm, setNewSubForm] = useState({ slug: '', name: '', sort_order: 0 })
  const [editingSubId, setEditingSubId] = useState<string | null>(null)
  const [editSubForm, setEditSubForm] = useState({ slug: '', name: '', sort_order: 0 })
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (categories.length > 0 && !selectedParent) {
      setSelectedParent(categories[0].slug)
    }
  }, [categories, selectedParent])

  useEffect(() => {
    if (selectedParent) loadSubcategories()
  }, [selectedParent])

  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch('/api/admin/categories')
      const data = res.ok ? await res.json() : []
      setCategories(Array.isArray(data) ? data : [])
      if (data?.length > 0 && !selectedParent) setSelectedParent(data[0].slug)
    } catch {
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadSubcategories = async () => {
    if (!selectedParent) return
    setLoadingSubcategories(true)
    try {
      const res = await fetch(`/api/admin/subcategories?parent=${encodeURIComponent(selectedParent)}`)
      const data = res.ok ? await res.json() : []
      setSubcategories(Array.isArray(data) ? data : [])
    } catch {
      setSubcategories([])
    } finally {
      setLoadingSubcategories(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatForm.slug.trim() || !newCatForm.name.trim()) {
      toast({ title: 'Slug und Name erforderlich', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCatForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen')
      toast({ title: 'Hauptkategorie hinzugefügt' })
      setNewCatForm({ slug: '', name: '', sort_order: categories.length })
      loadCategories()
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCategory = async (id: string) => {
    if (!editCatForm.slug.trim() || !editCatForm.name.trim()) {
      toast({ title: 'Slug und Name erforderlich', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editCatForm }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen')
      toast({ title: 'Hauptkategorie aktualisiert' })
      setEditingCatId(null)
      loadCategories()
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string, slug: string) => {
    if (!confirm('Hauptkategorie wirklich löschen? Produkte müssen vorher einer anderen Kategorie zugeordnet werden.')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Löschen fehlgeschlagen')
      toast({ title: 'Hauptkategorie gelöscht' })
      setEditingCatId(null)
      if (selectedParent === slug) setSelectedParent(categories.find((c) => c.id !== id)?.slug ?? '')
      loadCategories()
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedParent || !newSubForm.slug.trim() || !newSubForm.name.trim()) {
      toast({ title: 'Slug und Name erforderlich', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_category: selectedParent,
          slug: newSubForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          name: newSubForm.name.trim(),
          sort_order: newSubForm.sort_order,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen')
      toast({ title: 'Unterkategorie hinzugefügt' })
      setNewSubForm({ slug: '', name: '', sort_order: subcategories.length })
      loadSubcategories()
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSubcategory = async (id: string) => {
    if (!editSubForm.slug.trim() || !editSubForm.name.trim()) {
      toast({ title: 'Slug und Name erforderlich', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/subcategories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          slug: editSubForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          name: editSubForm.name.trim(),
          sort_order: editSubForm.sort_order,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen')
      toast({ title: 'Unterkategorie aktualisiert' })
      setEditingSubId(null)
      loadSubcategories()
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSubcategory = async (id: string) => {
    if (!confirm('Unterkategorie wirklich löschen? Produkte behalten ihre Zuordnung, werden aber als „ohne Unterkategorie“ angezeigt.')) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/subcategories?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Löschen fehlgeschlagen')
      toast({ title: 'Unterkategorie gelöscht' })
      setEditingSubId(null)
      loadSubcategories()
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const categoryLabel = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Kategorien & Unterkategorien</h1>
        <p className="text-luxe-silver mt-1">
          Hauptkategorien und Unterkategorien für deinen Shop verwalten. Hauptkategorien erscheinen in der Navigation und den Filtern.
        </p>
      </div>

      {/* Hauptkategorien */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-luxe-gold" />
            Hauptkategorien
          </CardTitle>
          <p className="text-luxe-silver text-sm mt-1">
            Hauptkategorien werden in der Shop-Navigation und in Produktfiltern angezeigt.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddCategory} className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-white">Name</Label>
              <Input
                value={newCatForm.name}
                onChange={(e) => setNewCatForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="z. B. Bongs"
                className="bg-luxe-gray border-luxe-silver text-white w-40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Slug (URL)</Label>
              <Input
                value={newCatForm.slug}
                onChange={(e) => setNewCatForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="bongs"
                className="bg-luxe-gray border-luxe-silver text-white w-32"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white">Reihenfolge</Label>
              <Input
                type="number"
                value={newCatForm.sort_order}
                onChange={(e) => setNewCatForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
                className="bg-luxe-gray border-luxe-silver text-white w-20"
              />
            </div>
            <Button type="submit" variant="luxe" size="sm" disabled={saving}>
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </form>

          {loadingCategories ? (
            <p className="text-luxe-silver">Laden...</p>
          ) : categories.length === 0 ? (
            <p className="text-luxe-silver">Noch keine Hauptkategorien. Führe die Migration <code className="bg-luxe-gray px-1 rounded">migration-product-categories.sql</code> aus.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 py-2 px-4 rounded-lg bg-luxe-black/50 border border-luxe-gray"
                >
                  {editingCatId === c.id ? (
                    <>
                      <div className="flex flex-wrap gap-3 items-center">
                        <Input
                          value={editCatForm.name}
                          onChange={(e) => setEditCatForm((f) => ({ ...f, name: e.target.value }))}
                          className="bg-luxe-gray border-luxe-silver text-white w-40"
                          placeholder="Name"
                        />
                        <Input
                          value={editCatForm.slug}
                          onChange={(e) => setEditCatForm((f) => ({ ...f, slug: e.target.value }))}
                          className="bg-luxe-gray border-luxe-silver text-white w-32"
                          placeholder="slug"
                        />
                        <Input
                          type="number"
                          value={editCatForm.sort_order}
                          onChange={(e) => setEditCatForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
                          className="bg-luxe-gray border-luxe-silver text-white w-16"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="luxe" onClick={() => handleUpdateCategory(c.id)} disabled={saving}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="admin-outline" onClick={() => setEditingCatId(null)}>
                          Abbrechen
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-white">
                        {c.name}
                        <span className="text-luxe-silver text-sm ml-2">({c.slug})</span>
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="admin-outline" onClick={() => { setEditingCatId(c.id); setEditCatForm({ slug: c.slug, name: c.name, sort_order: c.sort_order }) }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="admin-outline" onClick={() => handleDeleteCategory(c.id, c.slug)} disabled={saving}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Unterkategorien (pro Hauptkategorie) */}
      {categories.length > 0 && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">
              Unterkategorien: {categoryLabel(selectedParent)}
            </CardTitle>
            <p className="text-luxe-silver text-sm mt-1">
              Unterkategorien für die gewählte Hauptkategorie (z. B. Bongs → Glasbongs, Acryl Bongs).
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedParent === cat.slug ? 'luxe' : 'admin-outline'}
                  size="sm"
                  onClick={() => setSelectedParent(cat.slug)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            <form onSubmit={handleAddSubcategory} className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-white">Name</Label>
                <Input
                  value={newSubForm.name}
                  onChange={(e) => setNewSubForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="z. B. Glasbongs"
                  className="bg-luxe-gray border-luxe-silver text-white w-40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Slug</Label>
                <Input
                  value={newSubForm.slug}
                  onChange={(e) => setNewSubForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="glasbongs"
                  className="bg-luxe-gray border-luxe-silver text-white w-32"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Reihenfolge</Label>
                <Input
                  type="number"
                  value={newSubForm.sort_order}
                  onChange={(e) => setNewSubForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
                  className="bg-luxe-gray border-luxe-silver text-white w-20"
                />
              </div>
              <Button type="submit" variant="luxe" size="sm" disabled={saving}>
                <Plus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            </form>

            {loadingSubcategories ? (
              <p className="text-luxe-silver">Laden...</p>
            ) : subcategories.length === 0 ? (
              <p className="text-luxe-silver">Noch keine Unterkategorien. Lege oben eine neue an.</p>
            ) : (
              <ul className="space-y-2">
                {subcategories.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-4 py-2 px-4 rounded-lg bg-luxe-black/50 border border-luxe-gray"
                  >
                    {editingSubId === s.id ? (
                      <>
                        <div className="flex flex-wrap gap-3 items-center">
                          <Input
                            value={editSubForm.name}
                            onChange={(e) => setEditSubForm((f) => ({ ...f, name: e.target.value }))}
                            className="bg-luxe-gray border-luxe-silver text-white w-40"
                            placeholder="Name"
                          />
                          <Input
                            value={editSubForm.slug}
                            onChange={(e) => setEditSubForm((f) => ({ ...f, slug: e.target.value }))}
                            className="bg-luxe-gray border-luxe-silver text-white w-32"
                            placeholder="slug"
                          />
                          <Input
                            type="number"
                            value={editSubForm.sort_order}
                            onChange={(e) => setEditSubForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
                            className="bg-luxe-gray border-luxe-silver text-white w-16"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="luxe" onClick={() => handleUpdateSubcategory(s.id)} disabled={saving}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="admin-outline" onClick={() => setEditingSubId(null)}>
                            Abbrechen
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-white">
                          {s.name}
                          <span className="text-luxe-silver text-sm ml-2">({s.slug})</span>
                        </span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="admin-outline" onClick={() => { setEditingSubId(s.id); setEditSubForm({ slug: s.slug, name: s.name, sort_order: s.sort_order }) }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="admin-outline" onClick={() => handleDeleteSubcategory(s.id)} disabled={saving}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-luxe-silver">
        Shop-URL: <code className="bg-luxe-gray px-1 rounded">/shop?category=slug</code> bzw.{' '}
        <code className="bg-luxe-gray px-1 rounded">/shop?category=slug&subcategory=slug</code>
      </p>
    </div>
  )
}
