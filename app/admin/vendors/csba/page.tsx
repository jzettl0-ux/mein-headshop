'use client'

import { useState, useEffect } from 'react'
import { HeadphonesIcon, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Sub = {
  subscription_id: string
  vendor_id: string
  fee_per_order: number
  is_active: boolean
  auto_escalation_enabled: boolean
  enrolled_at: string
}

export default function AdminCsbaPage() {
  const [subscriptions, setSubscriptions] = useState<Sub[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/csba-subscriptions')
      .then((r) => (r.ok ? r.json() : { subscriptions: [] }))
      .then((d) => setSubscriptions(d.subscriptions ?? []))
      .catch(() => setSubscriptions([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <HeadphonesIcon className="w-6 h-6 text-luxe-gold" />
          CSBA (Customer Service by Admin)
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Support-Auslagerung – Pauschale pro Bestellung, Auto-Eskalation.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : subscriptions.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Subscriptions. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">vendor_programs.csba_subscriptions</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">CSBA Subscriptions</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{subscriptions.length} Vendoren</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {subscriptions.map((s) => (
                <li key={s.subscription_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <div className="flex items-center gap-2">
                    {s.is_active ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-luxe-silver" />}
                    <span className="text-white">Vendor #{s.vendor_id.slice(0, 8)}</span>
                  </div>
                  <span className="text-luxe-silver">
                    {s.fee_per_order} €/Bestellung{s.auto_escalation_enabled && ' · Auto-Eskalation'}
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
