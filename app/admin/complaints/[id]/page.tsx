'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Send, Calendar, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface ComplaintMessage {
  id: string
  author_type: 'owner_chef' | 'staff'
  author_email: string | null
  message: string
  created_at: string
}

interface Complaint {
  id: string
  author_email: string
  subject: string
  message: string
  created_at: string
  read_at: string | null
  messages?: ComplaintMessage[]
}

export default function AdminComplaintDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) ?? ''
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (id) load()
  }, [id])

  const load = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/complaints/${id}`)
      if (!res.ok) {
        if (res.status === 404) router.push('/admin/complaints')
        return
      }
      const data = await res.json()
      setComplaint(data)
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (sendEmail: boolean) => {
    if (!id || !replyText.trim()) {
      if (sendEmail) toast({ title: 'Bitte zuerst Antworttext eingeben.', variant: 'destructive' })
      return
    }
    setSending(true)
    try {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reply_text: replyText.trim(),
          send_email: sendEmail,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Speichern fehlgeschlagen')
      }
      const updated = await res.json()
      setComplaint(updated)
      setReplyText('')
      toast({
        title: sendEmail ? 'Antwort gesendet' : 'Gespeichert',
        description: sendEmail ? 'E-Mail wurde an den Mitarbeiter gesendet. Er kann darauf antworten – die Antwort erscheint hier.' : 'Antwort gespeichert.',
      })
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: (e as Error)?.message || 'Aktion fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSending(false)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')

  const threadMessages: Array<{ id: string | null; author_type: 'owner_chef' | 'staff'; author_email: string | null; message: string; created_at: string }> = []
  if (complaint?.message) {
    threadMessages.push({
      id: null,
      author_type: 'staff',
      author_email: complaint.author_email,
      message: complaint.message,
      created_at: complaint.created_at,
    })
  }
  complaint?.messages?.forEach((m) => threadMessages.push(m))

  if (loading || !complaint) {
    return (
      <div className="space-y-6">
        <p className="text-luxe-silver">Laden...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/complaints" className="inline-flex items-center text-luxe-silver hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück
        </Link>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Beschwerde</CardTitle>
          {complaint.read_at && (
            <span className="text-luxe-gold flex items-center gap-1 text-sm">
              <CheckCircle className="w-4 h-4" /> Gelesen
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <a
              href={`mailto:${complaint.author_email}`}
              className="flex items-center text-luxe-gold hover:underline"
            >
              <Mail className="w-4 h-4 mr-2" />
              {complaint.author_email}
            </a>
            <span className="flex items-center text-luxe-silver">
              <Calendar className="w-4 h-4 mr-2" />
              {formatDate(complaint.created_at)}
            </span>
          </div>
          <p className="text-white font-medium">{complaint.subject || 'Ohne Betreff'}</p>

          <div className="space-y-4 mt-4">
            {threadMessages.map((msg, idx) => (
              <div
                key={msg.id ?? `orig-${idx}`}
                className={`flex ${msg.author_type === 'owner_chef' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    msg.author_type === 'owner_chef'
                      ? 'bg-luxe-gold/20 text-white border border-luxe-gold/40'
                      : 'bg-luxe-gray text-white border border-luxe-gray'
                  }`}
                >
                  <p className="text-xs text-luxe-silver mb-1">
                    {msg.author_type === 'owner_chef' ? 'Inhaber/Chef' : msg.author_email || 'Mitarbeiter'}
                    {' · '}
                    {formatDate(msg.created_at)}
                  </p>
                  <div className="whitespace-pre-wrap text-sm">{msg.message}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Antwort an Mitarbeiter</CardTitle>
          <p className="text-sm text-luxe-silver">
            Die Antwort wird im Chat gespeichert. Bei „Per E-Mail senden“ erhält der Mitarbeiter eine E-Mail; wenn er darauf antwortet, erscheint seine Nachricht automatisch hier (vorausgesetzt Resend Inbound ist eingerichtet).
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 bg-luxe-gray border border-luxe-gray rounded-md text-white placeholder:text-luxe-silver"
            placeholder="Deine Antwort an den Mitarbeiter..."
            disabled={sending}
          />
          <div className="flex gap-2">
            <Button onClick={() => handleReply(true)} disabled={sending || !replyText.trim()} variant="luxe">
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
