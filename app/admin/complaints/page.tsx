'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquareWarning, Send, Mail, Calendar, CheckCircle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

interface ComplaintRow {
  id: string
  staff_id: string | null
  author_email: string
  subject: string
  message: string
  created_at: string
  read_at: string | null
}

export default function AdminComplaintsPage() {
  const [isStaffManager, setIsStaffManager] = useState(false)
  const [list, setList] = useState<ComplaintRow[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/admin/me')
      if (!res.ok) return
      const data = await res.json()
      setIsStaffManager(!!data.isStaffManager)
    }
    load()
  }, [])

  useEffect(() => {
    if (!isStaffManager) return
    setLoadingList(true)
    fetch('/api/admin/complaints')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoadingList(false))
  }, [isStaffManager])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const sub = subject.trim()
    const msg = message.trim()
    if (!sub || !msg) {
      toast({ title: 'Betreff und Nachricht ausfüllen', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: sub, message: msg }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Beschwerde konnte nicht gesendet werden.', variant: 'destructive' })
        return
      }
      toast({ title: 'Beschwerde eingereicht', description: 'Nur Inhaber/Chef können sie einsehen.' })
      setSubject('')
      setMessage('')
    } catch {
      toast({ title: 'Fehler', description: 'Beschwerde konnte nicht gesendet werden.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleMarkRead = async (id: string, read: boolean) => {
    setMarkingId(id)
    try {
      const res = await fetch(`/api/admin/complaints/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read_at: read ? new Date().toISOString() : null }),
      })
      if (!res.ok) throw new Error('Fehler')
      setList((prev) => prev.map((c) => (c.id === id ? { ...c, read_at: read ? new Date().toISOString() : null } : c)))
      toast({ title: read ? 'Als gelesen markiert' : 'Als ungelesen markiert' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setMarkingId(null)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center">
          <MessageSquareWarning className="w-7 h-7 mr-2 text-luxe-gold" />
          Beschwerden
        </h1>
        <p className="text-luxe-silver text-sm mt-1">
          Hier kannst du eine Beschwerde einreichen. Sie ist nur für Inhaber und Chef sichtbar.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Send className="w-5 h-5 mr-2 text-luxe-gold" />
            Beschwerde einreichen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
              <Label htmlFor="complaint-subject" className="text-white">Betreff</Label>
              <Input
                id="complaint-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Kurzer Betreff"
                className="bg-luxe-gray border-luxe-gray text-white mt-1"
                disabled={submitting}
              />
            </div>
            <div>
              <Label htmlFor="complaint-message" className="text-white">Nachricht</Label>
              <textarea
                id="complaint-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Deine Beschwerde (nur für Inhaber/Chef sichtbar)"
                rows={4}
                className="w-full rounded-md border border-luxe-gray bg-luxe-gray text-white px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                disabled={submitting}
              />
            </div>
            <Button type="submit" variant="luxe" disabled={submitting}>
              {submitting ? '…' : 'Beschwerde absenden'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isStaffManager && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Eingegangene Beschwerden (nur Inhaber/Chef)</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingList ? (
              <p className="text-luxe-silver">Laden...</p>
            ) : list.length === 0 ? (
              <p className="text-luxe-silver">Noch keine Beschwerden.</p>
            ) : (
              <div className="space-y-4">
                {list.map((c) => (
                  <div
                    key={c.id}
                    className={`p-4 rounded-lg border ${c.read_at ? 'bg-luxe-gray/30 border-luxe-gray' : 'bg-luxe-gray/50 border-luxe-gold/30'}`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm text-luxe-silver mb-2">
                      <Mail className="w-4 h-4" />
                      <span>{c.author_email}</span>
                      <Calendar className="w-4 h-4 ml-2" />
                      <span>{formatDate(c.created_at)}</span>
                      {c.read_at && (
                        <span className="text-luxe-gold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Gelesen
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-white">{c.subject}</p>
                    <p className="text-luxe-silver whitespace-pre-wrap mt-1">{c.message}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Link href={`/admin/complaints/${c.id}`}>
                        <Button variant="luxe" size="sm" className="text-sm">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Antworten
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-luxe-silver hover:text-luxe-gold"
                        onClick={() => handleMarkRead(c.id, !c.read_at)}
                        disabled={markingId === c.id}
                      >
                        {c.read_at ? 'Als ungelesen markieren' : 'Als gelesen markieren'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
