'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

/**
 * BNPL (Mondu/Billie) – Optionale Phase-11-Integration.
 * API-Keys in .env.local setzen; Vollintegration (Checkout) separat.
 */
export default function AdminBnplSettingsPage() {
  const [status, setStatus] = useState<{ mondu: boolean; billie: boolean } | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings/bnpl-status')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => setStatus({ mondu: !!d.mondu_configured, billie: !!d.billie_configured }))
      .catch(() => setStatus({ mondu: false, billie: false }))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center">
        <CreditCard className="w-7 h-7 mr-2 text-luxe-gold" />
        Zahlungsanbieter (BNPL) – Mondu / Billie
      </h1>
      <p className="text-luxe-silver text-sm">
        Optionale Phase-11-Integration. Aktivierung und API-Keys über Umgebungsvariablen (z. B. MONDU_API_KEY, BILLIE_API_KEY). Vollintegration im Checkout erfolgt separat nach Anbieter-Dokumentation.
      </p>
      {status === null ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Mondu</span>
              <span className={status.mondu ? 'text-green-500' : 'text-luxe-silver'}>
                {status.mondu ? 'API-Key konfiguriert' : 'Nicht konfiguriert'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Billie</span>
              <span className={status.billie ? 'text-green-500' : 'text-luxe-silver'}>
                {status.billie ? 'API-Key konfiguriert' : 'Nicht konfiguriert'}
              </span>
            </div>
            <p className="text-xs text-luxe-silver pt-2 border-t border-luxe-gray">
              In .env.local setzen: MONDU_API_KEY, BILLIE_API_KEY (optional). Der Status zeigt nur, ob ein Key gesetzt ist – nicht den Wert.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
