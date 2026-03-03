'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image as ImageIcon, Upload, Loader2, Trash2, Pencil, X, Check } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

type Asset = {
  id: string
  title: string
  category: string
  visibility: string
  storage_path: string
  format_info: string | null
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
  url: string
}

const CATEGORIES = [
  { value: 'product_photos', label: 'Produktfotos' },
  { value: 'banner', label: 'Banner' },
  { value: 'logos', label: 'Logos' },
] as const

const VISIBILITIES = [
  { value: 'public', label: 'Öffentlich' },
  { value: 'partner_only', label: 'Nur Partner' },
] as const

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', category: '', visibility: '', format_info: '' })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'product_photos',
    visibility: 'partner_only',
    format_info: '',
    file: null as File | null,
  })
  const { toast } = useToast()

  const loadAssets = () => {
    fetch('/api/admin/assets')
      .then((r) => (r.ok ? r.json() : { assets: [] }))
      .then((d) => setAssets(d.assets ?? []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAssets()
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.title.trim() || !uploadForm.file) {
      toast({ title: 'Titel und Datei erforderlich', variant: 'destructive' })
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.set('title', uploadForm.title.trim())
    formData.set('category', uploadForm.category)
    formData.set('visibility', uploadForm.visibility)
    if (uploadForm.format_info.trim()) formData.set('format_info', uploadForm.format_info.trim())
    formData.set('file', uploadForm.file)

    try {
      const res = await fetch('/api/assets/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: data.error ?? 'Upload fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({ title: 'Asset hochgeladen' })
      setUploadForm({ title: '', category: 'product_photos', visibility: 'partner_only', format_info: '', file: null })
      loadAssets()
    } finally {
      setUploading(false)
    }
  }

  const startEdit = (asset: Asset) => {
    setEditingId(asset.id)
    setEditForm({
      title: asset.title,
      category: asset.category,
      visibility: asset.visibility,
      format_info: asset.format_info ?? '',
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    try {
      const res = await fetch(`/api/admin/assets/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: data.error ?? 'Speichern fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({ title: 'Asset aktualisiert' })
      setEditingId(null)
      loadAssets()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Asset wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/assets/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast({ title: data.error ?? 'Löschen fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({ title: 'Asset gelöscht' })
      setAssets((prev) => prev.filter((a) => a.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Asset-Mediathek</h1>
        <p className="text-luxe-silver mt-1">
          Bilder für das Influencer-Portal hochladen und verwalten
        </p>
      </div>

      {/* Upload */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-luxe-gold" />
            Neues Asset hochladen
          </CardTitle>
          <CardDescription className="text-luxe-silver">
            Titel, Kategorie und Sichtbarkeit festlegen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4 max-w-xl">
            <div>
              <Label className="text-luxe-silver">Titel *</Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm((f) => ({ ...f, title: e.target.value }))}
                className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                placeholder="z.B. Hero Banner Sommer"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-luxe-silver">Kategorie</Label>
                <select
                  value={uploadForm.category}
                  onChange={(e) => setUploadForm((f) => ({ ...f, category: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-luxe-silver bg-luxe-gray px-3 py-2 text-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-luxe-silver">Sichtbarkeit</Label>
                <select
                  value={uploadForm.visibility}
                  onChange={(e) => setUploadForm((f) => ({ ...f, visibility: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-luxe-silver bg-luxe-gray px-3 py-2 text-white"
                >
                  {VISIBILITIES.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-luxe-silver">Format-Info (z.B. Optimiert für Instagram Story)</Label>
              <Input
                value={uploadForm.format_info}
                onChange={(e) => setUploadForm((f) => ({ ...f, format_info: e.target.value }))}
                className="mt-1 bg-luxe-gray border-luxe-silver text-white"
                placeholder="Optional"
              />
            </div>
            <div>
              <Label className="text-luxe-silver">Datei *</Label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setUploadForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))}
                className="mt-1 block w-full text-sm text-luxe-silver file:mr-4 file:rounded file:border-0 file:bg-luxe-gold file:px-4 file:py-2 file:text-luxe-black"
              />
            </div>
            <Button type="submit" disabled={uploading} variant="luxe">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
              Hochladen
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Mediathek */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-luxe-gold" />
            Alle Assets
          </CardTitle>
          <CardDescription className="text-luxe-silver">
            Bearbeiten oder löschen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-luxe-gold animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <p className="text-luxe-silver py-12 text-center">Noch keine Assets.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {assets.map((asset, i) => (
                  <motion.div
                    key={asset.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="rounded-xl border border-luxe-gray overflow-hidden bg-luxe-gray/30"
                  >
                    <div className="aspect-square relative bg-luxe-black">
                      <img
                        src={asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                      {editingId === asset.id ? (
                        <div className="absolute inset-0 bg-luxe-black/80 p-3 flex flex-col gap-2 overflow-y-auto">
                          <Input
                            value={editForm.title}
                            onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                            className="bg-luxe-gray text-white text-sm"
                            placeholder="Titel"
                          />
                          <select
                            value={editForm.category}
                            onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                            className="rounded border border-luxe-silver bg-luxe-gray px-2 py-1.5 text-white text-sm"
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                          <select
                            value={editForm.visibility}
                            onChange={(e) => setEditForm((f) => ({ ...f, visibility: e.target.value }))}
                            className="rounded border border-luxe-silver bg-luxe-gray px-2 py-1.5 text-white text-sm"
                          >
                            {VISIBILITIES.map((v) => (
                              <option key={v.value} value={v.value}>{v.label}</option>
                            ))}
                          </select>
                          <Input
                            value={editForm.format_info}
                            onChange={(e) => setEditForm((f) => ({ ...f, format_info: e.target.value }))}
                            className="bg-luxe-gray text-white text-sm"
                            placeholder="Format-Info"
                          />
                          <div className="flex gap-2 mt-auto">
                            <Button size="sm" variant="admin-outline" className="flex-1" onClick={() => setEditingId(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="luxe" className="flex-1" onClick={saveEdit}>
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <div className="p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{asset.title}</p>
                        <p className="text-luxe-silver text-xs">{asset.format_info || asset.category}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-luxe-silver hover:text-white"
                          onClick={() => startEdit(asset)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                          disabled={deletingId === asset.id}
                          onClick={() => handleDelete(asset.id)}
                        >
                          {deletingId === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
