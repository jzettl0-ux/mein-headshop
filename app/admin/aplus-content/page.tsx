'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Image, Plus, Loader2, Trash2, Edit, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

const BLOCK_LABELS: Record<string, string> = {
  image_text: 'Bild + Text',
  text_only: 'Nur Text',
  comparison_table: 'Vergleichstabelle',
  feature_list: 'Feature-Liste',
  image_gallery: 'Bildergalerie',
}

export default function AdminAPlusContentPage() {
  const [blocks, setBlocks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/aplus-content')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBlocks(Array.isArray(data) ? data : []))
      .catch(() => setBlocks([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleDelete = async (id: string) => {
    if (!confirm('A+ Block wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/aplus-content/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setBlocks((prev) => prev.filter((b) => b.id !== id))
      toast({ title: 'Block gelöscht' })
    } catch {
      toast({ title: 'Fehler beim Löschen', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Image className="w-7 h-7 text-luxe-gold" />
            A+ Content (Enhanced Brand Content)
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Visueller Baukasten für Produktdetailseiten – Bild+Text, Tabellen, Feature-Listen, Galerien.
          </p>
        </div>
        <Link href="/admin/aplus-content/new">
          <Button variant="luxe">
            <Plus className="w-5 h-5 mr-2" />
            Block anlegen
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : blocks.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <Image className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine A+ Blöcke.</p>
            <Link href="/admin/aplus-content/new">
              <Button variant="luxe" className="mt-4">
                Ersten Block anlegen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blocks.map((b) => {
            const p = b.products
            const slug = p?.slug ?? ''
            return (
              <Card key={b.id} className="bg-luxe-charcoal border-luxe-gray">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-luxe-gray flex items-center justify-center shrink-0">
                      <Image className="w-6 h-6 text-luxe-silver" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{p?.name ?? b.product_id}</p>
                      <p className="text-sm text-luxe-silver">
                        {BLOCK_LABELS[b.block_type] ?? b.block_type} · Sortierung {b.sort_order}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <Badge variant={b.is_active ? 'default' : 'secondary'}>
                          {b.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {slug && (
                      <Link href={`/shop/${slug}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="admin-outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ansehen
                        </Button>
                      </Link>
                    )}
                    <Link href={`/admin/aplus-content/${b.id}/edit`}>
                      <Button variant="admin-outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Bearbeiten
                      </Button>
                    </Link>
                    <Button
                      variant="admin-outline"
                      size="sm"
                      className="text-red-400"
                      onClick={() => handleDelete(b.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
