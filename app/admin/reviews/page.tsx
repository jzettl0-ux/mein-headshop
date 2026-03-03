'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, Trash2, Download, Lock, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface Review {
  id: string
  product_id: string
  product_name: string
  product_slug: string
  rating: number
  comment: string | null
  is_private: boolean | null
  created_at: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadReviews = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reviews')
      if (!res.ok) throw new Error('Laden fehlgeschlagen')
      const data = await res.json()
      setReviews(data)
    } catch (e) {
      toast({ title: 'Fehler', description: 'Bewertungen konnten nicht geladen werden.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Bewertung wirklich löschen?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Löschen fehlgeschlagen')
      setReviews((prev) => prev.filter((r) => r.id !== id))
      toast({ title: 'Gelöscht', description: 'Bewertung wurde entfernt.' })
    } catch (e) {
      toast({ title: 'Fehler', description: 'Bewertung konnte nicht gelöscht werden.', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = () => {
    window.open('/api/admin/reviews/export', '_blank')
    toast({ title: 'Export', description: 'CSV-Download gestartet. In Google Sheets: Datei → Importieren → Hochladen.' })
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Bewertungen</h1>
        <p className="text-luxe-silver">Laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Bewertungen</h1>
        <Button onClick={handleExport} variant="admin-outline">
          <Download className="w-4 h-4 mr-2" />
          Als CSV für Google Sheets exportieren
        </Button>
      </div>

      <p className="text-luxe-silver text-sm">
        Hier siehst du alle Bewertungen inkl. privater. Anstößige Kommentare kannst du löschen. Export für Auswertung und Verbesserungen.
      </p>

      {reviews.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-8 text-center text-luxe-silver">
            Noch keine Bewertungen vorhanden.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-4 flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/shop/${r.product_slug}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {r.product_name || '(Produkt unbekannt)'}
                    </Link>
                    {r.is_private && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-500" title="Nur für dich sichtbar">
                        <Lock className="w-3.5 h-3.5" /> Privat
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i <= r.rating ? 'fill-current' : 'opacity-40'}`}
                      />
                    ))}
                    <span className="text-sm text-luxe-silver ml-1">{r.rating}/5</span>
                  </div>
                  {r.comment && (
                    <p className="mt-2 text-sm text-luxe-silver flex items-start gap-1">
                      <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{r.comment}</span>
                    </p>
                  )}
                  <p className="text-xs text-luxe-silver mt-2">{formatDate(r.created_at)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10 shrink-0"
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Löschen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
