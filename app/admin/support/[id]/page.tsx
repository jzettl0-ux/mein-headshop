'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Send, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface InquiryMessage {
  id: string | null
  author_type: 'customer' | 'staff'
  author_email: string | null
  author_name: string | null
  message: string
  created_at: string
}

interface Inquiry {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  order_id: string | null
  order_number: string | null
  created_at: string
  updated_at: string
  replied_at: string | null
  replied_by: string | null
  reply_text: string | null
  messages?: InquiryMessage[]
}

export default function AdminSupportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) ?? ''
  const [inquiry, setInquiry] = useState<Inquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')
  const [customerReplyText, setCustomerReplyText] = useState('')
  const [addingCustomerReply, setAddingCustomerReply] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (id) load()
  }, [id])

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`)
      if (!res.ok) {
        if (res.status === 404) router.push('/admin/support')
        return
      }
      const data = await res.json()
      setInquiry(data)
      setStatus(data.status)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (sendEmail: boolean) => {
    if (!id || (!replyText.trim() && !sendEmail)) {
      if (sendEmail) toast({ title: 'Bitte zuerst Antworttext eingeben.', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'answered',
          reply_text: replyText.trim(),
          send_email: sendEmail,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Speichern fehlgeschlagen')
      }
      const updated = await res.json()
      setInquiry(updated)
      setReplyText('')
      setStatus(updated.status)
      toast({
        title: sendEmail ? 'Antwort gesendet' : 'Gespeichert',
        description: sendEmail ? 'E-Mail wurde an den Kunden gesendet.' : 'Antwort gespeichert.',
      })
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message || 'Aktion fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Status konnte nicht geändert werden')
      const updated = await res.json()
      setInquiry(updated)
      setStatus(updated.status)
      toast({ title: 'Status aktualisiert' })
    } catch {
      toast({ title: 'Fehler', description: 'Status konnte nicht geändert werden', variant: 'destructive' })
    }
  }

  const handleAddCustomerReply = async () => {
    if (!id || !customerReplyText.trim()) {
      toast({ title: 'Bitte Text der Kunden-Antwort einfügen.', variant: 'destructive' })
      return
    }
    setAddingCustomerReply(true)
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_message: customerReplyText.trim() }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      const updated = await res.json()
      setInquiry(updated)
      setCustomerReplyText('')
      toast({ title: 'Kunden-Antwort hinzugefügt', description: 'Sie erscheint jetzt im Verlauf.' })
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message, variant: 'destructive' })
    } finally {
      setAddingCustomerReply(false)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')

  const threadMessages: InquiryMessage[] = []
  if (inquiry?.message) {
    threadMessages.push({
      id: null,
      author_type: 'customer',
      author_email: inquiry.email,
      author_name: inquiry.name,
      message: inquiry.message,
      created_at: inquiry.created_at,
    })
  }
  if (inquiry?.messages?.length) {
    inquiry.messages.forEach((m) => threadMessages.push(m))
  }

  if (loading || !inquiry) {
    return (
      <div className="space-y-6">
        <p className="text-luxe-silver">Laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/support"
          className="inline-flex items-center text-luxe-silver hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Link>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Anfrage</CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3 py-1.5 bg-luxe-gray border border-luxe-gray rounded text-white text-sm"
            >
              <option value="open">Offen</option>
              <option value="answered">Beantwortet</option>
              <option value="closed">Erledigt</option>
            </select>
            <Badge
              className={
                status === 'open'
                  ? 'bg-amber-500/20 text-amber-400'
                  : status === 'answered'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-luxe-gray text-luxe-silver'
              }
            >
              {status === 'open' ? 'Offen' : status === 'answered' ? 'Beantwortet' : 'Erledigt'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center text-white">
              <User className="w-4 h-4 mr-2 text-luxe-gold" />
              {inquiry.name}
            </span>
            <a
              href={`mailto:${inquiry.email}`}
              className="flex items-center text-luxe-gold hover:underline"
            >
              <Mail className="w-4 h-4 mr-2" />
              {inquiry.email}
            </a>
            <span className="flex items-center text-luxe-silver">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(inquiry.created_at)}
            </span>
            {(inquiry.order_id || inquiry.order_number) && (
              <Link
                href={inquiry.order_id ? `/admin/orders/${inquiry.order_id}` : `/admin/orders?search=${encodeURIComponent(inquiry.order_number || '')}`}
                className="flex items-center text-luxe-gold hover:underline"
              >
                Bestellung #{inquiry.order_number || '?'} ansehen →
              </Link>
            )}
          </div>
          <p className="text-white font-medium">{inquiry.subject || 'Ohne Betreff'}</p>

          <div className="space-y-4 mt-4">
            {threadMessages.map((msg, idx) => (
              <div
                key={msg.id ?? `orig-${idx}`}
                className={`flex ${msg.author_type === 'staff' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    msg.author_type === 'staff'
                      ? 'bg-luxe-gold/20 text-white border border-luxe-gold/40'
                      : 'bg-luxe-gray text-white border border-luxe-gray'
                  }`}
                >
                  <p className="text-xs text-luxe-silver mb-1">
                    {msg.author_type === 'staff' ? 'Team' : msg.author_name || msg.author_email || 'Kunde'}
                    {' · '}
                    {formatDate(msg.created_at)}
                  </p>
                  <div className="whitespace-pre-wrap text-sm">{msg.message}</div>
                </div>
              </div>
            ))}
          </div>

          <details className="border-t border-luxe-gray pt-4 mt-4 text-sm text-luxe-silver">
            <summary className="cursor-pointer hover:text-white">Falls Inbound nicht eingerichtet: Kunden-Antwort manuell einfügen</summary>
            <p className="mt-2 mb-1">Wenn Kunden-Antworten automatisch erscheinen sollen, siehe Anleitung: RESEND_INBOUND_DOMAIN + Webhook.</p>
            <textarea
              value={customerReplyText}
              onChange={(e) => setCustomerReplyText(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-luxe-gray border border-luxe-gray rounded-md text-white placeholder:text-luxe-silver text-sm mt-2"
              placeholder="Antwort des Kunden einfügen …"
              disabled={addingCustomerReply}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 border-luxe-gray text-white"
              onClick={handleAddCustomerReply}
              disabled={addingCustomerReply || !customerReplyText.trim()}
            >
              {addingCustomerReply ? '…' : 'Hinzufügen'}
            </Button>
          </details>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Antwort an Kunden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 bg-luxe-gray border border-luxe-gray rounded-md text-white placeholder:text-luxe-silver"
            placeholder="Deine Antwort an den Kunden..."
            disabled={sending}
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleReply(true)}
              disabled={sending || !replyText.trim()}
              variant="luxe"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? '…' : 'Antwort per E-Mail senden'}
            </Button>
            <Button
              onClick={() => handleReply(false)}
              disabled={sending || !replyText.trim()}
              variant="outline"
              className="border-luxe-gray text-white"
            >
              Nur speichern (keine E-Mail)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
