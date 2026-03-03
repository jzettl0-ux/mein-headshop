'use client'

import { useState, useEffect } from 'react'
import { Puzzle, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Component = {
  component_id: string
  service_endpoint_url: string
  fallback_behavior: string
  timeout_ms: number
  is_active: boolean
}

export default function AdminComponentRegistryPage() {
  const [components, setComponents] = useState<Component[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/component-registry')
      .then((r) => (r.ok ? r.json() : { components: [] }))
      .then((d) => setComponents(d.components ?? []))
      .catch(() => setComponents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Puzzle className="w-6 h-6 text-luxe-gold" />
          Micro-Frontend Component Registry
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Isolierte UI-Module mit Service-Endpoint – Fallback bei Timeout oder Fehler.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : components.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Einträge. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">frontend_ux.component_registry</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Registrierte Komponenten</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{components.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {components.map((c) => (
                <li
                  key={c.component_id}
                  className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-white flex items-center gap-2">
                      {c.is_active ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-luxe-silver" />}
                      {c.component_id}
                    </p>
                    <p className="text-luxe-silver text-xs mt-0.5 truncate max-w-xl">{c.service_endpoint_url}</p>
                    <p className="text-luxe-silver/80 text-xs mt-0.5">
                      Timeout: {c.timeout_ms} ms · Fallback: {c.fallback_behavior}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
