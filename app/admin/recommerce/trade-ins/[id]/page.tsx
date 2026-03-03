'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { RefreshCw, ArrowLeft, Loader2, Check, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Eingereicht',
  LABEL_GENERATED: 'Label erstellt',
  IN_TRANSIT: 'Unterwegs',
  INSPECTING: 'Prüfung',
  ACCEPTED: 'Angenommen',
  REJECTED: 'Abgelehnt',
  RETURNED_TO_CUSTOMER: 'Zurück an Kunde',
}

export default function AdminTradeInDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const id = typeof params?.id === 'string' ? params.id : ''
  const [row, setRow] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [acceptAmount, setAcceptAmount] = useState('')

  useEffect(() => {
    if (!id) return
    fetch(`/api/admin/trade-in-requests/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setRow)
      .catch(() => setRow(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (row?.quoted_value != null) setAcceptAmount(String(row.quoted_value))
  }, [row?.quoted_value])

  const handleAccept = async () => {
    if (!id) return
    setAccepting(true)
    try {
      const amt = parseFloat(acceptAmount.replace(',', '.')) || row?.quoted_value || 0
      const res = await fetch(`/api/admin/trade-in-requests/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({ title: 'Store Credit gutgeschrieben' })
      setRow((prev: any) => prev ? { ...prev, status: 'ACCEPTED', final_credited_amount: amt } : null)
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setAccepting(false)
    }
  }

  const handleReject = async () => {
    if (!id) return
    setRejecting(true)
    try {
      const res = await fetch(`/api/admin/trade-in-requests/${id}/reject`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler')
      }
      toast({ title: 'Trade-In abgelehnt' })
      setRow((prev: any) => prev ? { ...prev, status: 'REJECTED' } : null)
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setRejecting(false)
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      const res = await fetch(`/api/admin/trade-in-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Fehler')
      setRow((prev: any) => prev ? { ...prev, status } : null)
      toast({ title: 'Status aktualisiert' })
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-luxe-primary" />
      </div>
    )
  }
  if (!row) {
    return (
      <div className="space-y-6">
        <Link href="/admin/recommerce/trade-ins" className="inline-flex items-center gap-2 text-luxe-silver hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Zurück
        </Link>
        <p className="text-luxe-silver">Trade-In nicht gefunden.</p>
      </div>
    )
  }

  const canAccept = ['PENDING', 'IN_TRANSIT', 'INSPECTING'].includes(row.status)
  const canReject = ['PENDING', 'IN_TRANSIT', 'INSPECTING'].includes(row.status)
  const product = row.products

  return (
    <div className="space-y-8">
      <Link href="/admin/recommerce/trade-ins" className="inline-flex items-center gap-2 text-luxe-silver hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Zurück zu Trade-In
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RefreshCw className="h-7 w-7 text-luxe-primary" />
          Trade-In: {product?.name ?? row.trade_in_id?.slice(0, 8)}
        </h1>
        <p className="mt-1 text-luxe-silver">
          Erstellt {new Date(row.created_at).toLocaleString('de-DE')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-luxe-silver">Produkt</p>
              <p className="text-white">{product?.name ?? '–'}</p>
              {product?.slug && (
                <Link href={`/shop/${product.slug}`} className="text-sm text-luxe-gold hover:underline">
                  Produktseite
                </Link>
              )}
            </div>
            <div>
              <p className="text-sm text-luxe-silver">Angebotswert</p>
              <p className="text-white font-medium">{Number(row.quoted_value).toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-sm text-luxe-silver">Zustandsfragen</p>
              <pre className="text-sm text-luxe-silver bg-luxe-black/50 p-3 rounded overflow-auto">
                {JSON.stringify(row.condition_answers ?? {}, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Aktionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-luxe-silver mb-1">Status</label>
              <Select
                value={row.status}
                onValueChange={handleStatusChange}
                disabled={row.status === 'ACCEPTED' || row.status === 'REJECTED'}
              >
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canAccept && (
              <div>
                <label className="block text-sm text-luxe-silver mb-1">Gutschriftsbetrag (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={acceptAmount}
                  onChange={(e) => setAcceptAmount(e.target.value)}
                  className="w-full rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white"
                />
              </div>
            )}

            <div className="flex gap-2">
              {canAccept && (
                <Button onClick={handleAccept} disabled={accepting} className="gap-2">
                  {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Akzeptieren & gutschreiben
                </Button>
              )}
              {canReject && (
                <Button variant="destructive" onClick={handleReject} disabled={rejecting} className="gap-2">
                  {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Ablehnen
                </Button>
              )}
            </div>

            {row.status === 'ACCEPTED' && row.final_credited_amount != null && (
              <p className="text-emerald-400 text-sm">
                {Number(row.final_credited_amount).toFixed(2)} € Store Credit gutgeschrieben
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
