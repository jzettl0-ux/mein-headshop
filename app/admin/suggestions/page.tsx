'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lightbulb, Loader2, Check, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

const TYPE_LABELS: Record<string, string> = {
  category: 'Neue Kategorie',
  feature: 'Neue Funktion',
  improvement: 'Verbesserung',
  design: 'Design',
  other: 'Sonstiges',
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Neu',
  reviewing: 'In Prüfung',
  in_progress: 'In Arbeit',
  implemented: 'Umgesetzt',
  rejected: 'Abgelehnt',
}

interface Suggestion {
  id: string
  suggestion_type: string
  title: string
  description: string | null
  submitted_by_name: string
  submitted_by_email: string | null
  status: string
  admin_notes: string | null
  linked_id: string | null
  linked_type: string | null
  implemented_at: string | null
  created_at: string
}

export default function AdminSuggestionsPage() {
  const [items, setItems] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (filterType !== 'all') params.set('type', filterType)
      const res = await fetch(`/api/admin/suggestions?${params}`)
      const data = res.ok ? await res.json() : []
      setItems(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: 'Fehler beim Laden', variant: 'destructive' })
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filterStatus, filterType])

  const updateStatus = async (id: string, status: string) => {
    setSavingId(id)
    try {
      const res = await fetch('/api/admin/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Aktualisierung fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({ title: 'Status aktualisiert', description: STATUS_LABELS[status] || status })
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSavingId(null)
    }
  }

  const saveAdminNotes = async (id: string) => {
    const notes = adminNotes[id] ?? ''
    setSavingId(id)
    try {
      const res = await fetch('/api/admin/suggestions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, admin_notes: notes }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Notiz gespeichert' })
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSavingId(null)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Verbesserungsvorschläge</h1>
        <p className="text-luxe-silver text-sm mt-1">
          Kunden und Verkäufer können Ideen einreichen (z.B. neue Kategorie). Hier prüfst und setzt du sie um.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-base">Filter</CardTitle>
          <div className="flex flex-wrap gap-3 mt-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-md bg-luxe-gray border border-luxe-silver text-white text-sm"
            >
              <option value="all">Alle Status</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-md bg-luxe-gray border border-luxe-silver text-white text-sm"
            >
              <option value="all">Alle Arten</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : items.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <Lightbulb className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine Vorschläge.</p>
            <p className="text-luxe-silver/80 text-sm mt-1">Vorschläge kommen von der Seite <Link href="/vorschlaege" className="text-luxe-gold hover:underline">/vorschlaege</Link>.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-luxe-gray text-luxe-silver">
                        {TYPE_LABELS[item.suggestion_type] ?? item.suggestion_type}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        item.status === 'implemented' ? 'bg-luxe-neon/20 text-luxe-neon' :
                        item.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        item.status === 'in_progress' ? 'bg-luxe-gold/20 text-luxe-gold' :
                        'bg-luxe-gray text-luxe-silver'
                      }`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    {item.description && (
                      <p className="text-luxe-silver text-sm mb-2 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-luxe-silver/80 text-xs">
                      {item.submitted_by_name}
                      {item.submitted_by_email && ` · ${item.submitted_by_email}`}
                      {' · '}{formatDate(item.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    {item.status !== 'implemented' && item.status !== 'rejected' && (
                      <>
                        <Button size="sm" variant="outline" className="border-luxe-gold text-luxe-gold" onClick={() => updateStatus(item.id, 'in_progress')} disabled={savingId === item.id}>
                          In Arbeit
                        </Button>
                        <Button size="sm" variant="luxe" onClick={() => updateStatus(item.id, 'implemented')} disabled={savingId === item.id}>
                          <Check className="w-4 h-4 mr-1" />
                          Umgesetzt
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500/50 text-red-400" onClick={() => updateStatus(item.id, 'rejected')} disabled={savingId === item.id}>
                          Ablehnen
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" className="text-luxe-silver" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                      {expandedId === item.id ? 'Zuklappen' : 'Details'}
                    </Button>
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="mt-5 pt-5 border-t border-luxe-gray space-y-4">
                    {item.description && (
                      <div>
                        <p className="text-xs font-medium text-luxe-silver uppercase mb-1">Beschreibung</p>
                        <p className="text-luxe-silver text-sm whitespace-pre-wrap">{item.description}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-luxe-silver uppercase mb-1">Admin-Notizen (intern)</p>
                      <textarea
                        value={adminNotes[item.id] ?? item.admin_notes ?? ''}
                        onChange={(e) => setAdminNotes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 bg-luxe-black border border-luxe-gray rounded-md text-white text-sm"
                        placeholder="Interne Notizen, z.B. Verknüpfung zur neu angelegten Kategorie"
                      />
                      <Button size="sm" variant="outline" className="mt-2" onClick={() => saveAdminNotes(item.id)} disabled={savingId === item.id}>
                        Notiz speichern
                      </Button>
                    </div>
                    {item.suggestion_type === 'category' && item.status !== 'implemented' && (
                      <Link href="/admin/categories">
                        <Button size="sm" variant="outline" className="border-luxe-gold text-luxe-gold">
                          <Tag className="w-4 h-4 mr-2" />
                          Kategorie anlegen
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
