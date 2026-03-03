'use client'

import { useState, useEffect } from 'react'
import { PackagePlus, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Wave = {
  wave_id: string
  warehouse_zone: string
  total_items_to_pick: number
  status: string
  created_at: string
}

export default function AdminWavePickingPage() {
  const [waves, setWaves] = useState<Wave[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/picking-waves')
      .then((r) => (r.ok ? r.json() : { waves: [] }))
      .then((d) => setWaves(d.waves ?? []))
      .catch(() => setWaves([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <PackagePlus className="w-6 h-6 text-luxe-gold" />
          Warehouse Wave Picking
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Traveling Salesman, Slotting – optimierte Pick-Sequenz.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : waves.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Picking Waves. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">warehouse_ops.picking_waves</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Picking Waves</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{waves.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {waves.map((w) => (
                <li key={w.wave_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <span className="font-medium text-white">{w.warehouse_zone}</span>
                  <span className="text-luxe-silver">{w.total_items_to_pick} Positionen · {w.status}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
