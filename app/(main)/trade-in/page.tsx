'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RefreshCw, Loader2, ArrowLeft, Check } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getCurrentUser } from '@/lib/supabase/auth'
import { TRADE_IN_CONDITION_QUESTIONS } from '@/lib/trade-in-quote'
import { supabase } from '@/lib/supabase'

export default function TradeInPage() {
  const router = useRouter()
  const [products, setProducts] = useState<{ id: string; name: string; slug: string; price: number }[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [quote, setQuote] = useState<{ quoted_value: number } | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, slug, price')
      .eq('is_active', true)
      .gt('price', 0)
      .order('name')
      .limit(100)
      .then(({ data }) => setProducts((data as any[]) ?? []))
  }, [])

  useEffect(() => {
    if (!selectedProduct || !answers.condition || !answers.functionality || !answers.accessories) {
      setQuote(null)
      return
    }
    setLoadingQuote(true)
    fetch('/api/trade-in/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: selectedProduct, condition_answers: answers }),
    })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d ? setQuote({ quoted_value: d.quoted_value }) : setQuote(null))
      .catch(() => setQuote(null))
      .finally(() => setLoadingQuote(false))
  }, [selectedProduct, answers.condition, answers.functionality, answers.accessories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !quote) return
    const user = await getCurrentUser()
    if (!user) {
      router.push(`/auth?redirect=/trade-in`)
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/trade-in/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: selectedProduct, condition_answers: answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setSuccess(data.trade_in_id)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="container-luxe py-16 text-center">
        <div className="max-w-lg mx-auto">
          <Check className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Trade-In eingereicht</h1>
          <p className="text-luxe-silver mb-6">
            Deine Anfrage wurde registriert. Wir melden uns nach Wareneingang und Prüfung.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-lg bg-luxe-gold px-6 py-3 text-luxe-black font-semibold hover:bg-luxe-gold/90"
          >
            Zum Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-luxe py-12">
      <Link href="/shop" className="inline-flex items-center gap-2 text-luxe-silver hover:text-white mb-8">
        <ArrowLeft className="h-4 w-4" /> Zurück zum Shop
      </Link>

      <h1 className="text-3xl font-bold text-white flex items-center gap-2 mb-2">
        <RefreshCw className="h-8 w-8 text-luxe-primary" />
        Trade-In
      </h1>
      <p className="text-luxe-silver mb-10">
        Verkaufe dein gebrauchtes Gerät gegen Store Credit. Gib den Zustand an und erhalte sofort ein Angebot.
      </p>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Produkt auswählen</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            required
            className="w-full rounded-lg border border-luxe-gray bg-luxe-black px-4 py-3 text-white"
          >
            <option value="">— Produkt wählen —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} – {formatPrice(p.price)}
              </option>
            ))}
          </select>
        </div>

        {TRADE_IN_CONDITION_QUESTIONS.map((q) => (
          <div key={q.key}>
            <label className="block text-sm font-medium text-white mb-2">{q.label}</label>
            <select
              value={answers[q.key] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
              required
              className="w-full rounded-lg border border-luxe-gray bg-luxe-black px-4 py-3 text-white"
            >
              <option value="">— Auswählen —</option>
              {q.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}

        {quote && (
          <div className="rounded-lg border border-luxe-gold/50 bg-luxe-gold/10 p-4">
            <p className="text-luxe-silver text-sm">Angebotswert</p>
            <p className="text-2xl font-bold text-luxe-gold">{formatPrice(quote.quoted_value)}</p>
            <p className="text-xs text-luxe-silver mt-1">Als Store Credit nach Prüfung</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!quote || submitting || loadingQuote}
          className="w-full rounded-lg bg-luxe-gold px-6 py-3 text-luxe-black font-semibold hover:bg-luxe-gold/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting || loadingQuote ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          {submitting ? 'Wird eingereicht…' : loadingQuote ? 'Berechne…' : 'Trade-In einreichen'}
        </button>
      </form>
    </div>
  )
}
