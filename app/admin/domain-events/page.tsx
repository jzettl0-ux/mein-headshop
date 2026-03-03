'use client'

import { useState, useEffect } from 'react'
import { Activity, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type DomainEvent = {
  id: string
  event_type: string
  aggregate_type: string
  aggregate_id: string | null
  payload: Record<string, unknown>
  created_at: string
}

export default function AdminDomainEventsPage() {
  const [events, setEvents] = useState<DomainEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')

  const load = async () => {
    setLoading(true)
    try {
      const url = filter
        ? `/api/admin/domain-events?limit=100&event_type=${filter}`
        : '/api/admin/domain-events?limit=100'
      const res = await fetch(url)
      const data = res.ok ? await res.json() : []
      setEvents(Array.isArray(data) ? data : [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filter])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-luxe-gold" />
            Domain Events
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Phase 12.1: order_created, payment_received. Realtime-fähig (12.2).
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md bg-luxe-charcoal border border-luxe-gray px-3 py-2 text-sm text-white"
          >
            <option value="">Alle</option>
            <option value="order_created">order_created</option>
            <option value="payment_received">payment_received</option>
          </select>
          <Button variant="luxe" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Letzte Events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-luxe-silver text-sm">Keine Events.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-wrap items-start gap-3 py-2 px-3 rounded-lg bg-luxe-black/50 border border-luxe-gray/50"
                >
                  <Badge variant={e.event_type === 'payment_received' ? 'default' : 'secondary'}>
                    {e.event_type}
                  </Badge>
                  <span className="text-luxe-silver text-sm">
                    {new Date(e.created_at).toLocaleString('de-DE')}
                  </span>
                  <span className="text-white font-mono text-sm">
                    #{String(e.payload?.order_number ?? e.aggregate_id ?? '–')}
                  </span>
                  <pre className="text-xs text-luxe-silver overflow-x-auto flex-1">
                    {JSON.stringify(e.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
