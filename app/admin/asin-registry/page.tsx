'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Plus, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type AsinRow = {
  asin: string
  product_type_id: string
  is_parent: boolean
  parent_asin: string | null
  variation_theme: string | null
  product_id: string | null
  products?: { id: string; name: string; slug: string } | null
}

export default function AdminAsinRegistryPage() {
  const [rows, setRows] = useState<AsinRow[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [asin, setAsin] = useState('')
  const [isParent, setIsParent] = useState(true)
  const [productTypeId, setProductTypeId] = useState('ZUBEHOER')
  const [parentAsin, setParentAsin] = useState('')
  const [variationTheme, setVariationTheme] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const load = async () => {
    try {
      const res = await fetch('/api/admin/asin-registry')
      const data = res.ok ? await res.json() : []
      setRows(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async () => {
    const a = asin.trim().toUpperCase()
    if (!/^[A-Z0-9]{8,15}$/.test(a)) {
      toast({ title: 'ASIN: 8–15 alphanumerische Zeichen', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/asin-registry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asin: a,
          is_parent: isParent,
          product_type_id: productTypeId,
          parent_asin: isParent ? null : parentAsin.trim().toUpperCase() || null,
          variation_theme: isParent ? null : variationTheme.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'ASIN angelegt' })
      setDialogOpen(false)
      setAsin('')
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (a: string) => {
    if (!confirm(`ASIN ${a} entfernen?`)) return
    setDeleting(a)
    try {
      const res = await fetch(`/api/admin/asin-registry/${encodeURIComponent(a)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'ASIN entfernt' })
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setDeleting(null)
    }
  }

  const parents = rows.filter((r) => r.is_parent)
  const children = rows.filter((r) => !r.is_parent)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-luxe-gold" />
            ASIN-Registry (Parent/Child)
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Phase 1.1: Katalog-Variationen. Eltern gruppieren Kinder (Size, Color, etc.). Sync mit products.asin.
          </p>
        </div>
        <Button variant="luxe" onClick={() => setDialogOpen(true)}>
          <Plus className="w-5 h-5 mr-2" />
          ASIN anlegen
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Eltern-ASINs</CardTitle>
            </CardHeader>
            <CardContent>
              {parents.length === 0 ? (
                <p className="text-luxe-silver text-sm">Keine Parent-ASINs.</p>
              ) : (
                <div className="space-y-2">
                  {parents.map((r) => (
                    <div
                      key={r.asin}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-luxe-black/50"
                    >
                      <span className="font-mono text-luxe-gold">{r.asin}</span>
                      <span className="text-luxe-silver text-sm">{r.product_type_id}</span>
                      <Button variant="ghost" size="sm" className="text-red-400" onClick={() => handleDelete(r.asin)} disabled={deleting === r.asin}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Child-ASINs (Variationen)</CardTitle>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <p className="text-luxe-silver text-sm">Keine Child-ASINs.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-luxe-gray text-left text-luxe-silver">
                        <th className="pb-2 pr-4">ASIN</th>
                        <th className="pb-2 pr-4">Parent</th>
                        <th className="pb-2 pr-4">Theme</th>
                        <th className="pb-2 pr-4">Produkt</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {children.map((r) => (
                        <tr key={r.asin} className="border-b border-luxe-gray/70">
                          <td className="py-2 pr-4 font-mono text-luxe-gold">{r.asin}</td>
                          <td className="py-2 pr-4 text-luxe-silver">{r.parent_asin ?? '–'}</td>
                          <td className="py-2 pr-4 text-luxe-silver">{r.variation_theme ?? '–'}</td>
                          <td className="py-2 pr-4">
                            {r.products ? (
                              <Link href={`/admin/products/${r.products.id}/edit`} className="text-luxe-gold hover:underline">
                                {r.products.name}
                              </Link>
                            ) : (
                              '–'
                            )}
                          </td>
                          <td>
                            <Button variant="ghost" size="sm" className="text-red-400 h-8" onClick={() => handleDelete(r.asin)} disabled={deleting === r.asin}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
          <DialogHeader>
            <DialogTitle>ASIN anlegen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-luxe-silver">ASIN * (8–15 Zeichen)</Label>
              <Input
                value={asin}
                onChange={(e) => setAsin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="B09XYZ1234"
                className="bg-luxe-black border-luxe-gray text-white mt-1 font-mono"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isParent} onChange={(e) => setIsParent(e.target.checked)} className="rounded text-luxe-gold" />
                <span className="text-luxe-silver">Parent-ASIN (gruppiert Variationen)</span>
              </label>
            </div>
            <div>
              <Label className="text-luxe-silver">Produkttyp</Label>
              <Input value={productTypeId} onChange={(e) => setProductTypeId(e.target.value.toUpperCase())} className="bg-luxe-black border-luxe-gray text-white mt-1" />
            </div>
            {!isParent && (
              <>
                <div>
                  <Label className="text-luxe-silver">Parent-ASIN</Label>
                  <Input value={parentAsin} onChange={(e) => setParentAsin(e.target.value.toUpperCase())} className="bg-luxe-black border-luxe-gray text-white mt-1 font-mono" />
                </div>
                <div>
                  <Label className="text-luxe-silver">Variation Theme (Size, Color, …)</Label>
                  <Input value={variationTheme} onChange={(e) => setVariationTheme(e.target.value)} className="bg-luxe-black border-luxe-gray text-white mt-1" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
            <Button variant="luxe" onClick={handleAdd} disabled={saving || asin.length < 8}>
              {saving ? 'Speichern…' : 'Anlegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
