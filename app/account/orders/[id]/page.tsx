'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, MapPin, Mail, Phone, Calendar, FileText, XCircle, Truck, Undo2, MessageSquare, ShieldCheck, Printer } from 'lucide-react'
import { getTrackingUrl } from '@/lib/tracking-urls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase/auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CANCELLATION_REASONS } from '@/lib/cancellation-reasons'
import { RETURN_REASONS } from '@/lib/return-reasons'
import { getCarrierLabel, formatReturnOptionPrice, carrierSupportsQr } from '@/lib/return-shipping-carriers'

interface OrderItem {
  id: string
  product_name: string
  product_image: string
  quantity: number
  price: number
  total: number
  item_status?: 'active' | 'cancelled' | 'returned' | null
  cancelled_quantity?: number | null
  returned_quantity?: number | null
}

interface Shipment {
  id: string
  tracking_number: string
  tracking_carrier: string | null
}

interface Order {
  id: string
  order_number: string
  created_at: string
  total: number
  subtotal: number
  shipping_cost: number
  status: string
  payment_status?: string
  has_adult_items: boolean
  customer_name: string
  customer_email: string
  shipping_address: any
  invoice_url?: string | null
  invoice_xml_url?: string | null
  tracking_number?: string | null
  tracking_carrier?: string | null
  cancellation_requested_at?: string | null
  cancellation_reason?: string | null
  cancellation_reason_other?: string | null
  cancellation_request_status?: string | null
  return_requested_at?: string | null
  return_reason?: string | null
  return_reason_other?: string | null
  return_request_status?: string | null
  return_shipping_code?: string | null
  return_shipping_deduction_cents?: number | null
  return_shipping_options?: { carrier: string; label: string; price_cents: number }[] | null
  return_carrier_preference?: string | null
  return_method_preference?: string | null
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [itemsByShipment, setItemsByShipment] = useState<Record<string, { product_name: string; quantity: number }[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [cancelRequestDialogOpen, setCancelRequestDialogOpen] = useState(false)
  const [cancelRequestReason, setCancelRequestReason] = useState('')
  const [cancelRequestReasonOther, setCancelRequestReasonOther] = useState('')
  const [isSubmittingCancelRequest, setIsSubmittingCancelRequest] = useState(false)
  const [returnRequestDialogOpen, setReturnRequestDialogOpen] = useState(false)
  const [returnRequestReason, setReturnRequestReason] = useState('')
  const [returnRequestReasonOther, setReturnRequestReasonOther] = useState('')
  const [cancelRequestQuantities, setCancelRequestQuantities] = useState<Record<string, number>>({})
  const [returnRequestQuantities, setReturnRequestQuantities] = useState<Record<string, number>>({})
  const [returnCarrierOptions, setReturnCarrierOptions] = useState<{ value: string; label: string; price_cents: number; supports_qr?: boolean }[]>([])
  const [preferredCarrier, setPreferredCarrier] = useState('')
  const [returnMethodPreference, setReturnMethodPreference] = useState<'printed_code' | 'qr_code'>('qr_code')
  const [isSubmittingReturnRequest, setIsSubmittingReturnRequest] = useState(false)
  const [a2zDialogOpen, setA2zDialogOpen] = useState(false)
  const [a2zReason, setA2zReason] = useState('')
  const [a2zDescription, setA2zDescription] = useState('')
  const [isSubmittingA2z, setIsSubmittingA2z] = useState(false)
  const [returnLabelQr, setReturnLabelQr] = useState<string | null>(null)
  const [returnLabelRetNumber, setReturnLabelRetNumber] = useState<string | null>(null)
  const [loadingReturnLabel, setLoadingReturnLabel] = useState(false)
  const [approvedReturnItems, setApprovedReturnItems] = useState<{ product_name: string; requested_quantity: number; admin_status?: string }[]>([])
  const router = useRouter()
  const { toast } = useToast()

  const hasPendingCancellation = order?.cancellation_requested_at && (order.cancellation_request_status === 'pending' || !order.cancellation_request_status)
  const canRequestCancel = order && ['pending', 'processing', 'cancellation_rejected', 'cancellation_requested'].includes(order.status)
  const cancellationRequested = order?.cancellation_requested_at
  const hasPendingReturn = order?.return_requested_at && (order.return_request_status === 'pending' || !order.return_request_status)
  const canRequestReturn = order && ['shipped', 'delivered', 'return_rejected', 'return_requested'].includes(order.status)
  const returnRequested = order?.return_requested_at
  const canRequestA2z = order && ['shipped', 'delivered', 'cancellation_rejected', 'return_rejected'].includes(order.status)

  useEffect(() => {
    loadOrder()
  }, [])

  useEffect(() => {
    if (order?.id && order?.return_request_status === 'approved') {
      fetch(`/api/account/orders/${order.id}/request-items`)
        .then((res) => res.ok ? res.json() : { return: [] })
        .then((data: { return?: { product_name: string; requested_quantity?: number; admin_status?: string }[] }) => {
          const items = (data.return ?? []).map((r) => ({
            product_name: r.product_name,
            requested_quantity: r.requested_quantity ?? 1,
            admin_status: r.admin_status,
          }))
          setApprovedReturnItems(items)
        })
        .catch(() => setApprovedReturnItems([]))
    } else {
      setApprovedReturnItems([])
    }
  }, [order?.id, order?.return_request_status])

  const loadOrder = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth?redirect=/account')
        return
      }

      // Load order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (orderError || !orderData) {
        router.push('/account')
        return
      }

      setOrder(orderData)

      // Load order items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', params.id)

      setOrderItems(itemsData || [])

      // Load shipments (mehrere Pakete pro Bestellung)
      const { data: shipmentsData } = await supabase
        .from('order_shipments')
        .select('id, tracking_number, tracking_carrier')
        .eq('order_id', params.id)
        .order('created_at', { ascending: true })

      const shipmentsList = shipmentsData || []
      setShipments(shipmentsList)

      // Paketinhalt pro Sendung (RLS erlaubt Kunden nur eigene Bestellungen)
      const byShipment: Record<string, { product_name: string; quantity: number }[]> = {}
      shipmentsList.forEach((s) => { byShipment[s.id] = [] })
      if (shipmentsList.length > 0) {
        const ids = shipmentsList.map((s) => s.id).filter(Boolean)
        const { data: siRows } = await supabase
          .from('order_shipment_items')
          .select('shipment_id, order_item_id, quantity')
          .in('shipment_id', ids)
        const orderItemIds = [...new Set((siRows ?? []).map((r) => r.order_item_id))]
        const nameById = new Map<string, string>()
        if (orderItemIds.length > 0) {
          const { data: oiRows } = await supabase.from('order_items').select('id, product_name').in('id', orderItemIds)
          ;(oiRows ?? []).forEach((o: { id: string; product_name: string }) => { nameById.set(o.id, o.product_name ?? 'Artikel') })
        }
        ;(siRows ?? []).forEach((si: { shipment_id: string; order_item_id: string; quantity: number }) => {
          byShipment[si.shipment_id] = byShipment[si.shipment_id] ?? []
          byShipment[si.shipment_id].push({
            product_name: nameById.get(si.order_item_id) ?? 'Artikel',
            quantity: si.quantity,
          })
        })
      }
      setItemsByShipment(byShipment)
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCancelRequest = async () => {
    setCancelRequestDialogOpen(true)
    setCancelRequestReason('')
    setCancelRequestReasonOther('')
    const init: Record<string, number> = {}
    if (hasPendingCancellation && order?.id) {
      try {
        const res = await fetch(`/api/account/orders/${order.id}/request-items`)
        const data = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(data.cancellation)) {
          data.cancellation.forEach((r: { order_item_id: string; requested_quantity?: number; max_cancel?: number }) => {
            const max = r.max_cancel ?? Math.max(0, (orderItems.find((i) => i.id === r.order_item_id)?.quantity ?? 0) - (orderItems.find((i) => i.id === r.order_item_id)?.cancelled_quantity ?? 0))
            init[r.order_item_id] = r.requested_quantity ?? max
          })
        }
      } catch {
        // Fallback: max available
      }
    }
    orderItems.forEach((i) => {
      if (!(i.id in init)) {
        init[i.id] = Math.max(0, i.quantity - (i.cancelled_quantity ?? 0))
      }
    })
    setCancelRequestQuantities(init)
  }

  const handleSubmitCancelRequest = async () => {
    if (!order?.id) return
    const items = orderItems
      .filter((i) => (cancelRequestQuantities[i.id] ?? 0) > 0)
      .map((i) => ({ order_item_id: i.id, quantity: Math.min(cancelRequestQuantities[i.id] ?? 0, Math.max(0, i.quantity - (i.cancelled_quantity ?? 0))) }))
      .filter((x) => x.quantity > 0)
    if (orderItems.length > 0 && items.length === 0) {
      toast({ title: 'Bitte gib mindestens bei einem Artikel die Menge an', variant: 'destructive' })
      return
    }
    setIsSubmittingCancelRequest(true)
    try {
      const res = await fetch(`/api/account/orders/${order.id}/request-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelRequestReason || undefined,
          reason_other: cancelRequestReasonOther || undefined,
          items: items.length > 0 ? items : undefined,
          order_item_ids: items.length === 0 ? undefined : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Anfrage fehlgeschlagen', description: data.error, variant: 'destructive' })
        return
      }
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              cancellation_requested_at: new Date().toISOString(),
              cancellation_reason: cancelRequestReason || null,
              cancellation_reason_other: cancelRequestReasonOther || null,
            }
          : null
      )
      setCancelRequestDialogOpen(false)
      setCancelRequestReason('')
      setCancelRequestReasonOther('')
      toast({ title: 'Stornierung angefragt', description: data.message })
    } catch {
      toast({ title: 'Fehler', description: 'Anfrage konnte nicht gesendet werden.', variant: 'destructive' })
    } finally {
      setIsSubmittingCancelRequest(false)
    }
  }

  const handleOpenReturnRequest = async () => {
    setReturnRequestDialogOpen(true)
    setReturnRequestReason('')
    setReturnRequestReasonOther('')
    setPreferredCarrier(order?.return_carrier_preference ?? '')
    setReturnMethodPreference((order?.return_method_preference as 'printed_code' | 'qr_code') || 'qr_code')
    const init: Record<string, number> = {}
    if (hasPendingReturn && order?.id) {
      try {
        const res = await fetch(`/api/account/orders/${order.id}/request-items`)
        const data = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(data.return)) {
          data.return.forEach((r: { order_item_id: string; requested_quantity?: number; max_return?: number }) => {
            const max = r.max_return ?? Math.max(0, (orderItems.find((i) => i.id === r.order_item_id)?.quantity ?? 0) - (orderItems.find((i) => i.id === r.order_item_id)?.returned_quantity ?? 0))
            init[r.order_item_id] = r.requested_quantity ?? max
          })
        }
      } catch {
        // Fallback: max available
      }
    }
    orderItems.forEach((i) => {
      if (!(i.id in init)) {
        init[i.id] = Math.max(0, i.quantity - (i.returned_quantity ?? 0))
      }
    })
    setReturnRequestQuantities(init)
    if (returnCarrierOptions.length === 0) {
      fetch('/api/return-carrier-prices')
        .then((res) => res.ok ? res.json() : { carriers: [] })
        .then((data: { carriers?: { value: string; label: string; price_cents: number }[] }) => setReturnCarrierOptions(data.carriers ?? []))
        .catch(() => setReturnCarrierOptions([]))
    }
  }

  const handleSubmitReturnRequest = async () => {
    if (!order?.id) return
    const items = orderItems
      .filter((i) => (returnRequestQuantities[i.id] ?? 0) > 0)
      .map((i) => ({ order_item_id: i.id, quantity: Math.min(returnRequestQuantities[i.id] ?? 0, Math.max(0, i.quantity - (i.returned_quantity ?? 0))) }))
      .filter((x) => x.quantity > 0)
    if (orderItems.length > 0 && items.length === 0) {
      toast({ title: 'Bitte gib mindestens bei einem Artikel die Menge an', variant: 'destructive' })
      return
    }
    if (!hasPendingReturn && (!preferredCarrier || !returnCarrierOptions.some((c) => c.value === preferredCarrier))) {
      toast({ title: 'Bitte wähle einen Versanddienstleister für die Rücksendung', variant: 'destructive' })
      return
    }
    if (!hasPendingReturn && !returnMethodPreference) {
      toast({ title: 'Bitte wähle, wie du die Retoure verschicken möchtest ( gedruckter Code oder QR-Code)', variant: 'destructive' })
      return
    }
    setIsSubmittingReturnRequest(true)
    try {
      const res = await fetch(`/api/account/orders/${order.id}/request-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          reason: returnRequestReason || undefined,
          reason_other: returnRequestReasonOther || undefined,
          items: items.length > 0 ? items : undefined,
          preferred_carrier: preferredCarrier || undefined,
          return_method_preference: returnMethodPreference || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Anfrage fehlgeschlagen', description: data.error, variant: 'destructive' })
        return
      }
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              return_requested_at: new Date().toISOString(),
              return_reason: returnRequestReason || null,
              return_reason_other: returnRequestReasonOther || null,
            }
          : null
      )
      setReturnRequestDialogOpen(false)
      setReturnRequestReason('')
      setReturnRequestReasonOther('')
      setPreferredCarrier('')
      toast({ title: 'Rücksendung angefragt', description: data.message })
    } catch {
      toast({ title: 'Fehler', description: 'Anfrage konnte nicht gesendet werden.', variant: 'destructive' })
    } finally {
      setIsSubmittingReturnRequest(false)
    }
  }

  const handleSubmitA2z = async () => {
    if (!order || !a2zReason) {
      toast({ title: 'Bitte einen Grund angeben', variant: 'destructive' })
      return
    }
    setIsSubmittingA2z(true)
    try {
      const res = await fetch(`/api/account/orders/${order.id}/a-to-z-claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_reason: a2zReason,
          claim_amount: order.total,
          description: a2zDescription.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      setA2zDialogOpen(false)
      setA2zReason('')
      setA2zDescription('')
      toast({ title: 'A-bis-z-Garantie-Anspruch eingereicht', description: 'Wir prüfen deinen Anspruch und melden uns.' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setIsSubmittingA2z(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'cancellation_requested': return 'bg-amber-500/20 text-amber-400 border-amber-500/50'
      case 'cancellation_rejected': return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 'return_requested': return 'bg-violet-500/20 text-violet-400 border-violet-500/50'
      case 'return_rejected': return 'bg-rose-500/20 text-rose-400 border-rose-500/50'
      case 'return_completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
      default: return 'bg-luxe-gray text-luxe-silver border-luxe-silver/50'
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Bestellung nicht gefunden</h2>
          <Link href="/account" className="text-luxe-gold hover:underline">
            Zurück zum Account
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-5xl">
        {/* Back Link */}
        <Link
          href="/account"
          className="inline-flex items-center text-luxe-silver hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zu meinen Bestellungen
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Bestellung #{order.order_number}
            </h1>
            <p className="text-luxe-silver">
              <Calendar className="w-4 h-4 inline mr-1" />
              Bestellt am {formatDate(order.created_at)}
            </p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Bestellte Artikel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 bg-luxe-gray rounded-lg">
                      <div className="w-20 h-20 bg-luxe-black rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{item.product_name}</h3>
                        <p className="text-luxe-silver text-sm">Menge: {item.quantity}</p>
                        {((item.cancelled_quantity ?? 0) > 0 || (item.returned_quantity ?? 0) > 0 || item.item_status === 'cancelled' || item.item_status === 'returned') && (
                          <>
                            {(item.cancelled_quantity ?? 0) > 0 && (
                              <p className="text-red-400 text-xs mt-1">
                                {(item.cancelled_quantity ?? 0) >= item.quantity ? 'Storniert' : `${item.cancelled_quantity} von ${item.quantity} storniert`}
                              </p>
                            )}
                            {(item.returned_quantity ?? 0) > 0 && (
                              <p className="text-violet-400 text-xs mt-1">
                                {(item.returned_quantity ?? 0) >= item.quantity ? 'Zurückgesendet' : `${item.returned_quantity} von ${item.quantity} zurückgesendet`}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{formatPrice(item.total)}</p>
                        <p className="text-luxe-silver text-sm">{formatPrice(item.price)} / Stück</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-luxe-gold" />
                  Lieferadresse
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.shipping_address && (
                  <p className="text-white leading-relaxed">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}<br />
                    {order.shipping_address.street} {order.shipping_address.house_number}<br />
                    {order.shipping_address.postal_code} {order.shipping_address.city}<br />
                    {order.shipping_address.country || 'Deutschland'}
                    {order.shipping_address.phone && (
                      <>
                        <br />
                        <Phone className="w-4 h-4 inline mr-1 text-luxe-gold" />
                        {order.shipping_address.phone}
                      </>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="bg-luxe-charcoal border-luxe-gray sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">Zusammenfassung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.has_adult_items && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                    <p className="text-red-400 text-sm">
                      🔞 18+ Altersverifikation
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-luxe-silver">
                    <span>Zwischensumme</span>
                    <span>{formatPrice(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-luxe-silver">
                    <span>Versand</span>
                    <span>{formatPrice(order.shipping_cost)}</span>
                  </div>
                  {order.has_adult_items && (
                    <div className="flex justify-between text-red-400 text-sm">
                      <span>DHL Ident-Check</span>
                      <span>inkl.</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-luxe-gray">
                    <span className="text-white font-bold text-lg">Gesamt</span>
                    <span className="text-luxe-gold font-bold text-2xl">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>

                {((shipments.length > 0) || (order.tracking_number && (order.status === 'shipped' || order.status === 'delivered'))) && (
                  <div className="pt-4 border-t border-luxe-gray mb-4">
                    <p className="text-sm text-luxe-silver mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-luxe-gold" />
                      Sendungsverfolgung
                      {shipments.length > 1 && (
                        <span className="text-luxe-silver">({shipments.length} Pakete)</span>
                      )}
                    </p>
                    <div className="space-y-3">
                      {shipments.length > 0
                        ? shipments.map((s) => {
                            const packItems = itemsByShipment[s.id] ?? []
                            return (
                              <div key={s.id} className="rounded-lg border border-luxe-gray bg-luxe-charcoal/50 p-3 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-white font-mono font-semibold text-sm">{s.tracking_number}</span>
                                  <span className="text-luxe-silver text-xs">({s.tracking_carrier || 'DHL'})</span>
                                  <a
                                    href={getTrackingUrl(s.tracking_carrier || 'DHL', s.tracking_number)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-luxe-gray hover:bg-luxe-gray/80 text-white text-sm border border-luxe-silver/50"
                                  >
                                    Verfolgen →
                                  </a>
                                </div>
                                <div className="mt-1.5">
                                  <p className="text-xs text-luxe-silver mb-1">In diesem Paket:</p>
                                  {packItems.length > 0 ? (
                                    <ul className="text-xs text-white space-y-0.5 list-disc list-inside">
                                      {packItems.map((i, idx) => (
                                        <li key={idx}>
                                          {i.quantity}× {i.product_name}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-xs text-luxe-silver/80">Noch keine Zuordnung.</p>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        : order.tracking_number && (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-white font-mono font-semibold text-sm">{order.tracking_number}</span>
                              <a
                                href={getTrackingUrl(order.tracking_carrier || 'DHL', order.tracking_number)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray hover:bg-luxe-gray/80 text-white text-sm border border-luxe-silver/50"
                              >
                                Sendung verfolgen →
                              </a>
                            </div>
                          )}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-luxe-gray">
                  <p className="text-xs text-luxe-silver mb-3">
                    Inkl. MwSt. | Bestellnummer: {order.order_number}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`/api/account/orders/${order.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray hover:bg-luxe-gray/80 text-white text-sm border border-luxe-silver/50"
                    >
                      <FileText className="w-4 h-4" />
                      Rechnung (PDF) herunterladen
                    </a>
                    {order.invoice_xml_url && (
                      <a
                        href={`/api/account/orders/${order.id}/invoice?format=xml`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray hover:bg-luxe-gray/80 text-white text-sm border border-luxe-silver/50"
                      >
                        <FileText className="w-4 h-4" />
                        XRechnung (XML) herunterladen
                      </a>
                    )}
                    <Link
                      href={`/contact?order_number=${encodeURIComponent(order.order_number)}&subject=${encodeURIComponent(`Frage zu Bestellung #${order.order_number}`)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray hover:bg-luxe-gray/80 text-white text-sm border border-luxe-silver/50"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Anfrage zu dieser Bestellung
                    </Link>
                    {cancellationRequested && (
                      <p className="text-sm text-luxe-silver italic">
                        {order.cancellation_request_status === 'approved' && 'Stornierung angenommen.'}
                        {order.cancellation_request_status === 'rejected' && 'Stornierung abgelehnt.'}
                        {(!order.cancellation_request_status || order.cancellation_request_status === 'pending') && 'Stornierung angefragt – wir bearbeiten deine Anfrage.'}
                      </p>
                    )}
                    {canRequestCancel && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => handleOpenCancelRequest()}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        {hasPendingCancellation ? 'Weitere Artikel stornieren' : 'Stornierung anfragen'}
                      </Button>
                    )}
                    {returnRequested && (
                      <div className="space-y-2">
                        <p className="text-sm text-luxe-silver italic">
                          {order.return_request_status === 'approved' && 'Rücksendung angenommen.'}
                          {order.return_request_status === 'rejected' && 'Rücksendung abgelehnt.'}
                          {(!order.return_request_status || order.return_request_status === 'pending') && 'Rücksendung angefragt – wir melden uns mit den nächsten Schritten.'}
                        </p>
                        {order.return_request_status === 'approved' && (
                          <div className="p-3 bg-luxe-gray/80 rounded-lg border border-luxe-silver/30 text-sm space-y-2">
                            {(() => {
                              const hasValidReturnCode = !!(returnLabelRetNumber || order.return_shipping_code)
                              if (!hasValidReturnCode) {
                                return (
                                  <>
                                    <p className="text-luxe-silver">
                                      Du erhältst in Kürze eine E-Mail mit dem Retourencode und allen Details. Bitte sende das Paket erst zurück, wenn du den Code erhalten hast – ein falsches Label würde die Rücksendung verzögern.
                                    </p>
                                    {approvedReturnItems.some((i) => i.admin_status === 'not_refundable') && (
                                      <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                        <p className="text-amber-200 text-sm font-medium mb-1">Folgende Artikel werden nicht erstattet:</p>
                                        <ul className="list-disc list-inside text-luxe-silver text-sm space-y-0.5 mb-2">
                                          {approvedReturnItems.filter((i) => i.admin_status === 'not_refundable').map((i, idx) => (
                                            <li key={`excl-${idx}`}>{i.product_name}{i.requested_quantity > 1 ? ` (${i.requested_quantity} Stk.)` : ''}</li>
                                          ))}
                                        </ul>
                                        <Link
                                          href={`/contact?order_number=${encodeURIComponent(order.order_number)}&subject=${encodeURIComponent('Frage zur Rücksendung – Artikel nicht erstattet')}&message=${encodeURIComponent(`Hallo,\n\nich habe eine Frage zu folgenden Artikeln aus Bestellung #${order.order_number}, die nicht erstattet werden:\n${approvedReturnItems.filter((i) => i.admin_status === 'not_refundable').map((i) => `- ${i.product_name}${i.requested_quantity > 1 ? ` (${i.requested_quantity} Stk.)` : ''}`).join('\n')}\n\n`)}`}
                                          className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium"
                                        >
                                          <MessageSquare className="w-4 h-4" />
                                          Zu diesen Artikeln Kontakt aufnehmen
                                        </Link>
                                      </div>
                                    )}
                                  </>
                                )
                              }
                              return null
                            })()}
                            {!!(returnLabelRetNumber || order.return_shipping_code) && (
                              <>
                            {approvedReturnItems.length > 0 && (
                              <div className="mb-3 p-3 rounded-lg bg-luxe-black/40 border border-luxe-silver/20">
                                <p className="font-mono text-luxe-gold font-semibold text-base">Retourencode: {returnLabelRetNumber || order.return_shipping_code}</p>
                                <p className="text-xs text-luxe-silver/80 mt-1 mb-2">Zu diesem Retourenschein gehören folgende Artikel (gemeinsam zurücksenden):</p>
                                <ul className="list-disc list-inside space-y-0.5 text-white text-sm">
                                  {approvedReturnItems.map((i, idx) => (
                                    <li key={`${i.product_name}-${idx}`}>{i.product_name}{i.requested_quantity > 1 ? ` (${i.requested_quantity} Stk.)` : ''}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {order.return_method_preference === 'qr_code' ? (
                              returnLabelQr ? (
                                <div className="space-y-1">
                                  <p className="text-luxe-silver font-medium">DHL Retouren-QR (druckerlose Retoure)</p>
                                  <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <img src={`data:image/png;base64,${returnLabelQr}`} alt="DHL Retouren-QR" className="w-40 h-40 object-contain bg-white rounded-lg p-2" />
                                    <div>
                                      <p className="text-white text-xs mb-1">Zeige diesen QR-Code bei DHL/Paketshop – das Label wird dort gedruckt.</p>
                                      <p className="font-mono text-luxe-gold text-sm mt-2">RET-Nummer: {returnLabelRetNumber || order.return_shipping_code}</p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    setLoadingReturnLabel(true)
                                    try {
                                      const res = await fetch(`/api/account/orders/${params.id}/return-label`)
                                      const data = await res.json().catch(() => ({}))
                                      if (res.ok && data.qr_label_base64) {
                                        setReturnLabelQr(data.qr_label_base64)
                                        setReturnLabelRetNumber(data.ret_number ?? null)
                                      } else {
                                        toast({ title: data.error || 'QR-Code noch nicht verfügbar', variant: 'destructive' })
                                      }
                                    } finally {
                                      setLoadingReturnLabel(false)
                                    }
                                  }}
                                  disabled={loadingReturnLabel}
                                  className="text-luxe-gold hover:underline text-sm"
                                >
                                  {loadingReturnLabel ? 'Wird geladen…' : 'DHL Retouren-QR abrufen (druckerlose Retoure)'}
                                </button>
                              )
                            ) : (
                              <p className="text-white">
                                <span className="text-luxe-silver">Versandcode zum Ausdrucken:</span>{' '}
                                <span className="font-mono text-luxe-gold">{order.return_shipping_code}</span>
                              </p>
                            )}
                            {(order.return_shipping_options?.length ?? 0) > 0 ? (
                              order.return_shipping_options!.length === 1 ? (
                                <p className="text-luxe-silver">
                                  Bitte mit <strong className="text-white">{getCarrierLabel(order.return_shipping_options![0].carrier)}</strong> zurücksenden.
                                  {order.return_shipping_options![0].price_cents > 0 && (
                                    <> {formatReturnOptionPrice(order.return_shipping_options![0].price_cents)} werden von der Erstattung abgezogen.</>
                                  )}
                                </p>
                              ) : (
                                <p className="text-luxe-silver">
                                  Du kannst wählen: {order.return_shipping_options!.map((o) => `${getCarrierLabel(o.carrier)} ${formatReturnOptionPrice(o.price_cents)}`).join(', ')} (von Erstattung abziehbar).
                                </p>
                              )
                            ) : (order.return_shipping_deduction_cents ?? 0) > 0 ? (
                              <p className="text-luxe-silver">
                                Rücksendekosten {formatPrice(order.return_shipping_deduction_cents! / 100)} werden von der Erstattung abgezogen.
                              </p>
                            ) : null}
                            {approvedReturnItems.some((i) => i.admin_status === 'not_refundable') && (
                              <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <p className="text-amber-200 text-sm font-medium mb-1">Folgende Artikel wurden nicht erstattet:</p>
                                <ul className="list-disc list-inside text-luxe-silver text-sm space-y-0.5 mb-2">
                                  {approvedReturnItems.filter((i) => i.admin_status === 'not_refundable').map((i, idx) => (
                                    <li key={`excl-${idx}`}>{i.product_name}{i.requested_quantity > 1 ? ` (${i.requested_quantity} Stk.)` : ''}</li>
                                  ))}
                                </ul>
                                <Link
                                  href={`/contact?order_number=${encodeURIComponent(order.order_number)}&subject=${encodeURIComponent('Frage zur Rücksendung – Artikel nicht erstattet')}&message=${encodeURIComponent(`Hallo,\n\nich habe eine Frage zu folgenden Artikeln aus Bestellung #${order.order_number}, die nicht erstattet wurden:\n${approvedReturnItems.filter((i) => i.admin_status === 'not_refundable').map((i) => `- ${i.product_name}${i.requested_quantity > 1 ? ` (${i.requested_quantity} Stk.)` : ''}`).join('\n')}\n\n`)}`}
                                  className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  Zu diesen Artikeln Kontakt aufnehmen
                                </Link>
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="border-luxe-gold/50 text-luxe-gold hover:bg-luxe-gold/10 mt-2"
                              onClick={async () => {
                                const hasQr = order.return_method_preference === 'qr_code' && returnLabelQr
                                const code = returnLabelRetNumber || order.return_shipping_code || ''
                                const preferred = order.return_carrier_preference?.trim().toLowerCase()
                                const carrierLabel = preferred ? getCarrierLabel(preferred) : ((order.return_shipping_options?.length ?? 0) > 0 ? getCarrierLabel(order.return_shipping_options![0].carrier) : 'DHL')
                                const productsHtml = approvedReturnItems.length > 0 && code
                                  ? `<p style="margin:1rem 0;"><strong>Retourencode:</strong> <span style="font-family:monospace;font-weight:bold;">${code}</span></p><p style="margin:0.5rem 0;"><strong>Artikel (gemeinsam zurücksenden):</strong></p><ul style="margin:0.5rem 0 1rem 1.5rem;">${approvedReturnItems.map((i) => `<li>${i.product_name}${i.requested_quantity > 1 ? ` (${i.requested_quantity} Stk.)` : ''}</li>`).join('')}</ul>`
                                  : approvedReturnItems.length > 0 ? `<p><strong>Artikel:</strong> ${approvedReturnItems.map((i) => `${i.product_name}${i.requested_quantity > 1 ? ` (${i.requested_quantity} Stk.)` : ''}`).join(', ')}</p>` : ''
                                const qrImg = hasQr ? `<img src="data:image/png;base64,${returnLabelQr}" alt="Retouren-QR" style="width:180px;height:180px;margin:1rem 0;" />` : ''
                                let addressBlock = ''
                                try {
                                  const res = await fetch(`/api/account/orders/${params.id}/return-print-data`)
                                  if (res.ok) {
                                    const data = await res.json()
                                    const sender = (data.senderLines ?? []).join('<br />')
                                    const recipient = (data.recipientLines ?? []).join('<br />')
                                    if (sender || recipient) {
                                      addressBlock = `<div style="margin:1rem 0;display:flex;gap:2rem;flex-wrap:wrap;"><div><strong>Absender (du):</strong><br />${sender}</div><div><strong>Empfänger (Rücksendeadresse):</strong><br />${recipient}</div></div>`
                                    }
                                  }
                                } catch {
                                  /* ignore */
                                }
                                const w = window.open('', '_blank')
                                if (!w) return
                                w.document.write(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Retourenlabel – Bestellung ${order.order_number}</title>
<style>body{font-family:sans-serif;padding:2rem;max-width:450px;margin:0 auto;} h1{font-size:1.25rem;} .code{font-family:monospace;font-size:1.25rem;font-weight:bold;margin:0.5rem 0;} p{margin:0.5rem 0;}</style>
</head><body>
<h1>Retourenlabel – Bestellung #${order.order_number}</h1>
${addressBlock}
${productsHtml}
${qrImg ? `<p><strong>${carrierLabel} Retouren-QR</strong> – Zeige bei ${carrierLabel}/Paketshop vor</p>` : ''}
${code ? `<p><strong>RET-Nummer / Versandcode:</strong></p><p class="code">${code}</p>` : ''}
<p><strong>Versanddienstleister:</strong> ${carrierLabel}</p>
<p style="margin-top:1.5rem;font-size:0.9rem;color:#666;">Paket gut verpacken, zu ${carrierLabel} bringen und ${hasQr ? 'QR-Code' : 'Retourencode'} vorzeigen.</p>
</body></html>`)
                                w.document.close()
                                w.focus()
                                w.print()
                                w.close()
                              }}
                            >
                              <Printer className="w-4 h-4 mr-2" />
                              Retoure drucken
                            </Button>
                            </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {canRequestReturn && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                        onClick={() => handleOpenReturnRequest()}
                      >
                        <Undo2 className="w-4 h-4 mr-2" />
                        {hasPendingReturn ? 'Weitere Artikel retournieren' : 'Rücksendung anfragen'}
                      </Button>
                    )}
                    {canRequestA2z && (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-luxe-gold/50 text-luxe-gold hover:bg-luxe-gold/10"
                        onClick={() => setA2zDialogOpen(true)}
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        A-bis-z-Garantie beantragen
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <Dialog open={cancelRequestDialogOpen} onOpenChange={setCancelRequestDialogOpen}>
      <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{hasPendingCancellation ? 'Weitere Artikel zur Stornierung hinzufügen' : 'Stornierung anfragen'}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-luxe-silver">
          Du kannst keinen direkten Storno auslösen. Wir bearbeiten deine Anfrage und melden uns bei dir. Ein Grund ist optional.
        </p>
        <div className="grid gap-4 py-4">
          {orderItems.length > 0 && (
            <div>
              <Label className="text-luxe-silver">Wie viele Stück pro Artikel stornieren?</Label>
              <p className="text-xs text-luxe-silver/80 mt-0.5">Gib 0 ein, wenn der Artikel nicht betroffen ist.</p>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {orderItems.map((item) => {
                  const maxQty = Math.max(0, item.quantity - (item.cancelled_quantity ?? 0))
                  if (maxQty === 0) return null
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white flex-1">{item.quantity > 1 ? `${item.quantity}× ` : ''}{item.product_name}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={maxQty}
                          value={cancelRequestQuantities[item.id] ?? 0}
                          onChange={(e) => setCancelRequestQuantities((prev) => ({ ...prev, [item.id]: Math.max(0, Math.min(maxQty, parseInt(e.target.value, 10) || 0)) }))}
                          className="w-14 px-2 py-1 bg-luxe-gray border border-luxe-silver rounded text-white text-sm text-right"
                        />
                        <span className="text-luxe-silver text-sm">von {maxQty}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          <div>
            <Label className="text-luxe-silver">Grund (optional)</Label>
            <Select value={cancelRequestReason || '_leer'} onValueChange={(v) => setCancelRequestReason(v === '_leer' ? '' : v)}>
              <SelectTrigger className="bg-luxe-gray border-luxe-silver text-white mt-1">
                <SelectValue placeholder="Bitte wählen oder leer lassen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_leer" className="text-white focus:bg-luxe-gray">Kein Grund angegeben</SelectItem>
                {CANCELLATION_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-white focus:bg-luxe-gray">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {cancelRequestReason === 'sonstiges' && (
            <div>
              <Label className="text-luxe-silver">Sonstiges – deine Angabe (optional)</Label>
              <Textarea
                value={cancelRequestReasonOther}
                onChange={(e) => setCancelRequestReasonOther(e.target.value)}
                placeholder="z. B. kurze Erklärung"
                className="bg-luxe-gray border-luxe-silver text-white mt-1 min-h-[80px]"
                maxLength={1000}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setCancelRequestDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
          <Button onClick={handleSubmitCancelRequest} disabled={isSubmittingCancelRequest} className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90">
            {isSubmittingCancelRequest ? 'Wird gesendet…' : hasPendingCancellation ? 'Artikel hinzufügen' : 'Anfrage absenden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={a2zDialogOpen} onOpenChange={setA2zDialogOpen}>
      <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
        <DialogHeader>
          <DialogTitle>A-bis-z-Garantie beantragen</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-luxe-silver">
          Du kannst einen Anspruch unter der A-bis-z-Garantie geltend machen, wenn z. B. die Ware nicht angekommen ist, erheblich abweicht oder eine Erstattung verweigert wurde.
        </p>
        <div className="grid gap-4 py-4">
          <div>
            <Label className="text-luxe-silver">Grund <span className="text-red-400">*</span></Label>
            <Select value={a2zReason} onValueChange={setA2zReason}>
              <SelectTrigger className="bg-luxe-gray border-luxe-silver text-white mt-1">
                <SelectValue placeholder="Bitte wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ITEM_NOT_RECEIVED" className="text-white focus:bg-luxe-gray">Nicht erhalten</SelectItem>
                <SelectItem value="MATERIALLY_DIFFERENT" className="text-white focus:bg-luxe-gray">Erheblich abweichend</SelectItem>
                <SelectItem value="REFUND_NOT_ISSUED" className="text-white focus:bg-luxe-gray">Erstattung verweigert</SelectItem>
                <SelectItem value="OTHER" className="text-white focus:bg-luxe-gray">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-luxe-silver">Beschreibung (optional)</Label>
            <Textarea
              value={a2zDescription}
              onChange={(e) => setA2zDescription(e.target.value)}
              placeholder="Kurze Schilderung des Sachverhalts"
              className="bg-luxe-gray border-luxe-silver text-white mt-1 min-h-[80px]"
              maxLength={2000}
            />
          </div>
          <p className="text-xs text-luxe-silver">
            Anspruchsbetrag: {formatPrice(order?.total ?? 0)}
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setA2zDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
          <Button onClick={handleSubmitA2z} disabled={isSubmittingA2z || !a2zReason} className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90">
            {isSubmittingA2z ? 'Wird gesendet…' : 'Anspruch einreichen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={returnRequestDialogOpen} onOpenChange={setReturnRequestDialogOpen}>
      <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{hasPendingReturn ? 'Weitere Artikel zur Rücksendung hinzufügen' : 'Rücksendung anfragen'}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-luxe-silver">
          {hasPendingReturn ? 'Wähle zusätzliche Artikel, die du zur Rücksendung hinzufügen möchtest.' : 'Bevor du die Rücksendung absendest: Wähle die Artikel, den Versanddienstleister und wie du die Retoure verschicken möchtest (gedruckter Code oder QR-Code). Du erhältst entsprechend den passenden Retourencode.'}
        </p>
        <div className="grid gap-4 py-4">
          {orderItems.length > 0 && (
            <div>
              <Label className="text-luxe-silver">1. Welche Artikel möchtest du zurücksenden?</Label>
              <p className="text-xs text-luxe-silver/80 mt-0.5">Gib 0 ein, wenn der Artikel nicht betroffen ist.</p>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {orderItems.map((item) => {
                  const maxQty = Math.max(0, item.quantity - (item.returned_quantity ?? 0))
                  if (maxQty === 0) return null
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white flex-1">{item.quantity > 1 ? `${item.quantity}× ` : ''}{item.product_name}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={maxQty}
                          value={returnRequestQuantities[item.id] ?? 0}
                          onChange={(e) => setReturnRequestQuantities((prev) => ({ ...prev, [item.id]: Math.max(0, Math.min(maxQty, parseInt(e.target.value, 10) || 0)) }))}
                          className="w-14 px-2 py-1 bg-luxe-gray border border-luxe-silver rounded text-white text-sm text-right"
                        />
                        <span className="text-luxe-silver text-sm">von {maxQty}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {!hasPendingReturn && (
          <div>
            <Label className="text-luxe-silver">2. Mit welchem Versanddienstleister möchtest du zurücksenden? <span className="text-red-400">*</span></Label>
            {returnCarrierOptions.length === 0 ? (
              <p className="text-xs text-luxe-silver/80 mt-1">Lade Optionen…</p>
            ) : (
              <div className="mt-2 space-y-2">
                {returnCarrierOptions.map((c) => (
                  <label key={c.value} className="flex items-center gap-3 cursor-pointer rounded-lg border border-luxe-gray p-3 hover:bg-luxe-gray/50 has-[:checked]:border-luxe-gold has-[:checked]:bg-luxe-gold/10">
                    <input
                      type="radio"
                      name="preferredCarrier"
                      value={c.value}
                      checked={preferredCarrier === c.value}
                      onChange={() => {
                        setPreferredCarrier(c.value)
                        if (!carrierSupportsQr(c.value)) setReturnMethodPreference('printed_code')
                      }}
                      className="text-luxe-gold focus:ring-luxe-gold"
                    />
                    <span className="text-white">{c.label}</span>
                    <span className="text-luxe-silver text-sm ml-auto">
                      {formatReturnOptionPrice(c.price_cents)} von Erstattung abgezogen
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          )}
          {!hasPendingReturn && (
          <div>
            <Label className="text-luxe-silver">3. Wie möchtest du die Retoure verschicken? <span className="text-red-400">*</span></Label>
            {carrierSupportsQr(preferredCarrier) ? (
              <>
                <p className="text-xs text-luxe-silver/80 mt-0.5">Du erhältst den passenden Retourencode von uns.</p>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-luxe-gray p-3 hover:bg-luxe-gray/50 has-[:checked]:border-luxe-gold has-[:checked]:bg-luxe-gold/10">
                    <input
                      type="radio"
                      name="returnMethodPreference"
                      value="printed_code"
                      checked={returnMethodPreference === 'printed_code'}
                      onChange={() => setReturnMethodPreference('printed_code')}
                      className="text-luxe-gold focus:ring-luxe-gold"
                    />
                    <span className="text-white">Gedruckter Retourencode (z.B. Barcode zum Aufkleben)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-luxe-gray p-3 hover:bg-luxe-gray/50 has-[:checked]:border-luxe-gold has-[:checked]:bg-luxe-gold/10">
                    <input
                      type="radio"
                      name="returnMethodPreference"
                      value="qr_code"
                      checked={returnMethodPreference === 'qr_code'}
                      onChange={() => setReturnMethodPreference('qr_code')}
                      className="text-luxe-gold focus:ring-luxe-gold"
                    />
                    <span className="text-white">QR-Code (am Paketshop scannen)</span>
                  </label>
                </div>
              </>
            ) : preferredCarrier ? (
              <p className="text-xs text-luxe-silver/80 mt-0.5">
                Bei {getCarrierLabel(preferredCarrier)} ist nur ein gedruckter Retourencode möglich (kein QR-Code am Paketshop). Du erhältst den Code zum Ausdrucken.
              </p>
            ) : (
              <p className="text-xs text-luxe-silver/80 mt-0.5">Bitte zuerst einen Versanddienstleister wählen.</p>
            )}
          </div>
          )}
          <div>
            <Label className="text-luxe-silver">Grund (optional)</Label>
            <Select value={returnRequestReason || '_leer'} onValueChange={(v) => setReturnRequestReason(v === '_leer' ? '' : v)}>
              <SelectTrigger className="bg-luxe-gray border-luxe-silver text-white mt-1">
                <SelectValue placeholder="Bitte wählen oder leer lassen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_leer" className="text-white focus:bg-luxe-gray">Kein Grund angegeben</SelectItem>
                {RETURN_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="text-white focus:bg-luxe-gray">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {returnRequestReason === 'sonstiges' && (
            <div>
              <Label className="text-luxe-silver">Sonstiges – deine Angabe (optional)</Label>
              <Textarea
                value={returnRequestReasonOther}
                onChange={(e) => setReturnRequestReasonOther(e.target.value)}
                placeholder="z. B. kurze Erklärung"
                className="bg-luxe-gray border-luxe-silver text-white mt-1 min-h-[80px]"
                maxLength={1000}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setReturnRequestDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
          <Button onClick={handleSubmitReturnRequest} disabled={isSubmittingReturnRequest} className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90">
            {isSubmittingReturnRequest ? 'Wird gesendet…' : hasPendingReturn ? 'Artikel hinzufügen' : 'Anfrage absenden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}
