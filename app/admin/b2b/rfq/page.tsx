'use client'

import { useState, useEffect } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Quote = {
  quote_id: string
  b2b_customer_id: string
  product_id: string
  requested_quantity: number
  requested_target_price_total: number
  status: string
  expires_at: string
  created_at: string
  product_name: string
  product_slug: string | null
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  COUNTER_OFFERED: 'Gegenangebot',
  ACCEPTED: 'Angenommen',
  REJECTED: 'Abgelehnt',
  EXPIRED: 'Abgelaufen',
  PURCHASED: 'Gekauft',
}

export default function AdminB2bRfqPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/rfq')
      .then((r) => (r.ok ? r.json() : { quotes: [] }))
      .then((d) => setQuotes(d.quotes ?? []))
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-luxe-gold" />
          Dynamic RFQ (Angebot anfordern)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          B2B-Angebotsanfragen mit Verhandlungs-Ping-Pong – Temporary Checkout Token 48 h gültig.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : quotes.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Angebotsanfragen. Tabellen <code className="text-xs bg-luxe-black px-1 rounded">b2b_negotiation.quote_requests</code> und <code className="text-xs bg-luxe-black px-1 rounded">quote_responses</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Angebotsanfragen</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{quotes.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {quotes.map((q) => (
                <li
                  key={q.quote_id}
                  className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <div>
                    <Link
                      href={q.product_slug ? `/admin/products/${q.product_id}/edit` : '#'}
                      className="text-luxe-gold hover:underline font-medium"
                    >
                      {q.product_name || q.product_id}
                    </Link>
                    <p className="text-luxe-silver text-xs mt-0.5">
                      Menge: {q.requested_quantity} · Zielpreis: {q.requested_target_price_total?.toLocaleString('de-DE')} € ·
                      Läuft ab: {new Date(q.expires_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <span className="text-luxe-silver">{STATUS_LABELS[q.status] ?? q.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
