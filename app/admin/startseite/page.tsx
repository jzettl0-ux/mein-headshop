'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Home, Save, Plus, Trash2, GripVertical, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Influencer, HomepageCategory } from '@/lib/types'
import { CATEGORY_PALETTE } from '@/lib/category-palette'

const DEFAULT_GRADIENT = 'from-luxe-gold/20 to-yellow-500/20'
const DEFAULT_ICON_COLOR = 'text-luxe-gold'

export default function AdminStartseitePage() {
  const [influencers, setInfluencers] = useState<(Influencer & { product_count?: number })[]>([])
  const [categories, setCategories] = useState<HomepageCategory[]>([])
  const [influencerLimit, setInfluencerLimit] = useState<number>(6)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingLimit, setSavingLimit] = useState(false)
  const categoriesRef = useRef<HomepageCategory[]>([])
  const { toast } = useToast()
  categoriesRef.current = categories

  useEffect(() => {
    loadInfluencers()
    loadCategories()
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: { homepage_influencer_limit?: number }) => {
        const n = data.homepage_influencer_limit
        if (typeof n === 'number' && n >= 0) setInfluencerLimit(n)
        else if (typeof n === 'string') setInfluencerLimit(parseInt(n, 10) || 6)
      })
      .catch(() => {})
  }, [])

  const loadInfluencers = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('influencers').select('*').order('name')
      if (!error && data) {
        const withCount = await Promise.all(
          (data as Influencer[]).map(async (inf) => {
            const { count } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('influencer_id', inf.id)
            return { ...inf, product_count: count ?? 0 }
          })
        )
        setInfluencers(withCount)
      }
    } catch (e) {
      console.error('loadInfluencers:', e)
    }
    setLoading(false)
  }

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/homepage-categories')
      const data = await res.json().catch(() => [])
      const list = Array.isArray(data) ? (data as HomepageCategory[]) : []
      setCategories(list.map((c) => ({
        id: c.id ?? '',
        name: c.name ?? '',
        slug: c.slug ?? '',
        description: c.description ?? '',
        image_url: c.image_url ?? null,
        gradient: c.gradient ?? DEFAULT_GRADIENT,
        icon_color: c.icon_color ?? DEFAULT_ICON_COLOR,
        gradient_start_hex: c.gradient_start_hex ?? null,
        gradient_end_hex: c.gradient_end_hex ?? null,
        icon_color_hex: c.icon_color_hex ?? null,
        sort_order: typeof c.sort_order === 'number' ? c.sort_order : 0,
        created_at: c.created_at ?? '',
        updated_at: c.updated_at ?? '',
      })))
    } catch {
      setCategories([])
    }
  }

  const updateInfluencer = (id: string, updates: Partial<Influencer>) => {
    setInfluencers((prev) => prev.map((inf) => (inf.id === id ? { ...inf, ...updates } : inf)))
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/influencers-homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          updates: influencers.map((inf) => ({
            id: inf.id,
            show_on_homepage: inf.show_on_homepage ?? false,
            homepage_order: inf.homepage_order ?? 0,
            homepage_title: inf.homepage_title?.trim() || null,
            homepage_bio: inf.homepage_bio?.trim() || null,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Speichern fehlgeschlagen')
      }
      toast({ title: 'Gespeichert', description: 'Startseiten-Influencer wurden aktualisiert.' })
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Speichern fehlgeschlagen.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const saveInfluencerLimit = async () => {
    setSavingLimit(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ homepage_influencer_limit: influencerLimit }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({ title: 'Gespeichert', description: 'Anzahl Influencer auf der Startseite wurde aktualisiert.' })
    } catch {
      toast({ title: 'Fehler', description: 'Limit konnte nicht gespeichert werden.', variant: 'destructive' })
    } finally {
      setSavingLimit(false)
    }
  }

  const addCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const name = (form.querySelector('[name="cat_name"]') as HTMLInputElement)?.value?.trim()
    const slug = (form.querySelector('[name="cat_slug"]') as HTMLInputElement)?.value?.trim().toLowerCase().replace(/\s+/g, '-') || name?.toLowerCase().replace(/\s+/g, '-')
    const description = (form.querySelector('[name="cat_description"]') as HTMLInputElement)?.value?.trim() || ''
    const gradient = (form.querySelector('[name="cat_gradient"]') as HTMLInputElement)?.value?.trim() || DEFAULT_GRADIENT
    const icon_color = (form.querySelector('[name="cat_icon_color"]') as HTMLInputElement)?.value?.trim() || DEFAULT_ICON_COLOR
    if (!name || !slug) {
      toast({ title: 'Name und Slug nötig', variant: 'destructive' })
      return
    }
    const nextOrder = categories.length > 0 ? Math.max(0, ...categories.map((c) => c.sort_order ?? 0)) + 1 : 0
    const res = await fetch('/api/admin/homepage-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, slug, description, gradient, icon_color, sort_order: nextOrder }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast({ title: 'Fehler', description: (err as { error?: string }).error || 'Hinzufügen fehlgeschlagen', variant: 'destructive' })
      return
    }
    toast({ title: 'Kategorie hinzugefügt' })
    loadCategories()
    form.reset()
  }

  const updateCategoryLocal = (id: string, updates: Partial<HomepageCategory>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
  }

  const saveCategory = async (id: string) => {
    const cat = categoriesRef.current.find((c) => c.id === id)
    if (!cat) return
    const res = await fetch('/api/admin/homepage-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        gradient: cat.gradient,
        icon_color: cat.icon_color,
        gradient_start_hex: cat.gradient_start_hex || null,
        gradient_end_hex: cat.gradient_end_hex || null,
        icon_color_hex: cat.icon_color_hex || null,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast({ title: 'Fehler', description: (err as { error?: string }).error || 'Speichern fehlgeschlagen', variant: 'destructive' })
    }
  }

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Kategorie „${name}" wirklich löschen?`)) return
    const res = await fetch(`/api/admin/homepage-categories?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'include',
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast({ title: 'Fehler', description: (err as { error?: string }).error || 'Löschen fehlgeschlagen', variant: 'destructive' })
      return
    }
    toast({ title: 'Kategorie gelöscht' })
    loadCategories()
  }

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const newOrder = direction === 'up' ? index - 1 : index + 1
    if (newOrder < 0 || newOrder >= categories.length) return
    const a = categories[index]
    const b = categories[newOrder]
    const res1 = await fetch('/api/admin/homepage-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: a.id, sort_order: b.sort_order }),
    })
    const res2 = await fetch('/api/admin/homepage-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: b.id, sort_order: a.sort_order }),
    })
    if (!res1.ok || !res2.ok) {
      toast({ title: 'Fehler', description: 'Reihenfolge konnte nicht gespeichert werden.', variant: 'destructive' })
      return
    }
    loadCategories()
  }

  const applyPaletteToCategory = (categoryId: string, preset: typeof CATEGORY_PALETTE[0]) => {
    const updates = {
      gradient: preset.gradient,
      icon_color: preset.icon_color,
      gradient_start_hex: preset.gradient_start_hex,
      gradient_end_hex: preset.gradient_end_hex,
      icon_color_hex: preset.icon_color_hex,
    }
    updateCategoryLocal(categoryId, updates)
    const cat = categoriesRef.current.find((c) => c.id === categoryId)
    if (cat) {
      saveCategoryWith(categoryId, { ...cat, ...updates })
    }
  }

  const saveCategoryWith = async (id: string, cat: HomepageCategory) => {
    const res = await fetch('/api/admin/homepage-categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        gradient: cat.gradient,
        icon_color: cat.icon_color,
        gradient_start_hex: cat.gradient_start_hex || null,
        gradient_end_hex: cat.gradient_end_hex || null,
        icon_color_hex: cat.icon_color_hex || null,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      toast({ title: 'Fehler', description: (err as { error?: string }).error || 'Speichern fehlgeschlagen', variant: 'destructive' })
    }
  }

  const handleCategoryImageUpload = async (categoryId: string, file: File) => {
    try {
      const { uploadCategoryImage } = await import('@/lib/supabase')
      const url = await uploadCategoryImage(file, categoryId)
      const res = await fetch('/api/admin/homepage-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: categoryId, image_url: url }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, image_url: url } : c)))
      toast({ title: 'Bild hochgeladen' })
    } catch (e: unknown) {
      toast({ title: 'Upload fehlgeschlagen', description: e instanceof Error ? e.message : 'Fehler', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-foreground">Laden...</p>
      </div>
    )
  }

  const onHomepage = influencers.filter((i) => i.show_on_homepage).sort((a, b) => (a.homepage_order ?? 0) - (b.homepage_order ?? 0))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Home className="w-8 h-8 text-luxe-gold" />
            Startseite
          </h1>
          <p className="text-luxe-silver mt-1">
            Kategorien „Was suchst du?“, Anzahl Influencer und welche Influencer auf der Startseite erscheinen.
          </p>
        </div>
        <Button onClick={saveAll} disabled={saving} className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Speichern...' : 'Influencer speichern'}
        </Button>
      </div>

      {/* Anzahl Influencer auf Startseite */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-foreground">Anzahl Influencer auf der Startseite</CardTitle>
          <p className="text-sm text-luxe-silver">Wie viele Influencer-Karten in „Von Influencern kuratiert“ angezeigt werden (0 = keine Sektion).</p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Input
            type="number"
            min={0}
            max={12}
            value={influencerLimit}
            onChange={(e) => setInfluencerLimit(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-24 bg-luxe-gray border-luxe-silver text-foreground"
          />
          <Button onClick={saveInfluencerLimit} disabled={savingLimit} variant="admin-outline">
            {savingLimit ? 'Speichern...' : 'Speichern'}
          </Button>
        </CardContent>
      </Card>

      {/* Kategorien "Was suchst du?" */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-foreground">Kategorien „Was suchst du?“</CardTitle>
          <p className="text-sm text-luxe-silver">Kategorien anpassen, Reihenfolge ändern, eigene Bilder hochladen. Über die Farbpalette wählst du Verläufe (Farben verschwimmen auf der Startseite). Slug = Link zur Shop-Filter-URL (z. B. bongs, grinder).</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((cat, index) => (
            <div key={cat.id} className="p-4 rounded-xl border border-luxe-gray bg-luxe-black/50 flex flex-wrap items-start gap-4">
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveCategory(index, 'up')} disabled={index === 0}><GripVertical className="w-4 h-4" /></Button>
                <span className="text-luxe-silver text-sm w-6">{index + 1}</span>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveCategory(index, 'down')} disabled={index === categories.length - 1}><GripVertical className="w-4 h-4" /></Button>
              </div>
              <div className="w-16 h-16 rounded-full bg-luxe-gray flex-shrink-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-luxe-silver">
                  {(String(cat?.name ?? '').trim() || ' ').charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    value={cat.name}
                    onChange={(e) => updateCategoryLocal(cat.id, { name: e.target.value })}
                    onBlur={() => saveCategory(cat.id)}
                    className="w-40 bg-luxe-gray border-luxe-silver text-foreground"
                    placeholder="Name"
                  />
                  <Input
                    value={cat.slug}
                    onChange={(e) => updateCategoryLocal(cat.id, { slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    onBlur={() => saveCategory(cat.id)}
                    className="w-32 bg-luxe-gray border-luxe-silver text-foreground"
                    placeholder="slug"
                  />
                  <Input
                    value={cat.description}
                    onChange={(e) => updateCategoryLocal(cat.id, { description: e.target.value })}
                    onBlur={() => saveCategory(cat.id)}
                    className="flex-1 min-w-[120px] bg-luxe-gray border-luxe-silver text-foreground"
                    placeholder="Beschreibung"
                  />
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Input
                    value={cat.gradient}
                    onChange={(e) => updateCategoryLocal(cat.id, { gradient: e.target.value })}
                    onBlur={() => saveCategory(cat.id)}
                    className="w-56 bg-luxe-gray border-luxe-silver text-foreground text-sm"
                    placeholder="z. B. from-purple-500/20 to-pink-500/20"
                  />
                  <Input
                    value={cat.icon_color}
                    onChange={(e) => updateCategoryLocal(cat.id, { icon_color: e.target.value })}
                    onBlur={() => saveCategory(cat.id)}
                    className="w-36 bg-luxe-gray border-luxe-silver text-foreground text-sm"
                    placeholder="z. B. text-luxe-gold"
                  />
                </div>
                <div className="w-full mt-2">
                  <Label className="text-luxe-silver text-xs block mb-1.5">Farbpalette (klicken zum Übernehmen)</Label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_PALETTE.map((preset) => {
                      const isActive =
                        (cat.gradient_start_hex === preset.gradient_start_hex && cat.gradient_end_hex === preset.gradient_end_hex) ||
                        (cat.gradient === preset.gradient && cat.icon_color === preset.icon_color)
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          title={preset.name}
                          onClick={() => applyPaletteToCategory(cat.id, preset)}
                          className={`h-9 w-9 rounded-lg border-2 transition-all shrink-0 ${isActive ? 'border-luxe-gold ring-2 ring-luxe-gold/50' : 'border-luxe-gray hover:border-luxe-silver'}`}
                          style={{ background: `linear-gradient(135deg, ${preset.gradient_start_hex} 0%, ${preset.gradient_end_hex} 100%)` }}
                        />
                      )
                    })}
                  </div>
                </div>
                <div className="w-full mt-3 flex flex-wrap gap-4 items-center">
                  <Label className="text-luxe-silver text-xs w-full">Eigene Farben (Hex)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cat.gradient_start_hex && /^#[0-9A-Fa-f]{6}$/.test(cat.gradient_start_hex) ? cat.gradient_start_hex : '#D4AF37'}
                      onChange={(e) => updateCategoryLocal(cat.id, { gradient_start_hex: e.target.value })}
                      onBlur={() => saveCategory(cat.id)}
                      className="h-9 w-9 rounded border border-luxe-gray cursor-pointer bg-transparent"
                    />
                    <Input
                      value={cat.gradient_start_hex ?? ''}
                      onChange={(e) => updateCategoryLocal(cat.id, { gradient_start_hex: e.target.value.replace(/[^#0-9A-Fa-f]/g, '').slice(0, 7) || undefined })}
                      onBlur={() => saveCategory(cat.id)}
                      className="w-24 bg-luxe-gray border-luxe-silver text-foreground text-sm font-mono"
                      placeholder="#D4AF37"
                    />
                    <span className="text-luxe-silver text-xs">Verlauf Start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cat.gradient_end_hex && /^#[0-9A-Fa-f]{6}$/.test(cat.gradient_end_hex) ? cat.gradient_end_hex : '#F59E0B'}
                      onChange={(e) => updateCategoryLocal(cat.id, { gradient_end_hex: e.target.value })}
                      onBlur={() => saveCategory(cat.id)}
                      className="h-9 w-9 rounded border border-luxe-gray cursor-pointer bg-transparent"
                    />
                    <Input
                      value={cat.gradient_end_hex ?? ''}
                      onChange={(e) => updateCategoryLocal(cat.id, { gradient_end_hex: e.target.value.replace(/[^#0-9A-Fa-f]/g, '').slice(0, 7) || undefined })}
                      onBlur={() => saveCategory(cat.id)}
                      className="w-24 bg-luxe-gray border-luxe-silver text-foreground text-sm font-mono"
                      placeholder="#F59E0B"
                    />
                    <span className="text-luxe-silver text-xs">Verlauf Ende</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cat.icon_color_hex && /^#[0-9A-Fa-f]{6}$/.test(cat.icon_color_hex) ? cat.icon_color_hex : '#D4AF37'}
                      onChange={(e) => updateCategoryLocal(cat.id, { icon_color_hex: e.target.value })}
                      onBlur={() => saveCategory(cat.id)}
                      className="h-9 w-9 rounded border border-luxe-gray cursor-pointer bg-transparent"
                    />
                    <Input
                      value={cat.icon_color_hex ?? ''}
                      onChange={(e) => updateCategoryLocal(cat.id, { icon_color_hex: e.target.value.replace(/[^#0-9A-Fa-f]/g, '').slice(0, 7) || undefined })}
                      onBlur={() => saveCategory(cat.id)}
                      className="w-24 bg-luxe-gray border-luxe-silver text-foreground text-sm font-mono"
                      placeholder="#D4AF37"
                    />
                    <span className="text-luxe-silver text-xs">Icon-Farbe</span>
                  </div>
                </div>
              </div>
              {/* Live-Vorschau: wie auf der Startseite */}
              <div className="w-full sm:w-56 flex-shrink-0">
                <Label className="text-luxe-silver text-xs block mb-1.5">Vorschau</Label>
                <div className="relative rounded-xl border border-luxe-gray bg-luxe-black overflow-hidden p-6 h-52 flex flex-col items-center justify-center text-center">
                  {cat.gradient_start_hex && cat.gradient_end_hex ? (
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{ background: `linear-gradient(135deg, ${cat.gradient_start_hex} 0%, ${cat.gradient_end_hex} 100%)` }}
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-30`} />
                  )}
                  <div className="relative z-10 w-14 h-14 rounded-full bg-luxe-gray flex items-center justify-center overflow-hidden">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt="" className="w-full h-full object-cover" />
                    ) : cat.icon_color_hex ? (
                      <span className="text-xl font-bold" style={{ color: cat.icon_color_hex }}>{(cat?.name ?? ' ').charAt(0)}</span>
                    ) : (
                      <span className={`text-xl font-bold ${cat?.icon_color ?? ''}`}>{(cat?.name ?? ' ').charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="relative z-10 text-lg font-bold text-white mt-3 truncate w-full">{cat?.name ?? '—'}</h3>
                  <p className="relative z-10 text-luxe-silver text-xs line-clamp-2 w-full">{cat?.description || '—'}</p>
                </div>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-luxe-gray hover:bg-luxe-gray/50 text-sm text-foreground">
                <Upload className="w-4 h-4" />
                Bild
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleCategoryImageUpload(cat.id, f)
                    e.target.value = ''
                  }}
                />
              </label>
              <Button type="button" variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => deleteCategory(cat.id, cat.name)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <form onSubmit={addCategory} className="p-4 rounded-xl border border-dashed border-luxe-gray flex flex-wrap items-end gap-3">
            <Input name="cat_name" placeholder="Name (z. B. Bongs)" className="w-40 bg-luxe-gray border-luxe-silver text-foreground" required />
            <Input name="cat_slug" placeholder="slug (z. B. bongs)" className="w-32 bg-luxe-gray border-luxe-silver text-foreground" />
            <Input name="cat_description" placeholder="Beschreibung" className="flex-1 min-w-[120px] bg-luxe-gray border-luxe-silver text-foreground" />
            <Input name="cat_gradient" placeholder="Gradient (Tailwind)" className="w-48 bg-luxe-gray border-luxe-silver text-foreground text-sm" defaultValue={DEFAULT_GRADIENT} />
            <Input name="cat_icon_color" placeholder="Icon-Farbe (Tailwind)" className="w-36 bg-luxe-gray border-luxe-silver text-foreground text-sm" defaultValue={DEFAULT_ICON_COLOR} />
            <Button type="submit" variant="admin-outline">
              <Plus className="w-4 h-4 mr-1" />
              Kategorie hinzufügen
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Influencer für Startseite */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-foreground">Influencer für die Startseite</CardTitle>
          <p className="text-sm text-luxe-silver">Aktiviere „Auf Startseite“ und setze die Reihenfolge (0 = zuerst). Es werden maximal so viele angezeigt, wie oben unter „Anzahl Influencer“ eingestellt.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {influencers.map((inf) => (
            <div key={inf.id} className="p-4 rounded-xl border border-luxe-gray bg-luxe-black/50 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`show-${inf.id}`}
                    checked={!!inf.show_on_homepage}
                    onChange={(e) => updateInfluencer(inf.id, { show_on_homepage: e.target.checked })}
                    className="w-4 h-4 rounded border-luxe-gray text-luxe-gold focus:ring-luxe-gold"
                  />
                  <Label htmlFor={`show-${inf.id}`} className="text-foreground font-medium cursor-pointer">Auf Startseite anzeigen</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-luxe-silver text-sm">Reihenfolge</Label>
                  <Input
                    type="number"
                    min={0}
                    value={inf.homepage_order ?? 0}
                    onChange={(e) => updateInfluencer(inf.id, { homepage_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-20 bg-luxe-gray border-luxe-silver text-foreground"
                  />
                </div>
                <span className="text-luxe-silver text-sm">{inf.name} · {inf.product_count ?? 0} Produkte</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-luxe-gray">
                <div>
                  <Label className="text-luxe-silver text-sm">Titel auf Startseite (optional)</Label>
                  <Input placeholder={inf.name} value={inf.homepage_title ?? ''} onChange={(e) => updateInfluencer(inf.id, { homepage_title: e.target.value })} className="mt-1 bg-luxe-gray border-luxe-silver text-foreground" />
                </div>
                <div>
                  <Label className="text-luxe-silver text-sm">Bio auf Startseite (optional)</Label>
                  <Input placeholder={inf.bio ?? 'Kurzbeschreibung'} value={inf.homepage_bio ?? ''} onChange={(e) => updateInfluencer(inf.id, { homepage_bio: e.target.value })} className="mt-1 bg-luxe-gray border-luxe-silver text-foreground" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {onHomepage.length > 0 && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-foreground">Vorschau: So erscheinen sie auf der Startseite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {onHomepage.map((inf, i) => (
                <span key={inf.id} className="px-3 py-1.5 rounded-lg bg-luxe-gray text-foreground text-sm">{i + 1}. {inf.homepage_title || inf.name}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {influencers.length === 0 && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Noch keine Influencer angelegt. Erstelle zuerst <Link href="/admin/influencers" className="text-luxe-gold hover:underline">Influencer</Link>.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
