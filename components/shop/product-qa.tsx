'use client'

import { useState, useEffect } from 'react'
import { MessageCircleQuestion, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'

interface QaItem {
  id: string
  question: string
  answer: string | null
  asked_by_name: string | null
  status: string
  answered_at: string | null
  answered_by: string | null
  created_at: string
}

interface ProductQAProps {
  productId: string
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function ProductQA({ productId }: ProductQAProps) {
  const [items, setItems] = useState<QaItem[]>([])
  const [question, setQuestion] = useState('')
  const [askedByName, setAskedByName] = useState('')
  const [askedByEmail, setAskedByEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch(`/api/product-qa?product_id=${encodeURIComponent(productId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
  }, [productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (!q || q.length < 10) {
      toast({ title: 'Bitte mindestens 10 Zeichen eingeben.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/product-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          question: q,
          asked_by_name: askedByName.trim() || null,
          asked_by_email: askedByEmail.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'Frage gesendet', description: 'Wir antworten dir bald.' })
      setQuestion('')
      setAskedByName('')
      setAskedByEmail('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mt-12 pt-12 border-t border-luxe-gray" aria-label="Fragen & Antworten">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <MessageCircleQuestion className="w-6 h-6 text-luxe-gold" />
        Fragen & Antworten
      </h2>

      {items.length > 0 && (
        <div className="space-y-4 mb-8">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl p-4 bg-luxe-charcoal/50 border border-luxe-gray/50">
              <p className="text-white font-medium mb-1">F: {item.question}</p>
              {item.answer && (
                <p className="text-luxe-silver pl-4 border-l-2 border-luxe-gold/50">
                  A: {item.answer}
                </p>
              )}
              <p className="text-luxe-silver/70 text-xs mt-2">
                {item.asked_by_name || 'Kunde'} · {formatDate(item.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-luxe-silver">
          Hast du eine Frage zu diesem Produkt?
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="z. B. Welche Größen sind verfügbar?"
          rows={3}
          className="w-full px-4 py-3 rounded-lg bg-luxe-black border border-luxe-gray text-white placeholder:text-luxe-silver/60 resize-y"
          required
        />
        <div className="flex flex-wrap gap-3">
          <Input
            value={askedByName}
            onChange={(e) => setAskedByName(e.target.value)}
            placeholder="Dein Name (optional)"
            className="max-w-xs bg-luxe-black border-luxe-gray text-white"
          />
          <Input
            type="email"
            value={askedByEmail}
            onChange={(e) => setAskedByEmail(e.target.value)}
            placeholder="E-Mail * (für Benachrichtigung)"
            required
            className="max-w-xs bg-luxe-black border-luxe-gray text-white"
          />
        </div>
        <Button type="submit" variant="luxe" disabled={submitting}>
          {submitting ? 'Wird gesendet…' : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Frage absenden
            </>
          )}
        </Button>
      </form>
    </section>
  )
}
