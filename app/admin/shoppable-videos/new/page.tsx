'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Video, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

export default function AdminShoppableVideosNewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [products, setProducts] = useState<{ id: string; name: string }[]>([])
  const [productId, setProductId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/products/list')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || !title.trim() || !file) {
      toast({ title: 'Produkt, Titel und Video-Datei erforderlich', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const form = new FormData()
      form.set('file', file)
      form.set('product_id', productId)
      form.set('title', title.trim())
      if (description.trim()) form.set('description', description.trim())
      const res = await fetch('/api/admin/shoppable-videos/upload', {
        method: 'POST',
        body: form,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'Video hochgeladen. Wartet auf Freigabe.' })
      router.push('/admin/shoppable-videos')
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/shoppable-videos" className="inline-flex items-center text-luxe-silver hover:text-white">
        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Video className="w-7 h-7 text-luxe-gold" />
          Shoppable Video hochladen
        </h1>
        <p className="text-luxe-silver text-sm mt-1">MP4 oder MOV, max. 5 GB. KCanG §6 wird geprüft.</p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray max-w-lg">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-luxe-silver">Produkt *</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white mt-1">
                  <SelectValue placeholder="Produkt wählen" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-luxe-silver">Titel *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Produktvorstellung" className="bg-luxe-black border-luxe-gray text-white mt-1" required />
            </div>
            <div>
              <Label className="text-luxe-silver">Beschreibung (optional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Kurz beschreiben" className="bg-luxe-black border-luxe-gray text-white mt-1" />
            </div>
            <div>
              <Label className="text-luxe-silver">Video (MP4/MOV, max. 5 GB) *</Label>
              <input
                type="file"
                accept="video/mp4,video/quicktime,.mp4,.mov"
                className="mt-2 block w-full text-sm text-luxe-silver file:mr-4 file:rounded file:border-0 file:bg-luxe-gold file:px-4 file:py-2 file:text-luxe-black file:font-medium"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && <p className="text-xs text-luxe-silver mt-1">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</p>}
            </div>
            <div className="flex gap-4 pt-2">
              <Button type="submit" variant="luxe" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                Hochladen
              </Button>
              <Link href="/admin/shoppable-videos"><Button type="button" variant="admin-outline">Abbrechen</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
