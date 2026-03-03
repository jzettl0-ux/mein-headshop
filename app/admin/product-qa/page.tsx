'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircleQuestion, Loader2, Check, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface QaItem {
  id: string
  product_id: string
  question: string
  answer: string | null
  asked_by_name: string | null
  status: string
  created_at: string
  products?: { id: string; name: string; slug: string }
}

export default function AdminProductQAPage() {
  const [items, setItems] = useState<QaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = () => {
    const url = statusFilter ? `/api/admin/product-qa?status=${encodeURIComponent(statusFilter)}` : '/api/admin/product-qa'
    fetch(url)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    load()
  }, [statusFilter])

  const openAnswer = (item: QaItem) => {
    setEditingId(item.id)
    setAnswerText(item.answer ?? '')
    setAnswerDialogOpen(true)
  }

  const handleSaveAnswer = async () => {
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/product-qa/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: answerText.trim() || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'Antwort gespeichert' })
      setAnswerDialogOpen(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleHide = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/product-qa/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'hidden' }),
      })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast({ title: 'Ausgeblendet' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Frage wirklich löschen?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/product-qa/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast({ title: 'Gelöscht' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const pendingCount = items.filter((i) => i.status === 'pending').length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageCircleQuestion className="w-7 h-7 text-luxe-gold" />
          Produkt-Fragen & Antworten
        </h1>
        <p className="text-luxe-silver text-sm mt-1">
          Kundenfragen beantworten – UGC für PDP und SEO.
        </p>
      </div>

      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md bg-luxe-charcoal border border-luxe-gray px-3 py-2 text-white text-sm"
        >
          <option value="">Alle</option>
          <option value="pending">Offen ({pendingCount})</option>
          <option value="answered">Beantwortet</option>
          <option value="hidden">Ausgeblendet</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : items.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <MessageCircleQuestion className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Fragen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-medium">F: {item.question}</p>
                    {item.answer && <p className="text-luxe-silver mt-2 pl-4 border-l-2 border-luxe-gold/50">A: {item.answer}</p>}
                    <p className="text-luxe-silver/70 text-sm mt-2">
                      {item.asked_by_name || 'Kunde'} · {formatDate(item.created_at)}
                    </p>
                    {item.products && (
                      <Link href={`/shop/${item.products.slug}`} className="text-luxe-gold hover:underline text-sm mt-1 inline-block">
                        {item.products.name}
                      </Link>
                    )}
                    <Badge variant={item.status === 'pending' ? 'secondary' : item.status === 'answered' ? 'default' : 'outline'} className="ml-2">
                      {item.status === 'pending' ? 'Offen' : item.status === 'answered' ? 'Beantwortet' : 'Ausgeblendet'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {item.status !== 'answered' && (
                      <Button variant="admin-outline" size="sm" onClick={() => openAnswer(item)}>
                        <Check className="w-4 h-4 mr-1" /> Antworten
                      </Button>
                    )}
                    {item.status === 'answered' && (
                      <Button variant="admin-outline" size="sm" onClick={() => openAnswer(item)}>
                        Bearbeiten
                      </Button>
                    )}
                    {item.status !== 'hidden' && (
                      <Button variant="admin-outline" size="sm" onClick={() => handleHide(item.id)}>
                        Ausblenden
                      </Button>
                    )}
                    <Button variant="admin-outline" size="sm" className="text-red-400" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Antwort eintragen</DialogTitle>
          </DialogHeader>
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Antwort eingeben..."
            rows={5}
            className="w-full px-4 py-3 rounded-lg bg-luxe-black border border-luxe-gray text-white placeholder:text-luxe-silver/60 resize-y"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAnswerDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
            <Button onClick={handleSaveAnswer} disabled={saving} variant="luxe">{saving ? 'Wird gespeichert…' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
