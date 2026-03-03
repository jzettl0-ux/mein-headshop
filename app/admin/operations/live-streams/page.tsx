'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Video, Plus, Pencil, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Geplant',
  LIVE: 'Live',
  ENDED: 'Beendet',
  VOD: 'VOD',
}

export default function AdminLiveStreamsPage() {
  const [streams, setStreams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ stream_title: '', hls_stream_url: '', status: 'SCHEDULED' })
  const { toast } = useToast()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.stream_title.trim()) {
      toast({ title: 'Titel eingeben', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/live-streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stream_title: form.stream_title.trim(),
          hls_stream_url: form.hls_stream_url.trim() || undefined,
          status: form.status,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'Stream angelegt' })
      setForm({ stream_title: '', hls_stream_url: '', status: 'SCHEDULED' })
      setShowForm(false)
      load()
    } finally {
      setSubmitting(false)
    }
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/live-streams')
      if (res.ok) setStreams(await res.json())
      else setStreams([])
    } catch {
      setStreams([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center">
        <Video className="w-7 h-7 mr-2 text-luxe-gold" />
        Live-Streams
      </h1>
      <p className="text-luxe-silver text-sm">
        Streams anlegen, HLS-URL setzen und Produkte zuordnen (deep_tech.live_streams).
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="luxe" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" /> Neuer Stream
        </Button>
      </div>
      {showForm && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Stream anlegen</h2>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div>
                <label className="text-sm text-luxe-silver block mb-1">Titel *</label>
                <input
                  value={form.stream_title}
                  onChange={(e) => setForm((f) => ({ ...f, stream_title: e.target.value }))}
                  className="w-full rounded bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                  placeholder="z. B. Produktvorstellung Freitag"
                />
              </div>
              <div>
                <label className="text-sm text-luxe-silver block mb-1">HLS-URL (optional)</label>
                <input
                  value={form.hls_stream_url}
                  onChange={(e) => setForm((f) => ({ ...f, hls_stream_url: e.target.value }))}
                  className="w-full rounded bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="text-sm text-luxe-silver block mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full rounded bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
                >
                  <option value="SCHEDULED">Geplant</option>
                  <option value="LIVE">Live</option>
                  <option value="ENDED">Beendet</option>
                  <option value="VOD">VOD</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>Anlegen</Button>
                <Button type="button" variant="admin-outline" onClick={() => setShowForm(false)}>Abbrechen</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : streams.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Noch keine Streams. Klicke auf „Neuer Stream“ um einen anzulegen.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {streams.map((s) => (
            <Card key={s.stream_id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{s.stream_title}</span>
                    <Badge variant="secondary">{STATUS_LABELS[s.status] ?? s.status}</Badge>
                  </div>
                  {s.hls_stream_url && (
                    <p className="text-sm text-luxe-silver truncate max-w-md">{s.hls_stream_url}</p>
                  )}
                  <p className="text-xs text-luxe-silver/80">
                    Viewer: {s.viewer_count ?? 0} · Erstellt: {s.created_at ? new Date(s.created_at).toLocaleDateString('de-DE') : '–'}
                  </p>
                </div>
                <Link href={`/admin/operations/live-streams/${s.stream_id}`}>
                  <Button variant="admin-outline" size="sm"><Pencil className="w-4 h-4 mr-1" /> Bearbeiten</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-xs text-luxe-silver">
        Produkte zuordnen: Auf „Bearbeiten“ gehen oder <code>POST /api/admin/live-streams/[id]/products</code> mit product_id.
      </p>
    </div>
  )
}
