'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, Undo2, XCircle, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { CANCELLATION_REASONS } from '@/lib/cancellation-reasons'
import { RETURN_REASONS } from '@/lib/return-reasons'
import { useToast } from '@/hooks/use-toast'
import { AdminBereichErklaerung } from '@/components/admin/admin-bereich-erklaerung'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  status: string
  created_at: string
  cancellation_requested_at?: string | null
  cancellation_reason?: string | null
  cancellation_reason_other?: string | null
  cancellation_request_status?: string | null
  return_requested_at?: string | null
  return_reason?: string | null
  return_reason_other?: string | null
  return_request_status?: string | null
}

export default function AdminRequestsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders')
      if (!res.ok) {
        toast({ title: 'Fehler', description: 'Bestellungen konnten nicht geladen werden.', variant: 'destructive' })
        setOrders([])
        return
      }
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      toast({ title: 'Fehler', description: 'Bestellungen konnten nicht geladen werden.', variant: 'destructive' })
      setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  // Offen = noch nicht beendet. Storno: bis abgelehnt oder Bestellung storniert. Rücksendung: bis abgelehnt oder Rücksendung abgeschlossen.
  const stornierungsanfragenOffen = orders.filter(
    (o) => o.cancellation_requested_at && o.status !== 'cancelled' && o.cancellation_request_status !== 'rejected'
  )
  const ruecksendeanfragenOffen = orders.filter(
    (o) => o.return_requested_at && o.return_request_status !== 'rejected' && o.status !== 'return_completed'
  )
  const totalOffen = stornierungsanfragenOffen.length + ruecksendeanfragenOffen.length

  const getReasonLabel = (reason: string | null | undefined, other: string | null | undefined, reasons: { value: string; label: string }[]) => {
    if (!reason) return 'Kein Grund angegeben'
    const found = reasons.find((r) => r.value === reason)
    const label = found?.label ?? reason
    if (other) return `${label} – Sonstiges: ${other}`
    return label
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Zugestellt'
      case 'shipped': return 'Versandt'
      case 'processing': return 'In Bearbeitung'
      case 'cancelled': return 'Storniert'
      case 'cancellation_requested': return 'Stornierung beantragt'
      case 'cancellation_rejected': return 'Stornierung abgelehnt'
      case 'return_requested': return 'Rücksendung beantragt'
      case 'return_rejected': return 'Rücksendung abgelehnt'
      case 'return_completed': return 'Rücksendung abgeschlossen'
      default: return 'Ausstehend'
    }
  }

  const getRequestStatusLabel = (status: string | null | undefined) => {
    if (!status || status === 'pending') return 'Offen'
    if (status === 'approved') return 'Angenommen'
    if (status === 'rejected') return 'Abgelehnt'
    return status
  }
  const getRequestStatusStyle = (status: string | null | undefined) => {
    if (!status || status === 'pending') return 'bg-amber-500/20 text-amber-400 border-amber-500/50'
    if (status === 'approved') return 'bg-green-500/20 text-green-400 border-green-500/50'
    if (status === 'rejected') return 'bg-luxe-gray text-luxe-silver border-luxe-silver/50'
    return ''
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-luxe-silver">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AdminBereichErklaerung
        title="Stornos & Rücksendungen"
        was="Hier siehst du alle Storno- und Rücksendeanfragen von Kunden. Du entscheidest: annehmen oder ablehnen. Bei Annahme wird die Bestellung storniert bzw. der Kunde erhält QR-Code oder Druckanleitung für die Retoure."
        wozu="Rechtssichere Abwicklung von Widerruf und Retouren. Rücksende-Kosten pro Versanddienstleister sind unter Einstellungen → Versand einstellbar."
        wie="Offene Anfragen stehen oben. Klick auf eine Bestellung öffnet die Bestelldetailseite – dort kannst du die Anfrage annehmen oder ablehnen und ggf. den Grund angeben."
      />
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Stornierungen & Rücksendungen</h1>
        <p className="text-luxe-silver">
          Offene Anfragen bleiben sichtbar, bis Stornierung bzw. Rücksendung abgelehnt oder abgeschlossen ist.
        </p>
      </div>

      {totalOffen === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-luxe-gold/60 mx-auto mb-4" />
            <p className="text-white font-medium">Keine offenen Anfragen</p>
            <p className="text-luxe-silver text-sm mt-1">
              Es gibt derzeit keine Storno- oder Rücksendeanfragen, die noch bearbeitet werden müssen.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stornierungsanfragen – nur offene */}
          {stornierungsanfragenOffen.length > 0 && (
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader className="border-b border-luxe-gray">
                <CardTitle className="flex items-center gap-2 text-white">
                  <XCircle className="w-5 h-5 text-red-400" />
                  Stornierungsanfragen
                  <span className="text-base font-normal text-luxe-silver">({stornierungsanfragenOffen.length} offen)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {stornierungsanfragenOffen.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="block p-4 rounded-lg bg-luxe-gray/50 hover:bg-luxe-gray border border-luxe-gray"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-semibold text-white">#{order.order_number}</span>
                            <span className="text-luxe-silver">{order.customer_name}</span>
                            <span className="text-luxe-silver text-sm">{formatPrice(order.total)}</span>
                            <Badge variant="outline" className="text-xs">{getStatusLabel(order.status)}</Badge>
                            <Badge variant="outline" className={getRequestStatusStyle(order.cancellation_request_status)}>{getRequestStatusLabel(order.cancellation_request_status)}</Badge>
                          </div>
                          <span className="text-luxe-silver/80 text-sm flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Anfrage am {formatDate(order.cancellation_requested_at!)}
                          </span>
                        </div>
                        <p className="text-sm text-luxe-silver mt-2">
                          Grund: {getReasonLabel(order.cancellation_reason, order.cancellation_reason_other, [...CANCELLATION_REASONS])}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Rücksendeanfragen – nur offene */}
          {ruecksendeanfragenOffen.length > 0 && (
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader className="border-b border-luxe-gray">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Undo2 className="w-5 h-5 text-amber-400" />
                  Rücksendeanfragen
                  <span className="text-base font-normal text-luxe-silver">({ruecksendeanfragenOffen.length} offen)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {ruecksendeanfragenOffen.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="block p-4 rounded-lg bg-luxe-gray/50 hover:bg-luxe-gray border border-luxe-gray"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-semibold text-white">#{order.order_number}</span>
                            <span className="text-luxe-silver">{order.customer_name}</span>
                            <span className="text-luxe-silver text-sm">{formatPrice(order.total)}</span>
                            <Badge variant="outline" className="text-xs">{getStatusLabel(order.status)}</Badge>
                            <Badge variant="outline" className={getRequestStatusStyle(order.return_request_status)}>{getRequestStatusLabel(order.return_request_status)}</Badge>
                          </div>
                          <span className="text-luxe-silver/80 text-sm flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Anfrage am {formatDate(order.return_requested_at!)}
                          </span>
                        </div>
                        <p className="text-sm text-luxe-silver mt-2">
                          Grund: {getReasonLabel(order.return_reason, order.return_reason_other, [...RETURN_REASONS])}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex gap-4">
        <Link
          href="/admin/orders"
          className="text-sm text-luxe-gold hover:text-luxe-gold/80 transition-colors"
        >
          ← Alle Bestellungen
        </Link>
      </div>
    </div>
  )
}
