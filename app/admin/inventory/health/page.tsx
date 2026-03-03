'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Loader2, RefreshCw, AlertTriangle, Play } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function AdminInventoryHealthPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/inventory-health')
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleCalculate = async () => {
    setCalculating(true)
    try {
      const res = await fetch('/api/admin/inventory-health', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({
        title: 'Berechnung abgeschlossen',
        description: `${data.processed ?? 0} Angebote · ${data.needsRestock ?? 0} benötigen Nachschub`,
      })
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setCalculating(false)
    }
  }

  const needsRestock = items.filter((i) => i.needs_restock).length

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/inventory" className="inline-flex items-center gap-2 text-luxe-silver hover:text-white mb-4">
          <Package className="h-4 w-4" /> Zurück zu Lager
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="h-7 w-7 text-luxe-primary" />
          Inventory Health & Restock
        </h1>
        <p className="mt-1 text-luxe-silver">
          Safety Stock, Reorder Point – wann nachbestellen? Berechnung aus Verkaufsdaten (30 Tage).
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Berechnung</CardTitle>
          <Button onClick={handleCalculate} disabled={calculating} className="gap-2">
            {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Jetzt berechnen
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-luxe-silver">
            Ermittelt avg_daily_sales aus bezahlten Bestellungen (30 Tage), berechnet Safety Stock und Reorder Point.
            Setzt needs_restock wenn current_stock ≤ reorder_point.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            Vendor-Angebote
            {needsRestock > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> {needsRestock} Nachschub nötig
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-luxe-silver" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">
              Keine Einträge. Klicke „Jetzt berechnen“ – Voraussetzung: vendor_offers mit Verkäufen.
            </p>
          ) : (
            <div className="space-y-3 overflow-auto max-h-[500px]">
              {items.map((i: any) => (
                <div
                  key={i.health_id}
                  className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border ${
                    i.needs_restock ? 'bg-amber-900/20 border-amber-600/50' : 'bg-luxe-black/50 border-luxe-gray'
                  }`}
                >
                  <div>
                    <p className="text-white font-medium">
                      {i.vendor_offers?.products?.name ?? i.offer_id?.slice(0, 8)} · {i.vendor_accounts?.company_name ?? i.vendor_id?.slice(0, 8)}
                    </p>
                    <p className="text-sm text-luxe-silver mt-1">
                      Bestand: {i.current_stock} · Reorder Point: {i.calculated_reorder_point} · Ø Verkauf/Tag: {Number(i.avg_daily_sales).toFixed(2)} · 
                      {i.days_of_supply != null ? ` Noch ~${Number(i.days_of_supply).toFixed(0)} Tage` : ' —'}
                    </p>
                  </div>
                  <Badge variant={i.needs_restock ? 'destructive' : 'secondary'}>
                    {i.needs_restock ? 'Nachschub nötig' : 'OK'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
