'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Activity, AlertTriangle, Loader2, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

type Metric = {
  id: string
  vendor_id: string
  order_defect_rate: number
  late_shipment_rate: number
  valid_tracking_rate: number
  is_buybox_eligible: boolean
  calculation_date: string
  vendor_accounts?: { id: string; company_name: string; contact_email: string; is_active: boolean }
  odrAlert?: boolean
  lsrAlert?: boolean
  vtrAlert?: boolean
}

export default function AdminVendorPerformancePage() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [alerts, setAlerts] = useState<Metric[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    try {
      const res = await fetch('/api/admin/vendor-performance')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMetrics(data.metrics ?? [])
      setAlerts(data.alerts ?? [])
    } catch {
      setMetrics([])
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/vendors/refresh-metrics', { method: 'POST' })
      if (!res.ok) throw new Error()
      toast({ title: 'Metriken neu berechnet' })
      load()
    } catch {
      toast({ title: 'Fehler beim Aktualisieren', variant: 'destructive' })
    } finally {
      setRefreshing(false)
    }
  }

  const pct = (v: number) => `${(v * 100).toFixed(2)}%`

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-luxe-gold" />
            Vendor Performance
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            ODR, LSR, VTR. Alerts bei ODR &gt; 1%, LSR &gt; 4%, VTR &lt; 95%. Buy-Box-Berechtigung.
          </p>
        </div>
        <Button variant="luxe" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Metriken neu berechnen
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : (
        <>
          {alerts.length > 0 && (
            <Card className="bg-luxe-charcoal border-amber-500/50">
              <CardHeader>
                <CardTitle className="text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alerts ({alerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {alerts.map((m) => (
                    <div
                      key={m.vendor_id}
                      className="flex flex-wrap items-center justify-between gap-4 py-2 px-3 rounded-lg bg-luxe-black/50"
                    >
                      <div>
                        <Link
                          href={`/admin/vendors/${m.vendor_id}`}
                          className="text-white font-medium hover:text-luxe-gold"
                        >
                          {m.vendor_accounts?.company_name ?? m.vendor_id}
                        </Link>
                        <div className="flex gap-2 mt-1">
                          {m.odrAlert && (
                            <Badge variant="destructive">ODR {pct(m.order_defect_rate)}</Badge>
                          )}
                          {m.lsrAlert && (
                            <Badge variant="destructive">LSR {pct(m.late_shipment_rate)}</Badge>
                          )}
                          {m.vtrAlert && (
                            <Badge variant="destructive">VTR {pct(m.valid_tracking_rate)}</Badge>
                          )}
                        </div>
                      </div>
                      <Link href={`/admin/vendors/${m.vendor_id}`}>
                        <Button variant="admin-outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-1" /> Bearbeiten
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Alle Vendor-Metriken</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <p className="text-luxe-silver text-sm">Keine Metriken vorhanden.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-luxe-gray text-left text-luxe-silver">
                        <th className="pb-3 pr-4">Vendor</th>
                        <th className="pb-3 pr-4">ODR</th>
                        <th className="pb-3 pr-4">LSR</th>
                        <th className="pb-3 pr-4">VTR</th>
                        <th className="pb-3 pr-4">Buy Box</th>
                        <th className="pb-3 pr-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.map((m) => (
                        <tr key={m.vendor_id} className="border-b border-luxe-gray/70">
                          <td className="py-3 pr-4 text-white">
                            <Link
                              href={`/admin/vendors/${m.vendor_id}`}
                              className="hover:text-luxe-gold"
                            >
                              {m.vendor_accounts?.company_name ?? m.vendor_id}
                            </Link>
                          </td>
                          <td
                            className={`py-3 pr-4 ${m.odrAlert ? 'text-red-400 font-medium' : 'text-luxe-silver'}`}
                          >
                            {pct(m.order_defect_rate)}
                          </td>
                          <td
                            className={`py-3 pr-4 ${m.lsrAlert ? 'text-amber-400 font-medium' : 'text-luxe-silver'}`}
                          >
                            {pct(m.late_shipment_rate)}
                          </td>
                          <td
                            className={`py-3 pr-4 ${m.vtrAlert ? 'text-amber-400 font-medium' : 'text-luxe-silver'}`}
                          >
                            {pct(m.valid_tracking_rate)}
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={m.is_buybox_eligible ? 'default' : 'secondary'}>
                              {m.is_buybox_eligible ? 'Ja' : 'Nein'}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <Link href={`/admin/vendors/${m.vendor_id}`}>
                              <Button variant="ghost" size="sm" className="h-7 text-luxe-gold">
                                Bearbeiten
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
