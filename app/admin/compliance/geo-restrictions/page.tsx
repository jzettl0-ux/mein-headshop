'use client'

import { useState, useEffect } from 'react'
import { Globe, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Restriction = {
  restriction_id: string
  entity_type: string
  entity_id: string
  blocked_country_code: string
  blocked_zip_codes: unknown
  reason_code: string | null
  created_at: string
}

export default function AdminGeoRestrictionsPage() {
  const [restrictions, setRestrictions] = useState<Restriction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/geo-restrictions')
      .then((r) => (r.ok ? r.json() : { restrictions: [] }))
      .then((d) => setRestrictions(d.restrictions ?? []))
      .catch(() => setRestrictions([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-luxe-gold" />
          Geo-Compliance-Blocker
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Cross-Border Export Controls, Blacklist – Länder/PLZ-Sperren pro Produkt oder Kategorie.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : restrictions.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Sperren. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">legal_compliance.geo_restrictions</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Geo-Restrictions</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{restrictions.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {restrictions.map((r) => (
                <li key={r.restriction_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <div>
                    <p className="font-medium text-white">
                      {r.entity_type} #{r.entity_id.slice(0, 8)} → {r.blocked_country_code}
                    </p>
                    {r.reason_code && <p className="text-luxe-silver text-xs mt-0.5">{r.reason_code}</p>}
                  </div>
                  <span className="text-luxe-silver text-xs">{new Date(r.created_at).toLocaleDateString('de-DE')}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
