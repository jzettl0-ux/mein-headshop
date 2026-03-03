'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Zap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

export default function AdminLightningDealsEditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { toast } = useToast()
  const [deal, setDeal] = useState<any>(null)
  const [dealPrice, setDealPrice] = useState('')
  const [quantityTotal, setQuantityTotal] = useState('')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [status, setStatus] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/lightning-deals')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const d = Array.isArray(data) ? data.find((x: any) => x.deal_id === id) : null
        if (d) {
          setDeal(d)
          setDealPrice(String(d.deal_price))
          setQuantityTotal(String(d.quantity_total))
          setStartAt(d.start_at ? d.start_at.slice(0, 16) : '')
          setEndAt(d.end_at ? d.end_at.slice(0, 16) : '')
          setStatus(d.status || '')
        }
      })
      .catch(() => {})
  }, [id])

  const handleSave = async () => {
    const dp = parseFloat(dealPrice)
    const qty = parseInt(quantityTotal, 10)
    if (isNaN(dp) || dp < 0 || isNaN(qty) || qty < 1) {
      toast({ title: 'Ungültige Werte', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/lightning-deals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_price: dp,
          quantity_total: qty,
          start_at: startAt || undefined,
          end_at: endAt || undefined,
          status: status || undefined,
        }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Gespeichert' })
      router.push('/admin/lightning-deals')
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!deal) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  const p = deal.products

  return (
    <div className="space-y-8">
      <Link href="/admin/lightning-deals" className="inline-flex items-center text-luxe-silver hover:text-white">
        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Zap className="w-7 h-7 text-luxe-gold" />
          Blitz-Angebot bearbeiten
        </h1>
        <p className="text-luxe-silver text-sm mt-1">{p?.name}</p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray max-w-lg">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label className="text-luxe-silver">Deal-Preis (€)</Label>
            <Input type="number" step="0.01" min={0} value={dealPrice} onChange={(e) => setDealPrice(e.target.value)} className="bg-luxe-black border-luxe-gray text-white mt-1" />
          </div>
          <div>
            <Label className="text-luxe-silver">Kontingent (Stück)</Label>
            <Input type="number" min={1} value={quantityTotal} onChange={(e) => setQuantityTotal(e.target.value)} className="bg-luxe-black border-luxe-gray text-white mt-1" />
            <p className="text-xs text-luxe-silver mt-1">Bereits verkauft: {deal.quantity_claimed}</p>
          </div>
          <div>
            <Label className="text-luxe-silver">Start</Label>
            <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="bg-luxe-black border-luxe-gray text-white mt-1" />
          </div>
          <div>
            <Label className="text-luxe-silver">Ende</Label>
            <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="bg-luxe-black border-luxe-gray text-white mt-1" />
          </div>
          <div>
            <Label className="text-luxe-silver">Status</Label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md bg-luxe-black border border-luxe-gray text-white px-3 py-2 mt-1">
              <option value="scheduled">Geplant</option>
              <option value="active">Aktiv</option>
              <option value="ended">Beendet</option>
              <option value="cancelled">Storniert</option>
            </select>
          </div>
          <div className="flex gap-4 pt-2">
            <Button onClick={handleSave} variant="luxe" disabled={submitting}>{submitting ? '…' : 'Speichern'}</Button>
            <Link href="/admin/lightning-deals"><Button variant="admin-outline">Abbrechen</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
