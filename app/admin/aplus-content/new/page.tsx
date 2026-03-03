'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Image, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { APlusBlockEditor } from '@/components/admin/aplus-block-editor'

export default function AdminAPlusContentNewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [productId, setProductId] = useState('')
  const [blockType, setBlockType] = useState<string>('text_only')
  const [content, setContent] = useState<Record<string, unknown>>({})
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/products/list')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) {
      toast({ title: 'Produkt auswählen', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/aplus-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          block_type: blockType,
          content,
          sort_order: sortOrder,
          is_active: isActive,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'A+ Block angelegt' })
      router.push('/admin/aplus-content')
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/aplus-content" className="inline-flex items-center text-luxe-silver hover:text-white">
        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Image className="w-7 h-7 text-luxe-gold" />
          A+ Block anlegen
        </h1>
        <p className="text-luxe-silver text-sm mt-1">Marken-Inhalte für Produktdetailseiten.</p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-luxe-silver">Produkt *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white mt-1">
                  <SelectValue placeholder="Produkt wählen" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-luxe-silver">Blocktyp</Label>
              <Select value={blockType} onValueChange={(v) => { setBlockType(v); setContent({}); }}>
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text_only">Nur Text</SelectItem>
                  <SelectItem value="image_text">Bild + Text</SelectItem>
                  <SelectItem value="comparison_table">Vergleichstabelle</SelectItem>
                  <SelectItem value="feature_list">Feature-Liste</SelectItem>
                  <SelectItem value="image_gallery">Bildergalerie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <APlusBlockEditor blockType={blockType} content={content} onChange={setContent} />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-luxe-silver">Reihenfolge (sort_order)</Label>
                <Input
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="bg-luxe-black border-luxe-gray text-white mt-1"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-luxe-gray bg-luxe-black text-luxe-gold"
                  />
                  <span className="text-luxe-silver">Aktiv</span>
                </label>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <Button type="submit" variant="luxe" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Image className="w-4 h-4 mr-2" />
                )}
                Block speichern
              </Button>
              <Link href="/admin/aplus-content">
                <Button type="button" variant="admin-outline">
                  Abbrechen
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
