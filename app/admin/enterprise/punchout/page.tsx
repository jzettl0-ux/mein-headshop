'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Session = {
  session_id: string
  b2b_account_id: string
  b2b_account_name: string
  procurement_system: string
  status: string
  return_url: string
  created_at: string
}

export default function AdminPunchoutPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/punchout-sessions')
      .then((r) => (r.ok ? r.json() : { sessions: [] }))
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <ExternalLink className="w-6 h-6 text-luxe-gold" />
          B2B PunchOut (SAP Ariba, Coupa)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          cXML/OData – Einkäufer werden aus ERP &quot;gepuncht&quot;, Warenkorb fließt zurück.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine PunchOut-Sessions. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">enterprise_b2b.punchout_sessions</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Sessions</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{sessions.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {sessions.map((s) => (
                <li key={s.session_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <span className="font-medium text-white">{s.b2b_account_name} · {s.procurement_system}</span>
                  <span className="text-luxe-silver">{s.status} · {new Date(s.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
