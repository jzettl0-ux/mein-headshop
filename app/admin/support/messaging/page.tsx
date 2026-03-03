'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Message = {
  message_id: string
  order_id: string
  order_number: string
  message_body: string
  body_preview: string
  is_flagged_by_regex: boolean
  flag_reason: string | null
  delivery_status: string
  created_at: string
}

const statusLabel: Record<string, string> = {
  DELIVERED: 'Zugestellt',
  BLOCKED: 'Geblockt',
  PENDING_REVIEW: 'Prüfung',
}

const flagLabel: Record<string, string> = {
  CONTAINS_URL: 'URL',
  CONTAINS_EMAIL: 'E-Mail',
  CONTAINS_PHONE: 'Telefon',
  OFF_PLATFORM_POACHING: 'Abwerbung',
}

export default function AdminMessagingPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/messaging')
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((d) => setMessages(d.messages ?? []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-luxe-gold" />
          Nachrichten (Anti-Poaching)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Buyer-Seller-Messages – Regex-Flag (URL/E-Mail/Telefon/Abwerbung), Status Prüfung/Zugestellt/Geblockt.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : messages.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Nachrichten. Tabellen <code className="text-xs bg-luxe-black px-1 rounded">communications.messages</code> und <code className="text-xs bg-luxe-black px-1 rounded">masked_emails</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Nachrichten ({messages.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {messages.map((m) => (
                <li
                  key={m.message_id}
                  className="flex flex-wrap items-start gap-3 py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <span className="text-white font-mono text-sm">{m.order_number}</span>
                  <Badge variant="secondary" className="bg-luxe-gray text-luxe-silver text-xs">
                    {statusLabel[m.delivery_status] ?? m.delivery_status}
                  </Badge>
                  {m.is_flagged_by_regex && (
                    <Badge variant="secondary" className="bg-amber-900/50 text-amber-200 text-xs">
                      {flagLabel[m.flag_reason ?? ''] ?? m.flag_reason ?? 'Geflaggt'}
                    </Badge>
                  )}
                  <span className="text-luxe-silver text-sm line-clamp-2 flex-1 min-w-0" title={m.message_body}>
                    {m.body_preview}
                  </span>
                  <span className="text-luxe-silver/70 text-xs whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString('de-DE')}
                  </span>
                  <Link
                    href={`/admin/orders/${m.order_id}`}
                    className="inline-flex items-center gap-1 text-sm text-luxe-gold hover:underline shrink-0"
                  >
                    Bestellung
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
