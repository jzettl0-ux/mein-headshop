'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, MessageSquare, Check, X, Loader2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface Review {
  id: string
  product_id: string
  product_name: string
  product_slug: string
  rating: number
  comment: string | null
  is_private: boolean | null
  moderation_status: string | null
  display_name: string | null
  created_at: string
}

interface FeedbackData {
  reviews: Review[]
  shopAverage: number
  totalCount: number
  approvedCount: number
  pendingCount: number
}

export default function AdminFeedbackPage() {
  const [data, setData] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/feedback')
      if (!res.ok) throw new Error('Laden fehlgeschlagen')
      const json = await res.json()
      setData(json)
    } catch {
      toast({ title: 'Fehler', description: 'Feedback konnte nicht geladen werden.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const setModeration = async (id: string, status: 'approved' | 'rejected') => {
    setActingId(id)
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, moderation_status: status }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: json.error || 'Aktion fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({ title: status === 'approved' ? 'Genehmigt' : 'Abgelehnt', description: 'Bewertung wurde aktualisiert.' })
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setActingId(null)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-slate-700">Kunden-Feedback</h1>
        <p className="text-slate-600">Keine Daten geladen.</p>
      </div>
    )
  }

  const { reviews, shopAverage, totalCount, approvedCount, pendingCount } = data

  return (
    <div className="admin-area max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-700">Kunden-Feedback</h1>
        <p className="text-sm text-slate-600 mt-1">
          Bewertungen moderieren und Shop-Statistik einsehen. Genehmigte Bewertungen erscheinen auf den Produktseiten.
        </p>
      </div>

      {/* Statistik: Durchschnittliche Sternebewertung Shop-weit */}
      <Card className="bg-[#EBE8E2] border border-[#c4bfb5] shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#c4bfb5] pb-4">
          <CardTitle className="text-slate-700 text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--luxe-primary)]" />
            Statistik
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-xl bg-white/60 border border-[#c4bfb5]">
              <p className="text-2xl font-bold text-emerald-600">{shopAverage.toFixed(1)}</p>
              <p className="text-xs text-slate-600 mt-1">Ø Sterne (Shop)</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/60 border border-[#c4bfb5]">
              <p className="text-2xl font-bold text-slate-700">{totalCount}</p>
              <p className="text-xs text-slate-600 mt-1">Bewertungen gesamt</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/60 border border-[#c4bfb5]">
              <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
              <p className="text-xs text-slate-600 mt-1">Genehmigt</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/60 border border-[#c4bfb5]">
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-slate-600 mt-1">Ausstehend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste aller Bewertungen */}
      <Card className="bg-[#EBE8E2] border border-[#c4bfb5] shadow-sm overflow-hidden">
        <CardHeader className="border-b border-[#c4bfb5]">
          <CardTitle className="text-slate-700 text-lg">Alle Bewertungen</CardTitle>
          <p className="text-sm text-slate-600 font-normal">
            Kommentare genehmigen oder ablehnen – nur genehmigte erscheinen im Shop.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {reviews.length === 0 ? (
            <div className="py-12 text-center text-slate-600">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine Bewertungen eingegangen.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[#c4bfb5]">
              {reviews.map((r) => (
                <li key={r.id} className="p-5 hover:bg-white/40 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/shop/${r.product_slug}`}
                          className="font-medium text-slate-700 hover:text-emerald-600"
                        >
                          {r.product_name || '(Produkt)'}
                        </Link>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            r.moderation_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.moderation_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.moderation_status === 'approved' ? 'Genehmigt' : r.moderation_status === 'rejected' ? 'Abgelehnt' : 'Ausstehend'}
                        </span>
                        {r.is_private && (
                          <span className="text-xs text-slate-600">Nur intern</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i <= r.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="text-sm text-slate-600 ml-1">{r.rating}/5</span>
                      </div>
                      {r.comment && (
                        <p className="mt-2 text-sm text-slate-700 flex items-start gap-1.5">
                          <MessageSquare className="w-4 h-4 shrink-0 mt-0.5 text-slate-500" />
                          <span className="whitespace-pre-wrap">{r.comment}</span>
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-2">
                        {r.display_name?.trim() || 'Kunde'} · {formatDate(r.created_at)}
                      </p>
                    </div>
                    {r.moderation_status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                          disabled={actingId === r.id}
                          onClick={() => setModeration(r.id, 'approved')}
                        >
                          {actingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                          Genehmigen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                          disabled={actingId === r.id}
                          onClick={() => setModeration(r.id, 'rejected')}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Ablehnen
                        </Button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
