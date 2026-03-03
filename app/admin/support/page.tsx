'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { HeadphonesIcon, Mail, Calendar, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminBereichErklaerung } from '@/components/admin/admin-bereich-erklaerung'

interface Inquiry {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: string
  order_number: string | null
  created_at: string
}

export default function AdminSupportPage() {
  const searchParams = useSearchParams()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const status = searchParams.get('status')
    if (status && ['open', 'answered', 'closed'].includes(status)) {
      setStatusFilter(status)
    }
  }, [searchParams])

  const load = async () => {
    setLoading(true)
    try {
      const url = statusFilter ? `/api/admin/inquiries?status=${statusFilter}` : '/api/admin/inquiries'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Laden fehlgeschlagen')
      const data = await res.json()
      setInquiries(data)
    } catch {
      setInquiries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')
  const openCount = inquiries.filter((i) => i.status === 'open').length

  return (
    <div className="space-y-6">
      <AdminBereichErklaerung
        title="Kundenanfragen"
        was="Hier siehst du alle Nachrichten vom Kontaktformular und Support-Anfragen. Du kannst sie beantworten und den Status setzen (offen, beantwortet, erledigt)."
        wozu="Keine E-Mails verlieren – alles an einem Ort. Wichtig für Team und bei Beschwerden."
        wie="Filter nach Status. Klick auf eine Anfrage öffnet die Detailansicht mit Verlauf. Antworten werden per E-Mail an den Kunden gesendet."
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center">
          <HeadphonesIcon className="w-7 h-7 mr-2 text-luxe-gold" />
          Kundenservice
        </h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-luxe-charcoal border border-luxe-gray rounded-md text-white"
        >
          <option value="">Alle Status</option>
          <option value="open">Offen</option>
          <option value="answered">Beantwortet</option>
          <option value="closed">Erledigt</option>
        </select>
      </div>

      <p className="text-luxe-silver text-sm">
        Kundenanfragen aus dem Kontaktformular. Öffne eine Anfrage, um zu antworten und den Status zu setzen.
      </p>

      {loading ? (
        <p className="text-luxe-silver">Laden...</p>
      ) : inquiries.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Anfragen vorhanden.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((i) => (
            <Link key={i.id} href={`/admin/support/${i.id}`}>
              <Card className="bg-luxe-charcoal border-luxe-gray hover:border-luxe-gold/50 transition-colors">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-white truncate">{i.name}</span>
                      <span className="text-luxe-silver text-sm truncate">{i.email}</span>
                      <Badge
                        variant={i.status === 'open' ? 'default' : i.status === 'answered' ? 'secondary' : 'outline'}
                        className={
                          i.status === 'open'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                            : i.status === 'answered'
                            ? 'bg-green-500/20 text-green-400 border-green-500/50'
                            : ''
                        }
                      >
                        {i.status === 'open' ? 'Offen' : i.status === 'answered' ? 'Beantwortet' : 'Erledigt'}
                      </Badge>
                    </div>
                    <p className="text-white font-medium truncate">{i.subject || 'Ohne Betreff'}</p>
                    <p className="text-luxe-silver text-sm line-clamp-1">{i.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-luxe-silver text-xs">
                      <Calendar className="w-3 h-3" />
                      {formatDate(i.created_at)}
                      {i.order_number && (
                        <span className="text-luxe-gold">Bestellung #{i.order_number}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-luxe-silver shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!loading && inquiries.length > 0 && (
        <p className="text-luxe-silver text-sm">
          {openCount} offen · {inquiries.length} gesamt
        </p>
      )}
    </div>
  )
}
