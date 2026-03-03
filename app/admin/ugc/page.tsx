'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, X, Loader2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UGCPost {
  post_id: string
  image_url: string
  caption: string | null
  status: string
  likes_count: number
  created_at: string
}

export default function AdminUGCPage() {
  const [posts, setPosts] = useState<UGCPost[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/ugc', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  const handleStatus = async (postId: string, status: 'PUBLISHED' | 'REJECTED') => {
    setUpdating(postId)
    try {
      const res = await fetch(`/api/admin/ugc/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Fehler')
      setPosts((prev) => prev.map((p) => (p.post_id === postId ? { ...p, status } : p)))
    } catch {
      // ignore
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')
  const pending = posts.filter((p) => p.status === 'PENDING_MODERATION')
  const published = posts.filter((p) => p.status === 'PUBLISHED')
  const rejected = posts.filter((p) => p.status === 'REJECTED')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">UGC Moderation (Rate my Setup)</h1>

      {loading ? (
        <div className="flex items-center gap-2 text-luxe-silver">
          <Loader2 className="w-5 h-5 animate-spin" /> Laden…
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-luxe-gray bg-luxe-charcoal/60 p-8 text-center text-luxe-silver">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Keine UGC-Posts vorhanden.</p>
          <Link href="/rate-my-setup" className="text-luxe-gold hover:underline mt-2 inline-block">
            Rate my Setup ansehen
          </Link>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-amber-400 mb-4">Offen ({pending.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((p) => (
                  <div
                    key={p.post_id}
                    className="rounded-lg border border-luxe-gray bg-luxe-charcoal overflow-hidden"
                  >
                    <div className="aspect-square bg-luxe-black">
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      {p.caption && <p className="text-sm text-luxe-silver mb-2 line-clamp-2">{p.caption}</p>}
                      <p className="text-xs text-luxe-silver/70">{formatDate(p.created_at)}</p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="admin-outline"
                          className="flex-1 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/20"
                          disabled={!!updating}
                          onClick={() => handleStatus(p.post_id, 'PUBLISHED')}
                        >
                          {updating === p.post_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Freigeben
                        </Button>
                        <Button
                          size="sm"
                          variant="admin-outline"
                          className="flex-1 text-red-400 border-red-500/50 hover:bg-red-500/20"
                          disabled={!!updating}
                          onClick={() => handleStatus(p.post_id, 'REJECTED')}
                        >
                          {updating === p.post_id ? null : <X className="w-4 h-4" />}
                          Ablehnen
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {published.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-emerald-500 mb-4">Veröffentlicht ({published.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {published.map((p) => (
                  <div key={p.post_id} className="rounded-lg border border-luxe-gray bg-luxe-charcoal overflow-hidden">
                    <div className="aspect-square bg-luxe-black">
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      {p.caption && <p className="text-xs text-luxe-silver line-clamp-2">{p.caption}</p>}
                      <p className="text-xs text-luxe-silver/70 mt-1">{formatDate(p.created_at)}</p>
                      <Button
                        size="sm"
                        variant="admin-outline"
                        className="mt-2 w-full text-red-400 border-red-500/50 hover:bg-red-500/20"
                        disabled={!!updating}
                        onClick={() => handleStatus(p.post_id, 'REJECTED')}
                      >
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {rejected.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-red-400 mb-4">Abgelehnt ({rejected.length})</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {rejected.map((p) => (
                  <div key={p.post_id} className="rounded-lg border border-luxe-gray bg-luxe-charcoal/60 overflow-hidden opacity-75">
                    <div className="aspect-square bg-luxe-black">
                      <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      {p.caption && <p className="text-xs text-luxe-silver line-clamp-2">{p.caption}</p>}
                      <p className="text-xs text-luxe-silver/70 mt-1">{formatDate(p.created_at)}</p>
                      <Button
                        size="sm"
                        variant="admin-outline"
                        className="mt-2 w-full text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/20"
                        disabled={!!updating}
                        onClick={() => handleStatus(p.post_id, 'PUBLISHED')}
                      >
                        Freigeben
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
