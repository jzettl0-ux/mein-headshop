'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Video, Plus, Loader2, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export default function AdminShoppableVideosPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/shoppable-videos')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/shoppable-videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Fehler')
      }
      load()
      toast({ title: 'Freigegeben' })
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : 'Fehler', variant: 'destructive' })
    }
  }

  const handleReject = async (id: string, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/shoppable-videos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejection_reason: reason || null }),
      })
      if (!res.ok) throw new Error()
      load()
      toast({ title: 'Abgelehnt' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Video wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/shoppable-videos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setVideos((prev) => prev.filter((v) => v.id !== id))
      toast({ title: 'Gelöscht' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const formatSize = (bytes?: number) => {
    if (!bytes) return '–'
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Video className="w-7 h-7 text-luxe-gold" />
            Shoppable Videos
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            MP4/MOV bis 5 GB. KCanG §6: Kein verherrlichendes Cannabis. Admin-Freigabe erforderlich.
          </p>
        </div>
        <Link href="/admin/shoppable-videos/new">
          <Button variant="luxe"><Plus className="w-5 h-5 mr-2" />Video hochladen</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : videos.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <Video className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Shoppable Videos.</p>
            <Link href="/admin/shoppable-videos/new">
              <Button variant="luxe" className="mt-4">Erstes Video hochladen</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {videos.map((v) => {
            const p = v.products
            return (
              <Card key={v.id} className="bg-luxe-charcoal border-luxe-gray">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {p?.image_url ? (
                      <img src={p.image_url} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-luxe-gray flex items-center justify-center">
                        <Video className="w-6 h-6 text-luxe-silver" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{v.title}</p>
                      <p className="text-sm text-luxe-silver">{p?.name ?? v.product_id} · {formatSize(v.file_size_bytes)}</p>
                      {v.rejection_reason && (
                        <p className="text-xs text-red-400 mt-0.5">Ablehnung: {v.rejection_reason}</p>
                      )}
                      <Badge
                        variant={v.status === 'approved' ? 'default' : v.status === 'rejected' ? 'destructive' : 'secondary'}
                        className="mt-1"
                      >
                        {v.status === 'approved' ? 'Freigegeben' : v.status === 'rejected' ? 'Abgelehnt' : 'Wartet'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.status === 'pending' && (
                      <>
                        <Button variant="admin-outline" size="sm" className="text-green-400" onClick={() => handleApprove(v.id)}>
                          <Check className="w-4 h-4 mr-1" />Freigeben
                        </Button>
                        <Button variant="admin-outline" size="sm" className="text-red-400" onClick={() => handleReject(v.id)}>
                          <X className="w-4 h-4 mr-1" />Ablehnen
                        </Button>
                      </>
                    )}
                    <Button variant="admin-outline" size="sm" className="text-red-400" onClick={() => handleDelete(v.id)}>
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
