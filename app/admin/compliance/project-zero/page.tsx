'use client'

import { useState, useEffect } from 'react'
import { ShieldOff, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Takedown = {
  takedown_id: string
  brand_registry_id: string
  target_offer_id: string
  reason_code: string
  action_taken_at: string
  is_appealed: boolean
  appeal_successful: boolean | null
  admin_reviewed_at: string | null
}

const reasonLabel: Record<string, string> = {
  COUNTERFEIT: 'Fälschung',
  TRADEMARK_INFRINGEMENT: 'Markenverletzung',
  COPYRIGHT_VIOLATION: 'Urheberrechtsverletzung',
}

export default function AdminProjectZeroPage() {
  const [takedowns, setTakedowns] = useState<Takedown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/project-zero-takedowns')
      .then((r) => (r.ok ? r.json() : { takedowns: [] }))
      .then((d) => setTakedowns(d.takedowns ?? []))
      .catch(() => setTakedowns([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <ShieldOff className="w-6 h-6 text-luxe-gold" />
          Project Zero (Takedowns)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Self-Service-Takedowns für Markeninhaber – Fälschungen, Marken- und Urheberrechtsverletzungen. Erfordert <code className="text-xs bg-luxe-black px-1 rounded">security.transparency_brands</code> und <code className="text-xs bg-luxe-black px-1 rounded">vendor_offers</code>.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : takedowns.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Takedowns. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">brand_tools.project_zero_takedowns</code> wird angelegt, wenn die Migration <code className="text-xs bg-luxe-black px-1 rounded">migration-blueprint-teil-11-power-user.sql</code> ausgeführt wurde und <code className="text-xs bg-luxe-black px-1 rounded">security.transparency_brands</code> sowie <code className="text-xs bg-luxe-black px-1 rounded">vendor_offers</code> existieren.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Takedowns ({takedowns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {takedowns.map((t) => (
                <li
                  key={t.takedown_id}
                  className="flex flex-wrap items-center gap-3 py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <Badge variant="secondary" className="bg-luxe-gray text-luxe-silver text-xs">
                    {reasonLabel[t.reason_code] ?? t.reason_code}
                  </Badge>
                  <span className="text-luxe-silver text-xs font-mono">Brand: {String(t.brand_registry_id).slice(0, 8)}…</span>
                  <span className="text-luxe-silver text-xs font-mono">Offer: {String(t.target_offer_id).slice(0, 8)}…</span>
                  {t.is_appealed && (
                    <Badge variant="secondary" className={t.appeal_successful === true ? 'bg-green-900/50 text-green-200' : t.appeal_successful === false ? 'bg-red-900/50 text-red-200' : 'bg-amber-900/50 text-amber-200'}>
                      {t.appeal_successful === true ? 'Appeal gewonnen' : t.appeal_successful === false ? 'Appeal abgelehnt' : 'Appeal offen'}
                    </Badge>
                  )}
                  <span className="text-luxe-silver/70 text-xs ml-auto">
                    {new Date(t.action_taken_at).toLocaleString('de-DE')}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
