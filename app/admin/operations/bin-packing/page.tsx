'use client'

import { useState, useEffect } from 'react'
import { Package, Plus, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

export default function AdminBinPackingPage() {
  const [boxes, setBoxes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState('')
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const loadBoxes = async () => {
    const res = await fetch('/api/admin/bin-packing/boxes')
    if (res.ok) setBoxes(await res.json())
    else setBoxes([])
  }

  useEffect(() => {
    setLoading(true)
    loadBoxes().finally(() => setLoading(false))
  }, [])

  const handleCalculate = async () => {
    if (!orderId.trim()) {
      toast({ title: 'Order-ID eingeben', variant: 'destructive' })
      return
    }
    setCalculating(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/bin-packing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      setResult(data)
      toast({ title: 'Verpackungsplan berechnet' })
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground flex items-center">
        <Package className="w-7 h-7 mr-2 text-luxe-gold" />
        3D Bin-Packing
      </h1>
      <p className="text-luxe-silver text-sm">
        Standard-Boxen verwalten und Verpackungsplan pro Bestellung berechnen (deep_tech.standard_boxes, order_packaging_plans).
      </p>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Verpackung berechnen</h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-luxe-silver">Order-ID</Label>
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="UUID der Bestellung"
                className="bg-luxe-black border-luxe-gray text-white mt-1 w-80"
              />
            </div>
            <Button onClick={handleCalculate} disabled={calculating}>
              {calculating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Berechnen
            </Button>
          </div>
          {result && (
            <pre className="mt-4 p-4 rounded bg-luxe-black text-luxe-silver text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Standard-Boxen</h2>
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
          ) : boxes.length === 0 ? (
            <p className="text-luxe-silver text-sm">Keine Boxen. Über <code>POST /api/admin/bin-packing/boxes</code> anlegen (box_id, length_mm, width_mm, height_mm, max_weight_grams).</p>
          ) : (
            <ul className="space-y-2 text-sm text-luxe-silver">
              {boxes.map((b) => (
                <li key={b.box_id}>
                  <span className="text-white font-medium">{b.box_id}</span>
                  {' '}({b.length_mm}×{b.width_mm}×{b.height_mm} mm, max {b.max_weight_grams} g)
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
