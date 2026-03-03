'use client'

import { useState, useEffect } from 'react'
import { ExternalLink, Loader2, CheckCircle, XCircle, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

type Widget = {
  widget_id: string
  vendor_id: string
  domain_whitelist: string
  public_api_key: string
  status: string
  created_at: string
}

export default function AdminWidgetDeploymentsPage() {
  const [deployments, setDeployments] = useState<Widget[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const { toast } = useToast()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const copySnippet = (apiKey: string) => {
    const snippet = `<script src="${origin}/api/widget/embed?apiKey=${encodeURIComponent(apiKey)}" async><\/script>`
    navigator.clipboard.writeText(snippet).then(() => {
      setCopiedKey(apiKey)
      toast({ title: 'Snippet kopiert', description: 'In externen Shop einbinden (Domain muss in Whitelist stehen).' })
      setTimeout(() => setCopiedKey(null), 2000)
    })
  }

  useEffect(() => {
    fetch('/api/admin/widget-deployments')
      .then((r) => (r.ok ? r.json() : { deployments: [] }))
      .then((d) => setDeployments(d.deployments ?? []))
      .catch(() => setDeployments([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <ExternalLink className="w-6 h-6 text-luxe-gold" />
          Buy With (Off-Platform Checkout)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Widget-Snippet für Shopify/Händler – Checkout-Overlay, AVS-Abnahme, Versand aus FBA.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : deployments.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Widget-Deployments. Tabellen <code className="text-xs bg-luxe-black px-1 rounded">external_commerce.widget_deployments</code> und <code className="text-xs bg-luxe-black px-1 rounded">off_platform_orders</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Registrierte Widgets</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{deployments.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {deployments.map((w) => (
                <li key={w.widget_id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-luxe-gray/50 last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white flex items-center gap-2">
                      {w.status === 'ACTIVE' ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> : <XCircle className="h-4 w-4 text-luxe-silver shrink-0" />}
                      {w.domain_whitelist}
                    </p>
                    <p className="text-luxe-silver text-xs mt-0.5">
                      API-Key: <code className="bg-luxe-black px-1 rounded">{w.public_api_key}</code>
                    </p>
                    {w.status === 'ACTIVE' && (
                      <p className="text-luxe-silver text-xs mt-1">
                        Snippet: <code className="bg-luxe-black px-1 rounded text-[10px]">{origin}/api/widget/embed?apiKey=…</code>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {w.status === 'ACTIVE' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-luxe-gray text-luxe-silver hover:bg-luxe-gray/30"
                        onClick={() => copySnippet(w.public_api_key)}
                      >
                        {copiedKey === w.public_api_key ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        Snippet kopieren
                      </Button>
                    )}
                    <span className="text-luxe-silver text-xs">{new Date(w.created_at).toLocaleDateString('de-DE')}</span>
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
