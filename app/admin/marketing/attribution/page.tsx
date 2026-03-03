'use client'

import { useState, useEffect } from 'react'
import { Link2, Loader2, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

type Campaign = {
  campaign_id: string
  vendor_id: string
  campaign_name: string
  tracking_code: string
  commission_discount_percentage: number
  created_at: string
}

export default function AdminAttributionPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/attribution-campaigns')
      .then((r) => (r.ok ? r.json() : { campaigns: [] }))
      .then((d) => setCampaigns(d.campaigns ?? []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false))
  }, [])

  const copyTrackingLink = (code: string) => {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${base}/?ref=${code}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(code)
      toast({ title: 'Link kopiert', description: url })
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Link2 className="w-6 h-6 text-luxe-gold" />
          Brand Referral Bonus & Attribution
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Tracking-Links mit <code className="text-xs bg-luxe-black px-1 rounded">?ref=vendorID_campaign123</code> – 14-Tage-Attributions-Cookie, reduzierter Provisions-Rabatt.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Attribution-Kampagnen. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">marketing.attribution_campaigns</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Kampagnen</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{campaigns.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {campaigns.map((c) => (
                <li
                  key={c.campaign_id}
                  className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-white">{c.campaign_name}</p>
                    <p className="text-luxe-silver text-xs mt-0.5">
                      Code: <code className="bg-luxe-black px-1 rounded">{c.tracking_code}</code> · Rabatt: {c.commission_discount_percentage} %
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyTrackingLink(c.tracking_code)}
                    className="shrink-0"
                  >
                    {copied === c.tracking_code ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    Link kopieren
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
