'use client'

import { useState, useEffect } from 'react'
import { Star, Trash2, Plus, Check, X, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

interface ShopReview {
  id: string
  rating: number
  comment: string | null
  display_name: string
  source: 'customer' | 'google'
  moderation_status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function AdminShopReviewsPage() {
  const [reviews, setReviews] = useState<ShopReview[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({
    display_name: '',
    comment: '',
    rating: 5,
    source: 'google' as 'customer' | 'google',
    moderation_status: 'approved' as 'pending' | 'approved',
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadReviews = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/shop-reviews')
      if (!res.ok) throw new Error('Laden fehlgeschlagen')
      const data = await res.json()
      setReviews(Array.isArray(data) ? data : [])
    } catch (e) {
      toast({ title: 'Fehler', description: 'Bewertungen konnten nicht geladen werden.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/admin/shop-reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, moderation_status: 'approved' }),
      })
      if (!res.ok) throw new Error('Fehler')
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, moderation_status: 'approved' } : r)))
      toast({ title: 'Freigegeben', description: 'Bewertung ist jetzt sichtbar.' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const handleReject = async (id: string) => {
    try {
      const res = await fetch('/api/admin/shop-reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, moderation_status: 'rejected' }),
      })
      if (!res.ok) throw new Error('Fehler')
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, moderation_status: 'rejected' } : r)))
      toast({ title: 'Abgelehnt' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bewertung wirklich löschen?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/shop-reviews?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Löschen fehlgeschlagen')
      setReviews((prev) => prev.filter((r) => r.id !== id))
      toast({ title: 'Gelöscht' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.display_name.trim()) {
      toast({ title: 'Anzeigename erforderlich', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/shop-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: addForm.display_name.trim(),
          comment: addForm.comment.trim() || undefined,
          rating: addForm.rating,
          source: addForm.source,
          moderation_status: addForm.moderation_status,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Speichern fehlgeschlagen')
      toast({ title: 'Bewertung hinzugefügt' })
      setAddForm({ display_name: '', comment: '', rating: 5, source: 'google', moderation_status: 'approved' })
      setShowAdd(false)
      loadReviews()
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')
  const pending = reviews.filter((r) => r.moderation_status === 'pending')
  const approved = reviews.filter((r) => r.moderation_status === 'approved')
  const rejected = reviews.filter((r) => r.moderation_status === 'rejected')

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Shop-Bewertungen</h1>
        <p className="text-luxe-silver">Laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Shop-Bewertungen</h1>
        <Button onClick={() => setShowAdd(!showAdd)} variant="luxe">
          <Plus className="w-4 h-4 mr-2" />
          Bewertung anlegen (z. B. Google)
        </Button>
      </div>

      <p className="text-luxe-silver text-sm">
        Allgemeine Bewertungen über den Shop (Kunden + Google). Kundenbewertungen erscheinen nach Freigabe. Google-Bewertungen kannst du manuell hinzufügen.
      </p>

      {showAdd && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Neue Bewertung anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4 max-w-md">
              <div>
                <Label className="text-white">Typ</Label>
                <select
                  value={addForm.source}
                  onChange={(e) => setAddForm((f) => ({ ...f, source: e.target.value as 'customer' | 'google' }))}
                  className="w-full h-10 px-3 py-2 mt-1 bg-luxe-gray border border-luxe-silver rounded-md text-white"
                >
                  <option value="google">Google Bewertung</option>
                  <option value="customer">Kundenbewertung</option>
                </select>
              </div>
              <div>
                <Label className="text-white">Anzeigename *</Label>
                <Input
                  value={addForm.display_name}
                  onChange={(e) => setAddForm((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="z. B. Max M. oder Google Nutzer"
                  className="bg-luxe-gray border-luxe-silver text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Sterne</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setAddForm((f) => ({ ...f, rating: s }))}
                      className="p-1"
                    >
                      <Star className={`w-6 h-6 ${addForm.rating >= s ? 'text-amber-400 fill-amber-400' : 'text-luxe-gray'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-white">Kommentar</Label>
                <textarea
                  value={addForm.comment}
                  onChange={(e) => setAddForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Bewertungstext..."
                  rows={4}
                  className="w-full px-3 py-2 mt-1 bg-luxe-gray border border-luxe-silver rounded-md text-white resize-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addForm.moderation_status === 'approved'}
                    onChange={(e) => setAddForm((f) => ({ ...f, moderation_status: e.target.checked ? 'approved' : 'pending' }))}
                    className="rounded"
                  />
                  <span className="text-white">Sofort freigeben (sichtbar)</span>
                </label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="luxe" disabled={saving}>Speichern</Button>
                <Button type="button" variant="admin-outline" onClick={() => setShowAdd(false)}>Abbrechen</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <Card className="bg-luxe-charcoal border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-white">Ausstehende Freigabe ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((r) => (
              <ReviewCard
                key={r.id}
                r={r}
                formatDate={formatDate}
                onApprove={() => handleApprove(r.id)}
                onReject={() => handleReject(r.id)}
                onDelete={() => handleDelete(r.id)}
                deletingId={deletingId}
              />
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Alle Bewertungen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviews.length === 0 ? (
            <p className="text-luxe-silver py-4">Noch keine Shop-Bewertungen. Kunden können unter /bewertungen Bewertungen abgeben. Google-Bewertungen kannst du oben manuell hinzufügen.</p>
          ) : (
            [...approved, ...rejected].map((r) => (
              <ReviewCard
                key={r.id}
                r={r}
                formatDate={formatDate}
                onApprove={r.moderation_status !== 'approved' ? () => handleApprove(r.id) : undefined}
                onReject={r.moderation_status !== 'rejected' ? () => handleReject(r.id) : undefined}
                onDelete={() => handleDelete(r.id)}
                deletingId={deletingId}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ReviewCard({
  r,
  formatDate,
  onApprove,
  onReject,
  onDelete,
  deletingId,
}: {
  r: ShopReview
  formatDate: (s: string) => string
  onApprove?: () => void
  onReject?: () => void
  onDelete: () => void
  deletingId: string | null
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 p-4 rounded-lg border border-luxe-gray bg-luxe-black/40">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-white">{r.display_name}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${r.source === 'google' ? 'bg-blue-500/20 text-blue-300' : 'bg-luxe-gray text-luxe-silver'}`}>
            {r.source === 'google' ? 'Google' : 'Kunde'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            r.moderation_status === 'approved' ? 'bg-green-500/20 text-green-300' :
            r.moderation_status === 'rejected' ? 'bg-red-500/20 text-red-300' :
            'bg-amber-500/20 text-amber-300'
          }`}>
            {r.moderation_status === 'approved' ? 'Sichtbar' : r.moderation_status === 'rejected' ? 'Abgelehnt' : 'Wartet'}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-amber-400">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`w-4 h-4 ${i <= r.rating ? 'fill-current' : 'opacity-40'}`} />
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
      <div className="flex gap-2 shrink-0">
        {onApprove && (
          <Button variant="ghost" size="sm" className="text-green-500" onClick={onApprove}>
            <Check className="w-4 h-4" aria-hidden />
          </Button>
        )}
        {onReject && (
          <Button variant="ghost" size="sm" className="text-amber-500" onClick={onReject}>
            <X className="w-4 h-4" aria-hidden />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-400"
          onClick={onDelete}
          disabled={deletingId === r.id}
        >
          <Trash2 className="w-4 h-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
