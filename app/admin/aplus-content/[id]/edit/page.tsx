'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Image, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { APlusBlockEditor } from '@/components/admin/aplus-block-editor'

export default function AdminAPlusContentEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : ''
  const { toast } = useToast()
  const [blockType, setBlockType] = useState<string>('text_only')
  const [content, setContent] = useState<Record<string, unknown>>({})
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [productName, setProductName] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/aplus-content/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((block: any) => {
        if (block) {
          setBlockType(block.block_type ?? 'text_only')
          setContent(block.content ?? {})
          setSortOrder(block.sort_order ?? 0)
          setIsActive(block.is_active !== false)
          setProductName(block.products?.name ?? block.product_id ?? '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/aplus-content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
      toast({ title: 'A+ Block gespeichert' })
      router.push('/admin/aplus-content')
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/aplus-content" className="inline-flex items-center text-luxe-silver hover:text-white">
        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Image className="w-7 h-7 text-luxe-gold" />
          A+ Block bearbeiten
        </h1>
        <p className="text-luxe-silver text-sm mt-1">Produkt: {productName || id}</p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-luxe-silver">Blocktyp</Label>
              <select
                value={blockType}
                onChange={(e) => {
                  const v = e.target.value
                  setBlockType(v)
                  if (v !== blockType) setContent({})
                }}
                className="mt-1 w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
              >
                <option value="text_only">Nur Text</option>
                <option value="image_text">Bild + Text</option>
                <option value="comparison_table">Vergleichstabelle</option>
                <option value="feature_list">Feature-Liste</option>
                <option value="image_gallery">Bildergalerie</option>
              </select>
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
                Speichern
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
