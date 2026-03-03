'use client'

import { useState, useEffect } from 'react'
import { Package, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function VendorDashboardPage() {
  const [stats, setStats] = useState<{ orders_pending?: number; revenue_today?: number; alerts?: number } | null>(null)

  useEffect(() => {
    fetch('/api/vendor/dashboard')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-luxe-silver mt-1">Übersicht deines Verkäufer-Kontos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-luxe-silver flex items-center gap-2">
              <Package className="w-4 h-4" />
              Offene Bestellungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats?.orders_pending ?? '–'}</p>
          </CardContent>
        </Card>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-luxe-silver flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Umsatz heute (€)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats?.revenue_today != null ? stats.revenue_today.toFixed(2) : '–'}</p>
          </CardContent>
        </Card>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-luxe-silver flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Hinweise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats?.alerts ?? '–'}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Willkommen im Vendor-Portal</CardTitle>
        </CardHeader>
        <CardContent className="text-luxe-silver">
          <p>
            Hier findest du deine Bestellungen, Angebote und Kontodaten. Die vollständige Implementierung folgt gemäß Spec in docs/VENDOR-PORTAL-SPEC.md.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
