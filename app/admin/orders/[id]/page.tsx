'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Mail, Phone, Calendar, User, Truck, RefreshCw, UserCheck, Send, History, MessageSquare, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react'
import { getTrackingUrl } from '@/lib/tracking-urls'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils'
import { RETURN_SHIPPING_CARRIERS, getCarrierLabel, formatReturnOptionPrice, carrierSupportsQr } from '@/lib/return-shipping-carriers'
import { supabase } from '@/lib/supabase'
import { CANCELLATION_REASONS } from '@/lib/cancellation-reasons'
import { RETURN_REASONS } from '@/lib/return-reasons'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'

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
  order_id: string
  tracking_number: string
  tracking_carrier: string | null
  created_at?: string
  shipped_at?: string
  delivered_at?: string
  label_url?: string
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
  tracking_number?: string | null
  tracking_carrier?: string | null
  assigned_to_email?: string | null
  assigned_at?: string | null
  processing_status?: string | null
  processing_notes?: string | null
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

export default function AdminOrderDetailPage() {
  const params = useParams()
  const orderId = (typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '') ?? ''
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [itemsByShipment, setItemsByShipment] = useState<Record<string, { order_item_id: string; quantity: number; product_name: string }[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [trackingInput, setTrackingInput] = useState('')
  const [newShipmentItems, setNewShipmentItems] = useState<Record<string, number>>({})
  const [editingShipmentContent, setEditingShipmentContent] = useState<string | null>(null)
  const [shipmentContentQuantities, setShipmentContentQuantities] = useState<Record<string, number>>({})
  const shipmentContentQuantitiesRef = useRef<Record<string, number>>({})
  const [savingShipmentContent, setSavingShipmentContent] = useState(false)
  const [trackingCarrier, setTrackingCarrier] = useState('DHL')
  const [savingTracking, setSavingTracking] = useState(false)
  const [labelCarrier, setLabelCarrier] = useState<'DHL' | 'DPD' | 'GLS' | 'Hermes' | 'UPS'>('DHL')
  const [creatingLabel, setCreatingLabel] = useState(false)
  const [creatingDhlReturnLabel, setCreatingDhlReturnLabel] = useState(false)
  const [sendingShippingEmail, setSendingShippingEmail] = useState(false)
  const [syncingPayment, setSyncingPayment] = useState(false)
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [updatingAssignment, setUpdatingAssignment] = useState(false)
  const [savingProcessing, setSavingProcessing] = useState(false)
  const [processingStatusInput, setProcessingStatusInput] = useState('')
  const [processingNotesInput, setProcessingNotesInput] = useState('')
  const [requestItems, setRequestItems] = useState<{
    cancellation: { order_item_id: string; product_name: string; quantity?: number; requested_quantity?: number | null; admin_status?: string | null; admin_note?: string | null }[]
    return: { order_item_id: string; product_name: string; quantity?: number; requested_quantity?: number | null; admin_status?: string | null; admin_note?: string | null }[]
  }>({ cancellation: [], return: [] })
  const [respondingCancel, setRespondingCancel] = useState(false)
  const [respondingReturn, setRespondingReturn] = useState(false)
  const [approveReturnDialogOpen, setApproveReturnDialogOpen] = useState(false)
  const [returnShippingCode, setReturnShippingCode] = useState('')
  const [returnShippingDeductionEur, setReturnShippingDeductionEur] = useState('')
  const [returnCarrierMode, setReturnCarrierMode] = useState<'fixed' | 'customer_choice'>('fixed')
  const [returnShippingOptionsList, setReturnShippingOptionsList] = useState<{ carrier: string; priceEur: string }[]>([{ carrier: 'dhl', priceEur: '4,99' }])
  const [approveCancelDialogOpen, setApproveCancelDialogOpen] = useState(false)
  const [cancelItemStatus, setCancelItemStatus] = useState<Record<string, 'approved' | 'not_refundable'>>({})
  const [cancelItemNote, setCancelItemNote] = useState<Record<string, string>>({})
  const [returnItemStatus, setReturnItemStatus] = useState<Record<string, 'approved' | 'not_refundable'>>({})
  const [returnItemNote, setReturnItemNote] = useState<Record<string, string>>({})
  const [rejectCancelDialogOpen, setRejectCancelDialogOpen] = useState(false)
  const [rejectCancelReason, setRejectCancelReason] = useState('')
  const [rejectReturnDialogOpen, setRejectReturnDialogOpen] = useState(false)
  const [rejectReturnReason, setRejectReturnReason] = useState('')
  const [markingReturnReceived, setMarkingReturnReceived] = useState(false)
  const [supplierSubmitted, setSupplierSubmitted] = useState<boolean | null>(null)
  const [submittingToSuppliers, setSubmittingToSuppliers] = useState(false)
  const [processReturnDialogOpen, setProcessReturnDialogOpen] = useState(false)
  const [processReturnAmount, setProcessReturnAmount] = useState('')
  const [processReturnBreakdown, setProcessReturnBreakdown] = useState<{
    amountWithoutShipping: number
    returnShippingCents: number
    restockingFeeCents: number
    carrierLabel: string
  } | null>(null)
  const [processReturnRestoreStock, setProcessReturnRestoreStock] = useState(true)
  const [processingReturn, setProcessingReturn] = useState(false)
  const [returnInspection, setReturnInspection] = useState<{ condition_code?: string | null; restocking_fee_cents?: number; notes?: string | null } | null>(null)
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false)
  const [inspectionCondition, setInspectionCondition] = useState<string>('')
  const [inspectionRestockingEur, setInspectionRestockingEur] = useState('')
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [inspectionSaving, setInspectionSaving] = useState(false)
  const [lastCreditNoteFilename, setLastCreditNoteFilename] = useState<string | null>(null)
  const [auditEntries, setAuditEntries] = useState<{ id: string; field_name: string | null; old_value: string | null; new_value: string | null; changed_by_email: string | null; created_at: string }[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [linkedInquiries, setLinkedInquiries] = useState<{ id: string; subject: string; status: string; created_at: string }[]>([])
  const [assignableStaff, setAssignableStaff] = useState<{ id: string; email: string; displayName: string }[]>([])
  const [processingExpanded, setProcessingExpanded] = useState(false)
  const [auditExpanded, setAuditExpanded] = useState(false)
  const [inquiriesExpanded, setInquiriesExpanded] = useState(true)
  const [fulfillmentRoutes, setFulfillmentRoutes] = useState<{
    routes: { order_line_id: string; shipped_by_label: string; fulfillment_type: string; subtotal: number }[]
    shopFulfilledCount: number
    vendorFulfilledCount: number
    fbaCount: number
  } | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (orderId) loadOrder()
    else setIsLoading(false)
  }, [orderId])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserEmail(user?.email ?? null))
  }, [])

  useEffect(() => {
    fetch('/api/admin/orders/assignable-staff')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAssignableStaff(Array.isArray(data) ? data : []))
      .catch(() => setAssignableStaff([]))
  }, [])

  useEffect(() => {
    if (editingShipmentContent) shipmentContentQuantitiesRef.current = { ...shipmentContentQuantities }
  }, [editingShipmentContent, shipmentContentQuantities])

  const loadLinkedInquiries = async () => {
    if (!orderId) return
    try {
      const res = await fetch(`/api/admin/inquiries?order_id=${encodeURIComponent(orderId)}`)
      const data = await res.ok ? res.json() : []
      setLinkedInquiries(Array.isArray(data) ? data : [])
    } catch {
      setLinkedInquiries([])
    }
  }

  const loadAudit = async () => {
    if (!orderId) return
    setAuditLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/audit`)
      const data = await res.ok ? res.json() : []
      setAuditEntries(Array.isArray(data) ? data : [])
    } catch {
      setAuditEntries([])
    } finally {
      setAuditLoading(false)
    }
  }

  useEffect(() => {
    if (orderId) loadAudit()
  }, [orderId])

  const loadOrder = async () => {
    if (!orderId) return
    try {
      // Load order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !orderData) {
        toast({
          title: 'Bestellung nicht gefunden',
          variant: 'destructive',
        })
        router.push('/admin/orders')
        return
      }

      setOrder(orderData)
      setProcessingStatusInput(orderData.processing_status ?? '')
      setProcessingNotesInput(orderData.processing_notes ?? '')
      setTrackingCarrier(orderData.tracking_carrier || 'DHL')

      // Load order items via Admin-API (Service-Role), damit IDs = DB-IDs für Paketinhalt-Speichern
      try {
        const itemsRes = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/order-items`)
        const itemsData = itemsRes.ok ? await itemsRes.json() : []
        setOrderItems(Array.isArray(itemsData) ? itemsData : [])
      } catch {
        setOrderItems([])
      }

      // Sendungen + Paketinhalt aus Admin-API (Service-Role); Fallback: nur Sendungen, dann Paketinhalt leer
      try {
        const itemsRes = await fetch(`/api/admin/orders/${orderId}/shipment-items`, { cache: 'no-store' })
        if (itemsRes.ok) {
          const { shipments: apiShipments, itemsByShipment: loadedItems } = await itemsRes.json()
          const shipmentsList = Array.isArray(apiShipments) ? apiShipments : []
          setShipments(shipmentsList)
          setItemsByShipment(loadedItems && typeof loadedItems === 'object' ? loadedItems : {})
          if (shipmentsList.length === 0) {
            const shipRes = await fetch(`/api/admin/orders/${orderId}/shipments`, { cache: 'no-store' })
            if (shipRes.ok) {
              const { shipments: fallbackShipments } = await shipRes.json()
              if (Array.isArray(fallbackShipments) && fallbackShipments.length > 0) {
                setShipments(fallbackShipments)
              }
            }
          }
        } else {
          const shipRes = await fetch(`/api/admin/orders/${orderId}/shipments`, { cache: 'no-store' })
          if (shipRes.ok) {
            const { shipments: apiShipments } = await shipRes.json()
            setShipments(Array.isArray(apiShipments) ? apiShipments : [])
          } else {
            const { data: shipmentsData } = await supabase.from('order_shipments').select('*').eq('order_id', orderId).order('created_at', { ascending: true })
            setShipments(shipmentsData || [])
          }
          setItemsByShipment({})
        }
      } catch {
        try {
          const shipRes = await fetch(`/api/admin/orders/${orderId}/shipments`, { cache: 'no-store' })
          if (shipRes.ok) {
            const { shipments: apiShipments } = await shipRes.json()
            setShipments(Array.isArray(apiShipments) ? apiShipments : [])
          } else {
            const { data: shipmentsData } = await supabase.from('order_shipments').select('*').eq('order_id', orderId).order('created_at', { ascending: true })
            setShipments(shipmentsData || [])
          }
        } catch {
          const { data: shipmentsData } = await supabase.from('order_shipments').select('*').eq('order_id', orderId).order('created_at', { ascending: true })
          setShipments(shipmentsData || [])
        }
        setItemsByShipment({})
      }

      if (orderData?.cancellation_requested_at || orderData?.return_requested_at) {
        try {
          const res = await fetch(`/api/admin/orders/${orderId}/request-items`)
          if (res.ok) {
            const data = await res.json()
            setRequestItems({ cancellation: data.cancellation ?? [], return: data.return ?? [] })
          }
        } catch {
          // ignore
        }
      }

      try {
        const statusRes = await fetch(`/api/admin/orders/${orderId}/supplier-status`)
        if (statusRes.ok) {
          const statusData = await statusRes.json()
          setSupplierSubmitted(statusData.supplier_submitted === true)
        }
      } catch {
        setSupplierSubmitted(null)
      }

      try {
        const routesRes = await fetch(`/api/admin/orders/${orderId}/fulfillment-routes`)
        if (routesRes.ok) {
          const routesData = await routesRes.json()
          setFulfillmentRoutes(routesData)
        } else {
          setFulfillmentRoutes(null)
        }
      } catch {
        setFulfillmentRoutes(null)
      }

      if (orderData?.return_request_status === 'approved') {
        try {
          const inspRes = await fetch(`/api/admin/orders/${orderId}/return-inspection`)
          if (inspRes.ok) {
            const insp = await inspRes.json()
            setReturnInspection(insp || null)
          } else {
            setReturnInspection(null)
          }
        } catch {
          setReturnInspection(null)
        }
      } else {
        setReturnInspection(null)
      }

      loadAudit()
      loadLinkedInquiries()
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openApproveCancelDialog = () => {
    const init: Record<string, 'approved' | 'not_refundable'> = {}
    const notes: Record<string, string> = {}
    requestItems.cancellation.forEach((i) => {
      init[i.order_item_id] = (i.admin_status === 'not_refundable' ? 'not_refundable' : 'approved') as 'approved' | 'not_refundable'
      notes[i.order_item_id] = i.admin_note ?? ''
    })
    setCancelItemStatus(init)
    setCancelItemNote(notes)
    setApproveCancelDialogOpen(true)
  }

  const submitApproveCancel = async () => {
    if (!orderId || !order) return
    const items = requestItems.cancellation.length > 0
      ? requestItems.cancellation.map((i) => ({
          order_item_id: i.order_item_id,
          admin_status: (cancelItemStatus[i.order_item_id] ?? 'approved') as 'approved' | 'not_refundable',
          admin_note: (cancelItemNote[i.order_item_id] ?? '').trim() || undefined,
        }))
      : undefined
    setRespondingCancel(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', items }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Stornierung angenommen', description: 'Der Kunde erhält eine E-Mail.' })
      setApproveCancelDialogOpen(false)
      loadOrder()
    } finally {
      setRespondingCancel(false)
    }
  }

  const respondToCancelRequest = async (action: 'approve' | 'reject', rejectReason?: string) => {
    if (!orderId || !order) return
    if (action === 'approve') {
      openApproveCancelDialog()
      return
    }
    setRespondingCancel(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancel-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', ...(rejectReason != null && { reject_reason: rejectReason }) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Stornierung abgelehnt', description: 'Der Kunde erhält eine E-Mail.' })
      setRejectCancelDialogOpen(false)
      setRejectCancelReason('')
      loadOrder()
    } finally {
      setRespondingCancel(false)
    }
  }

  const submitRejectCancel = () => respondToCancelRequest('reject', rejectCancelReason || undefined)

  const submitRejectReturn = async () => {
    if (!orderId || !order) return
    setRespondingReturn(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/return-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reject_reason: rejectReturnReason || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Rücksendung abgelehnt', description: 'Der Kunde erhält eine E-Mail.' })
      setRejectReturnDialogOpen(false)
      setRejectReturnReason('')
      loadOrder()
    } finally {
      setRespondingReturn(false)
    }
  }

  const openApproveReturnDialog = async () => {
    setReturnShippingCode('')
    setReturnShippingDeductionEur('')
    setReturnCarrierMode('fixed')
    const init: Record<string, 'approved' | 'not_refundable'> = {}
    const notes: Record<string, string> = {}
    requestItems.return.forEach((i) => {
      init[i.order_item_id] = (i.admin_status === 'not_refundable' ? 'not_refundable' : 'approved') as 'approved' | 'not_refundable'
      notes[i.order_item_id] = i.admin_note ?? ''
    })
    setReturnItemStatus(init)
    setReturnItemNote(notes)
    const preferred = order?.return_carrier_preference?.trim().toLowerCase()
    if (preferred && RETURN_SHIPPING_CARRIERS.some((c) => c.value === preferred)) {
      try {
        const res = await fetch('/api/admin/settings/return-carrier-prices')
        if (res.ok) {
          const data = await res.json()
          const carriers = data.carriers ?? []
          const match = carriers.find((c: { value: string; price_cents: number }) => c.value === preferred)
          const priceEur = match && typeof match.price_cents === 'number' && match.price_cents >= 0
            ? (match.price_cents / 100).toFixed(2).replace('.', ',')
            : ''
          setReturnShippingOptionsList([{ carrier: preferred, priceEur }])
        } else {
          setReturnShippingOptionsList([{ carrier: preferred, priceEur: '' }])
        }
      } catch {
        setReturnShippingOptionsList([{ carrier: preferred, priceEur: '' }])
      }
    } else {
      setReturnShippingOptionsList([{ carrier: 'dhl', priceEur: '4,99' }])
    }
    setApproveReturnDialogOpen(true)
  }

  const addReturnShippingOption = () => {
    setReturnShippingOptionsList((prev) => [...prev, { carrier: 'dhl', priceEur: '' }])
  }
  const updateReturnShippingOption = (index: number, field: 'carrier' | 'priceEur', value: string) => {
    setReturnShippingOptionsList((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }
  const removeReturnShippingOption = (index: number) => {
    setReturnShippingOptionsList((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))
  }

  const returnRequestedItemIds = new Set((requestItems?.return ?? []).map((r) => r.order_item_id))
  const returnItemsNotYetReturned = orderItems.filter(
    (item) => returnRequestedItemIds.has(item.id) && item.item_status !== 'returned'
  )
  const canMarkReturnReceived =
    order?.return_request_status === 'approved' && returnRequestedItemIds.size > 0 && returnItemsNotYetReturned.length > 0

  const openInspectionDialog = () => {
    setInspectionCondition(returnInspection?.condition_code ?? '')
    setInspectionRestockingEur(returnInspection?.restocking_fee_cents != null ? (returnInspection.restocking_fee_cents / 100).toFixed(2).replace('.', ',') : '')
    setInspectionNotes(returnInspection?.notes ?? '')
    setInspectionDialogOpen(true)
  }

  const handleSaveInspection = async () => {
    if (!orderId) return
    const feeEur = inspectionRestockingEur.trim() ? parseFloat(inspectionRestockingEur.replace(',', '.')) : 0
    const restocking_fee_cents = Number.isFinite(feeEur) && feeEur >= 0 ? Math.round(feeEur * 100) : 0
    setInspectionSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/return-inspection`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition_code: inspectionCondition || null,
          restocking_fee_cents,
          notes: inspectionNotes.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Prüfung gespeichert' })
      setInspectionDialogOpen(false)
      loadOrder()
    } finally {
      setInspectionSaving(false)
    }
  }

  const handleMarkReturnReceived = async () => {
    if (!orderId) return
    setMarkingReturnReceived(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-return-received`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'Rücksendung eingegangen', description: 'Die betroffenen Artikel wurden auf "zurückgesendet" gesetzt.' })
      loadOrder()
    } finally {
      setMarkingReturnReceived(false)
    }
  }

  const handleCreateDhlReturnLabel = async () => {
    if (!orderId) return
    setCreatingDhlReturnLabel(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/dhl-return-label`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({ title: 'DHL QR-Retourenlabel erstellt', description: `RET-Nummer: ${data.ret_number}. Der Kunde kann den QR-Code unter "Mein Konto" abrufen.` })
      setReturnShippingCode(data.ret_number ?? returnShippingCode)
      loadOrder()
    } finally {
      setCreatingDhlReturnLabel(false)
    }
  }

  const openProcessReturnDialog = async () => {
    if (!order) return
    setLastCreditNoteFilename(null)
    const amountWithoutShipping = Math.max(0, (order.total ?? 0) - (order.shipping_cost ?? 0))
    let returnShippingCents = 0
    let carrierLabel = ''
    const preferred = order.return_carrier_preference?.trim().toLowerCase()

    if (preferred) {
      carrierLabel = getCarrierLabel(preferred)
      const fromOrder = order.return_shipping_options?.find(
        (o: { carrier: string }) => o.carrier?.toLowerCase() === preferred
      )
      if (fromOrder && typeof (fromOrder as { price_cents?: number }).price_cents === 'number') {
        returnShippingCents = (fromOrder as { price_cents: number }).price_cents
      } else {
        try {
          const res = await fetch('/api/admin/settings/return-carrier-prices')
          if (res.ok) {
            const data = await res.json()
            const carriers = data.carriers ?? []
            const match = carriers.find((c: { value: string; price_cents: number }) => c.value === preferred)
            if (match && typeof match.price_cents === 'number' && match.price_cents >= 0) {
              returnShippingCents = match.price_cents
            }
          }
        } catch {
          // leave 0
        }
      }
    }

    const restockingFeeCents = returnInspection?.restocking_fee_cents ?? 0
    const suggestedRefund = Math.max(0, amountWithoutShipping - returnShippingCents / 100 - restockingFeeCents / 100)
    setProcessReturnBreakdown(
      preferred || restockingFeeCents > 0
        ? { amountWithoutShipping, returnShippingCents, restockingFeeCents, carrierLabel: carrierLabel || (preferred ? getCarrierLabel(preferred) : '') || '–' }
        : null
    )
    setProcessReturnAmount(
      suggestedRefund > 0 ? suggestedRefund.toFixed(2).replace('.', ',') : String(amountWithoutShipping.toFixed(2)).replace('.', ',')
    )
    setProcessReturnDialogOpen(true)
  }

  const handleProcessReturn = async () => {
    if (!orderId) return
    const amount = processReturnAmount.trim() ? parseFloat(processReturnAmount.replace(',', '.')) : 0
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: 'Ungültiger Betrag', description: 'Bitte einen positiven Gutschriftbetrag eingeben.', variant: 'destructive' })
      return
    }
    setProcessingReturn(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/process-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_eur: amount, restore_stock: processReturnRestoreStock }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      setLastCreditNoteFilename(data.credit_note_filename ?? null)
      toast({
        title: 'Retoure abgewickelt',
        description: `Gutschrift ${amount.toFixed(2)} € gebucht. ${processReturnRestoreStock ? 'Lagerbestand wurde erhöht.' : ''}`,
      })
      if (data.credit_note_filename) {
        const url = `/api/admin/invoices/download?filename=${encodeURIComponent(data.credit_note_filename)}`
        const a = document.createElement('a')
        a.href = url
        a.download = data.credit_note_filename
        a.click()
      }
      loadOrder()
    } finally {
      setProcessingReturn(false)
    }
  }

  const submitApproveReturn = async () => {
    if (!orderId || !order) return
    const code = returnShippingCode.trim()
    if (!code) {
      toast({ title: 'Versandcode fehlt', description: 'Bitte Versandcode eingeben (wird dem Kunden per E-Mail geschickt).', variant: 'destructive' })
      return
    }
    const list = returnCarrierMode === 'fixed' ? returnShippingOptionsList.slice(0, 1) : returnShippingOptionsList
    const options = list.map((o) => {
      const eur = o.priceEur.trim() ? parseFloat(o.priceEur.replace(',', '.')) : 0
      const price_cents = Number.isFinite(eur) && eur >= 0 ? Math.round(eur * 100) : 0
      return { carrier: o.carrier, label: getCarrierLabel(o.carrier), price_cents }
    })
    if (options.length === 0) {
      toast({ title: 'Bitte mindestens eine Versandoption angeben', variant: 'destructive' })
      return
    }
    setRespondingReturn(true)
    try {
      const eur = returnShippingDeductionEur.trim() ? parseFloat(returnShippingDeductionEur.replace(',', '.')) : 0
      const deductionCents = Number.isFinite(eur) && eur >= 0 ? Math.round(eur * 100) : 0
      const items = requestItems.return.length > 0
        ? requestItems.return.map((i) => ({
            order_item_id: i.order_item_id,
            admin_status: (returnItemStatus[i.order_item_id] ?? 'approved') as 'approved' | 'not_refundable',
            admin_note: (returnItemNote[i.order_item_id] ?? '').trim() || undefined,
          }))
        : undefined
      const res = await fetch(`/api/admin/orders/${orderId}/return-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          return_shipping_code: code,
          return_shipping_deduction_cents: options.length > 0 ? null : (deductionCents > 0 ? deductionCents : null),
          return_shipping_options: options.length > 0 ? options : undefined,
          items,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      setApproveReturnDialogOpen(false)
      toast({
        title: 'Rücksendung angenommen',
        description: data.warning || 'Kunde erhält E-Mail mit Versandcode. Rücksendekosten werden von der Erstattung abgezogen.',
      })
      loadOrder()
    } finally {
      setRespondingReturn(false)
    }
  }

  const respondToReturnRequest = async (action: 'approve' | 'reject') => {
    if (!orderId || !order) return
    if (action === 'approve') {
      openApproveReturnDialog()
      return
    }
    setRejectReturnReason('')
    setRejectReturnDialogOpen(true)
  }

  const syncPaymentFromMollie = async () => {
    if (!orderId) return
    setSyncingPayment(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/sync-payment`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({
          title: 'Abgleich fehlgeschlagen',
          description: data.error || 'Unbekannter Fehler',
          variant: 'destructive',
        })
        return
      }
      if (data.paid) {
        toast({
          title: 'Zahlung übernommen',
          description: 'Bestellung wurde als bezahlt markiert.',
        })
        loadOrder()
      } else {
        toast({
          title: 'Zahlung bei Mollie noch offen',
          description: data.message || `Status: ${data.status || 'unbekannt'}`,
        })
      }
    } finally {
      setSyncingPayment(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!orderId) return
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Status-Update fehlgeschlagen')

      toast({
        title: 'Status aktualisiert',
        description: `Bestellung wurde auf "${getStatusLabel(newStatus)}" gesetzt.`,
      })

      setOrder(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      })
    }
  }

  const saveTracking = async () => {
    const num = trackingInput.trim()
    if (!num) {
      toast({ title: 'Bitte Sendungsnummer eingeben', variant: 'destructive' })
      return
    }
    const idToUse = (typeof orderId === 'string' ? orderId : Array.isArray(orderId) ? orderId[0] : '')?.trim()
    if (!idToUse) {
      toast({ title: 'Bestellung nicht geladen', description: 'Seite neu laden und erneut versuchen.', variant: 'destructive' })
      return
    }
    setSavingTracking(true)
    const itemsPayload = Object.entries(newShipmentItems)
      .filter(([, q]) => q > 0)
      .map(([order_item_id, quantity]) => ({ order_item_id, quantity }))
    const body = {
      trackingNumber: num,
      trackingCarrier: trackingCarrier,
      order_number: order?.order_number ?? undefined,
      orderId: idToUse,
      ...(itemsPayload.length > 0 && { items: itemsPayload }),
    }
    try {
      let res = await fetch(`/api/admin/orders/${encodeURIComponent(idToUse)}/tracking`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      // Fallback: Route ohne [id] (nutzt Service-Role; funktioniert, wenn [id]-Route 404 liefert)
      if (res.status === 404) {
        res = await fetch('/api/admin/order-tracking', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Speichern fehlgeschlagen', variant: 'destructive' })
        return
      }
      setOrder(prev => prev ? { ...prev, tracking_number: num, tracking_carrier: trackingCarrier, status: data.status || prev.status } : null)
      setTrackingInput('')
      setNewShipmentItems({})
      try {
        const itemsRes = await fetch(`/api/admin/orders/${idToUse}/shipment-items`, { cache: 'no-store' })
        if (itemsRes.ok) {
          const { shipments: apiShipments, itemsByShipment: loaded } = await itemsRes.json()
          setShipments(Array.isArray(apiShipments) ? apiShipments : [])
          setItemsByShipment(loaded ?? {})
        } else {
          const shipRes = await fetch(`/api/admin/orders/${idToUse}/shipments`, { cache: 'no-store' })
          if (shipRes.ok) {
            const { shipments: apiShipments } = await shipRes.json()
            setShipments(Array.isArray(apiShipments) ? apiShipments : [])
          }
          setItemsByShipment({})
        }
      } catch {
        const shipRes = await fetch(`/api/admin/orders/${idToUse}/shipments`, { cache: 'no-store' })
        if (shipRes.ok) {
          const { shipments: apiShipments } = await shipRes.json()
          setShipments(Array.isArray(apiShipments) ? apiShipments : [])
        }
        setItemsByShipment({})
      }
      toast({
        title: 'Sendung hinzugefügt',
        description: 'Speichern erfolgreich. E-Mail mit allen Sendungsnummern kannst du unten separat versenden.',
      })
    } catch {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSavingTracking(false)
    }
  }

  const createLabel = async () => {
    const idToUse = (typeof orderId === 'string' ? orderId : Array.isArray(orderId) ? orderId[0] : '')?.trim()
    if (!idToUse || !order) return
    setCreatingLabel(true)
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(idToUse)}/create-label`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrier: labelCarrier }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.needPortal && data.portalUrl) {
        toast({
          title: `${labelCarrier}: Label im Portal erstellen`,
          description: data.message ? `${data.message} Portal wurde in neuem Tab geöffnet.` : 'Portal wurde in neuem Tab geöffnet.',
        })
        window.open(data.portalUrl, '_blank', 'noopener,noreferrer')
        setCreatingLabel(false)
        return
      }
      if (!res.ok) {
        toast({ title: `${labelCarrier} Label fehlgeschlagen`, description: data.error || 'Bitte API-Zugang prüfen', variant: 'destructive' })
        setCreatingLabel(false)
        return
      }
      try {
        const shipRes = await fetch(`/api/admin/orders/${idToUse}/shipments`, { cache: 'no-store' })
        if (shipRes.ok) {
          const { shipments: apiShipments } = await shipRes.json()
          setShipments(Array.isArray(apiShipments) ? apiShipments : [])
        }
      } catch {
        /* ignore */
      }
      setOrder(prev => prev ? { ...prev, tracking_number: data.trackingNumber, tracking_carrier: labelCarrier, status: 'shipped' } : null)
      if (data.labelUrl) {
        window.open(data.labelUrl, '_blank', 'noopener,noreferrer')
      } else if (data.labelPdfBase64) {
        const url = `data:application/pdf;base64,${data.labelPdfBase64}`
        window.open(url, '_blank', 'noopener,noreferrer')
      }
      toast({
        title: `${labelCarrier} Label erstellt`,
        description: data.visualCheckOfAge ? `Sendung ${data.trackingNumber} mit Alterssichtprüfung 18+` : `Sendung ${data.trackingNumber}`,
      })
    } catch {
      toast({ title: `${labelCarrier} Label fehlgeschlagen`, description: 'Netzwerkfehler oder API nicht konfiguriert', variant: 'destructive' })
    } finally {
      setCreatingLabel(false)
    }
  }

  const sendShippingEmail = async () => {
    if (!orderId || !order?.customer_email) return
    setSendingShippingEmail(true)
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/tracking`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-email' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'E-Mail konnte nicht gesendet werden', variant: 'destructive' })
        return
      }
      toast({
        title: 'E-Mail gesendet',
        description: `Versandbenachrichtigung mit ${shipments.length} Sendungsnummer(n) an ${order.customer_email} gesendet.`,
      })
    } catch {
      toast({ title: 'Fehler', description: 'E-Mail konnte nicht gesendet werden', variant: 'destructive' })
    } finally {
      setSendingShippingEmail(false)
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

  const assignTo = async (email: string | null) => {
    if (!orderId) return
    setUpdatingAssignment(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to_email: email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Zuweisung fehlgeschlagen')
      const at = email ? new Date().toISOString() : null
      setOrder((prev) => prev ? { ...prev, assigned_to_email: email, assigned_at: at } : null)
      toast({
        title: email ? 'Zugewiesen' : 'Freigegeben',
        description: email ? `Bestellung an ${email} zugewiesen.` : 'Bestellung ist wieder für alle verfügbar.',
      })
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message || 'Zuweisung fehlgeschlagen', variant: 'destructive' })
    } finally {
      setUpdatingAssignment(false)
    }
  }

  const assignToMe = () => currentUserEmail && assignTo(currentUserEmail)
  const releaseAssignment = () => assignTo(null)

  const saveProcessingStatus = async (processing_status: string, processing_notes: string) => {
    if (!orderId) return
    setSavingProcessing(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processing_status: processing_status || null,
          processing_notes: processing_notes.trim() || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Speichern fehlgeschlagen')
      setOrder((prev) => prev ? {
        ...prev,
        processing_status: processing_status || null,
        processing_notes: processing_notes.trim() || null,
      } : null)
      toast({ title: 'Gespeichert', description: 'Bearbeitungsstatus für Kollegen aktualisiert.' })
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message || 'Speichern fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSavingProcessing(false)
    }
  }

  const formatAuditField = (field: string | null) => {
    if (!field) return '–'
    const map: Record<string, string> = {
      status: 'Status',
      payment_status: 'Zahlungsstatus',
      processing_status: 'Bearbeitungsstatus',
      assigned_to_email: 'Zugewiesen an',
      tracking_number: 'Sendungsnummer',
      tracking_carrier: 'Versanddienstleister',
      return_request_status: 'Rücksendeanfrage',
      cancellation_request_status: 'Stornierungsanfrage',
    }
    return map[field] ?? field
  }

  const formatAuditValue = (field: string | null, value: string | null) => {
    if (value == null || value === '') return null
    if (field === 'status') {
      const labels: Record<string, string> = {
        delivered: 'Zugestellt', shipped: 'Versandt', processing: 'In Bearbeitung', cancelled: 'Storniert',
        cancellation_requested: 'Stornierung beantragt', cancellation_rejected: 'Stornierung abgelehnt',
        return_requested: 'Rücksendung beantragt', return_rejected: 'Rücksendung abgelehnt',
        return_completed: 'Rücksendung abgeschlossen', pending: 'Ausstehend',
      }
      return labels[value] ?? value
    }
    if (field === 'payment_status') {
      const labels: Record<string, string> = { paid: 'Bezahlt', pending: 'Offen', failed: 'Fehlgeschlagen', refunded: 'Erstattet' }
      return labels[value] ?? value
    }
    if (field === 'return_request_status' || field === 'cancellation_request_status') {
      const labels: Record<string, string> = { pending: 'Ausstehend', approved: 'Angenommen', rejected: 'Abgelehnt' }
      return labels[value] ?? value
    }
    return value
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

  const getPaymentStatusColor = (s: string) => {
    switch (s) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 'refunded': return 'bg-amber-500/20 text-amber-400 border-amber-500/50'
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
    }
  }
  const getPaymentStatusLabel = (s: string) => {
    switch (s) {
      case 'paid': return 'Bezahlt'
      case 'failed': return 'Fehlgeschlagen'
      case 'refunded': return 'Erstattet'
      default: return 'Zahlung offen'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Bestellung nicht gefunden</h2>
          <Link href="/admin/orders" className="text-luxe-gold hover:underline">
            Zurück zu Bestellungen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center text-luxe-silver hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu Bestellungen
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">
            Bestellte Artikel
          </h1>
          <p className="text-sm text-luxe-silver">
            <Calendar className="w-4 h-4 inline mr-1" />
            {formatDate(order.created_at)}
            <span className="ml-2">#{order.order_number}</span>
          </p>
        </div>
        <div className="space-y-2 flex flex-wrap gap-2">
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
          <Badge className={getPaymentStatusColor(order.payment_status || 'pending')} variant="outline">
            {getPaymentStatusLabel(order.payment_status || 'pending')}
          </Badge>
          {order.has_adult_items && (
            <Badge variant="adult">18+ DHL Ident</Badge>
          )}
          {supplierSubmitted === true && (
            <Badge className="bg-green-500/20 text-green-400 border border-green-500/50">
              Übermittelt
            </Badge>
          )}
          {supplierSubmitted !== true && order.payment_status === 'paid' && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-500/50 text-amber-200 hover:bg-amber-500/10"
              disabled={submittingToSuppliers}
              onClick={async () => {
                setSubmittingToSuppliers(true)
                try {
                  const res = await fetch(`/api/admin/orders/${orderId}/submit-suppliers`, { method: 'POST' })
                  const data = await res.json().catch(() => ({}))
                  if (res.ok && data.ok) {
                    setSupplierSubmitted(true)
                    toast({ title: 'An Lieferanten übermittelt', description: data.submitted ? `${data.submitted} Lieferant(en) benachrichtigt.` : 'Erledigt.' })
                  } else {
                    toast({ title: 'Übermittlung fehlgeschlagen', description: data.error || res.statusText, variant: 'destructive' })
                  }
                } catch {
                  toast({ title: 'Fehler', variant: 'destructive' })
                } finally {
                  setSubmittingToSuppliers(false)
                }
              }}
            >
              {submittingToSuppliers ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
              An Lieferanten übermitteln
            </Button>
          )}
        </div>
        {order.cancellation_requested_at && (
          <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <p className="text-amber-200 font-medium">Kunde hat Stornierung angefragt</p>
            <p className="text-luxe-silver text-sm mt-1">
              {order.cancellation_reason
                ? (CANCELLATION_REASONS.find((r) => r.value === order.cancellation_reason)?.label ?? order.cancellation_reason)
                : 'Kein Grund angegeben'}
              {order.cancellation_reason_other && (
                <span className="block mt-1">Sonstiges: {order.cancellation_reason_other}</span>
              )}
            </p>
            {requestItems.cancellation.length > 0 ? (
              <p className="text-luxe-silver text-sm mt-1">
                Betroffene Artikel: {requestItems.cancellation.map((i) => {
                  const label = i.requested_quantity != null ? `${i.product_name} (${i.requested_quantity} von ${i.quantity ?? '?'})` : i.product_name
                  return i.admin_status === 'not_refundable' ? `${label} [nicht erstattungsfähig]` : label
                }).join(', ')}
              </p>
            ) : (
              <p className="text-luxe-silver text-sm mt-1">Gesamte Bestellung</p>
            )}
            <p className="text-luxe-silver/80 text-xs mt-1">
              Anfrage am {formatDate(order.cancellation_requested_at)}
              {order.cancellation_request_status === 'approved' && ' · Angenommen'}
              {order.cancellation_request_status === 'rejected' && ' · Abgelehnt'}
            </p>
            {(order.cancellation_request_status === 'pending' || !order.cancellation_request_status) && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { openApproveCancelDialog(); setRejectCancelDialogOpen(false) }} disabled={respondingCancel}>
                  Annehmen
                </Button>
                <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => { setRejectCancelReason(''); setRejectCancelDialogOpen(true) }} disabled={respondingCancel}>
                  Ablehnen
                </Button>
              </div>
            )}
          </div>
        )}
        {order.return_requested_at && (
          <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-blue-200 font-medium">Kunde hat Rücksendung angefragt</p>
            <p className="text-luxe-silver text-sm mt-1">
              {order.return_reason
                ? (RETURN_REASONS.find((r) => r.value === order.return_reason)?.label ?? order.return_reason)
                : 'Kein Grund angegeben'}
              {order.return_reason_other && (
                <span className="block mt-1">Sonstiges: {order.return_reason_other}</span>
              )}
            </p>
            {requestItems.return.length > 0 ? (
              <p className="text-luxe-silver text-sm mt-1">
                Betroffene Artikel: {requestItems.return.map((i) => {
                  const label = i.requested_quantity != null ? `${i.product_name} (${i.requested_quantity} von ${i.quantity ?? '?'})` : i.product_name
                  return i.admin_status === 'not_refundable' ? `${label} [nicht erstattungsfähig]` : label
                }).join(', ')}
              </p>
            ) : (
              <p className="text-luxe-silver text-sm mt-1">Gesamte Bestellung</p>
            )}
            {(order.return_carrier_preference || order.return_method_preference) && (
              <div className="mt-2 p-2 rounded-md bg-luxe-gold/15 border border-luxe-gold/40">
                <p className="text-luxe-gold font-medium text-sm">Kunde hat gewählt – nur diese Option bereitstellen:</p>
                <p className="text-white text-sm mt-0.5">
                  {order.return_carrier_preference ? getCarrierLabel(order.return_carrier_preference) : '–'}
                  {order.return_method_preference === 'printed_code'
                    ? ' · Gedruckter Retourencode zum Ausdrucken'
                    : order.return_method_preference === 'qr_code'
                      ? ' · QR-Code (druckerlose Retoure)'
                      : order.return_carrier_preference && !carrierSupportsQr(order.return_carrier_preference)
                        ? ' · Gedruckter Retourencode (bei diesem Dienstleister nur Ausdruck möglich)'
                        : ''}
                </p>
              </div>
            )}
            <p className="text-luxe-silver/80 text-xs mt-1">
              Anfrage am {formatDate(order.return_requested_at)}
              {order.return_request_status === 'approved' && ' · Angenommen'}
              {order.return_request_status === 'rejected' && ' · Abgelehnt'}
            </p>
            {order.return_request_status === 'approved' && (
              <div className="mt-3 p-3 bg-luxe-gray rounded-lg text-sm space-y-2">
                {(order.return_shipping_code != null || (order.return_shipping_deduction_cents ?? 0) > 0 || (order.return_shipping_options?.length ?? 0) > 0) && (
                  <>
                    {order.return_shipping_code && (
                      <p className="text-white">Versandcode an Kunden: <span className="font-mono text-luxe-gold">{order.return_shipping_code}</span></p>
                    )}
                    {(order.return_shipping_options?.length ?? 0) > 0 ? (
                      <p className="text-luxe-silver">
                        {order.return_shipping_options!.length === 1
                          ? `Versanddienstleister: ${getCarrierLabel(order.return_shipping_options![0].carrier)} – ${formatReturnOptionPrice(order.return_shipping_options![0].price_cents)} von Erstattung abziehen`
                          : `Optionen für Kunde: ${order.return_shipping_options!.map((o) => `${getCarrierLabel(o.carrier)} ${formatReturnOptionPrice(o.price_cents)}`).join(', ')}`}
                      </p>
                    ) : (order.return_shipping_deduction_cents ?? 0) > 0 ? (
                      <p className="text-luxe-silver">Von Erstattung abgezogen: {formatPrice(order.return_shipping_deduction_cents! / 100)}</p>
                    ) : null}
                  </>
                )}
                {order.return_method_preference === 'qr_code' && (order.return_carrier_preference?.toLowerCase() ?? '') === 'dhl' ? (
                  <Button size="sm" variant="outline" className="border-luxe-gold/50 text-luxe-gold hover:bg-luxe-gold/10" onClick={handleCreateDhlReturnLabel} disabled={creatingDhlReturnLabel}>
                    {creatingDhlReturnLabel ? 'Wird erstellt…' : 'DHL QR-Retourenlabel erstellen (wie vom Kunden gewählt)'}
                  </Button>
                ) : (
                  <>
                    {(order.return_method_preference === 'printed_code' || !order.return_method_preference || (order.return_carrier_preference && !carrierSupportsQr(order.return_carrier_preference))) && (
                      <p className="text-luxe-silver text-xs">
                        Kunde nutzt <strong className="text-white">gedruckten Retourencode</strong> (wie gewählt). Code oben eingetragen – beim Annehmen gesetzt oder manuell hinterlegt. Kein QR-Label nötig.
                      </p>
                    )}
                    {order.return_method_preference === 'qr_code' && order.return_carrier_preference && (order.return_carrier_preference?.toLowerCase() ?? '') !== 'dhl' && (
                      <p className="text-amber-200/90 text-xs">
                        Bei {getCarrierLabel(order.return_carrier_preference)} ist nur ein gedruckter Retourencode möglich. Bitte Code oben eintragen und Kunde per E-Mail mitteilen.
                      </p>
                    )}
                  </>
                )}
                {canMarkReturnReceived && (
                  <Button size="sm" variant="outline" className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10" onClick={handleMarkReturnReceived} disabled={markingReturnReceived}>
                    {markingReturnReceived ? 'Wird gesetzt…' : 'Rücksendung eingegangen (Artikel auf „zurückgesendet“ setzen)'}
                  </Button>
                )}
                {returnInspection && !canMarkReturnReceived && (
                  <div className="flex flex-wrap items-center gap-2">
                    {(returnInspection.condition_code || (returnInspection.restocking_fee_cents ?? 0) > 0) && (
                      <span className="text-sm text-luxe-silver">
                        Prüfung: {returnInspection.condition_code === 'as_new' ? 'Wie neu' : returnInspection.condition_code === 'minor_damage' ? 'Leichte Gebrauchsspuren' : returnInspection.condition_code === 'major_damage' ? 'Deutliche Beschädigung' : returnInspection.condition_code === 'not_restockable' ? 'Nicht einlagerbar' : '–'}
                        {(returnInspection.restocking_fee_cents ?? 0) > 0 && ` · Restocking: ${formatPrice((returnInspection.restocking_fee_cents ?? 0) / 100)}`}
                      </span>
                    )}
                    <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10" onClick={openInspectionDialog}>
                      {returnInspection?.condition_code ? 'Bearbeiten' : 'Retoure prüfen'}
                    </Button>
                  </div>
                )}
                <Button size="sm" className="bg-amber-600 hover:bg-amber-700 mt-2" onClick={openProcessReturnDialog}>
                  Retoure abwickeln (Gutschrift + Finanz-Abzug)
                </Button>
              </div>
            )}
            {(order.return_request_status === 'pending' || !order.return_request_status) && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => respondToReturnRequest('approve')} disabled={respondingReturn}>
                  Annehmen
                </Button>
                <Button size="sm" variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={() => respondToReturnRequest('reject')} disabled={respondingReturn}>
                  Ablehnen
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Dialog: Retoure prüfen – Zustand, Restocking Fee (Phase 11.1) */}
        <Dialog open={inspectionDialogOpen} onOpenChange={setInspectionDialogOpen}>
          <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md" aria-describedby="dialog-desc-inspection">
            <DialogHeader>
              <DialogTitle>Retoure prüfen</DialogTitle>
              <DialogDescription id="dialog-desc-inspection" className="sr-only">Zustand und Restocking Fee für die Retoure festlegen.</DialogDescription>
            </DialogHeader>
            <p className="text-luxe-silver text-sm">
              Zustand der Retoure festhalten. Restocking Fee wird von der Erstattung abgezogen.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Zustand</label>
                <select
                  value={inspectionCondition}
                  onChange={(e) => setInspectionCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
                >
                  <option value="">– Nicht geprüft –</option>
                  <option value="as_new">Wie neu / unbenutzt</option>
                  <option value="minor_damage">Leichte Gebrauchsspuren</option>
                  <option value="major_damage">Deutliche Beschädigung</option>
                  <option value="not_restockable">Nicht einlagerbar (z.B. hygienisch)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Restocking Fee (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={inspectionRestockingEur}
                  onChange={(e) => setInspectionRestockingEur(e.target.value)}
                  placeholder="z.B. 5,00"
                  className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver text-sm"
                />
                <p className="text-luxe-silver text-xs mt-1">Wird von der Erstattung abgezogen</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Notizen (optional)</label>
                <textarea
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  placeholder="z.B. Verpackung beschädigt"
                  rows={2}
                  className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver text-sm resize-y"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setInspectionDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
              <Button onClick={handleSaveInspection} disabled={inspectionSaving} className="bg-amber-600 hover:bg-amber-700">
                {inspectionSaving ? 'Wird gespeichert…' : 'Speichern'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Rücksendung annehmen – Versandcode, Versanddienstleister, Preise */}
        <Dialog open={approveReturnDialogOpen} onOpenChange={setApproveReturnDialogOpen}>
          <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-lg" aria-describedby="dialog-desc-approve-return">
            <DialogHeader>
              <DialogTitle>Rücksendung annehmen</DialogTitle>
              <DialogDescription id="dialog-desc-approve-return" className="sr-only">Versandcode und Versandoptionen für die Rücksendung eintragen.</DialogDescription>
            </DialogHeader>
            {(order?.return_carrier_preference || order?.return_method_preference) && (
              <div className="mb-3 p-2 rounded-md bg-luxe-gold/15 border border-luxe-gold/40">
                <p className="text-luxe-gold text-xs font-medium">Kundenwunsch (nur dies bereitstellen):</p>
                <p className="text-white text-sm mt-0.5">
                  {order.return_carrier_preference ? getCarrierLabel(order.return_carrier_preference) : '–'}
                  {order.return_method_preference === 'printed_code'
                    ? ' · Gedruckter Retourencode → Code unten eintragen'
                    : order.return_method_preference === 'qr_code'
                      ? ' · QR-Code → Nach dem Annehmen „DHL QR-Retourenlabel erstellen“ klicken'
                      : ''}
                </p>
              </div>
            )}
            <p className="text-luxe-silver text-sm">
              Der Kunde erhält per E-Mail einen Versandcode sowie die gewählten Versandoptionen inkl. Preise (von Erstattung abziehbar).
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Versandcode (Pflicht)</label>
                <input
                  type="text"
                  value={returnShippingCode}
                  onChange={(e) => setReturnShippingCode(e.target.value)}
                  placeholder="z. B. DHL Retourenschein-Code"
                  className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver text-sm"
                />
              </div>
              <div>
                <p className="block text-sm font-medium text-white mb-2">Versanddienstleister & Preise</p>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="returnCarrierMode"
                      checked={returnCarrierMode === 'fixed'}
                      onChange={() => { setReturnCarrierMode('fixed'); setReturnShippingOptionsList((prev) => prev.slice(0, 1)); }}
                      className="text-luxe-gold focus:ring-luxe-gold"
                    />
                    <span className="text-sm text-white">Fester Versanddienstleister (Kunde muss diesen nutzen)</span>
                  </label>
                </div>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="returnCarrierMode"
                      checked={returnCarrierMode === 'customer_choice'}
                      onChange={() => setReturnCarrierMode('customer_choice')}
                      className="text-luxe-gold focus:ring-luxe-gold"
                    />
                    <span className="text-sm text-white">Kunde wählt selbst (Preise anzeigen)</span>
                  </label>
                </div>
                <div className="space-y-2 mt-3">
                  {returnShippingOptionsList.map((opt, index) => (
                    <div key={index} className="flex gap-2 items-center flex-wrap">
                      <select
                        value={opt.carrier}
                        onChange={(e) => updateReturnShippingOption(index, 'carrier', e.target.value)}
                        className="px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm min-w-[100px]"
                      >
                        {RETURN_SHIPPING_CARRIERS.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={opt.priceEur}
                        onChange={(e) => updateReturnShippingOption(index, 'priceEur', e.target.value)}
                        placeholder="Preis € (z. B. 4,99)"
                        className="w-24 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver text-sm"
                      />
                      <span className="text-luxe-silver text-sm">€ (von Erstattung abziehen)</span>
                      {returnCarrierMode === 'customer_choice' && returnShippingOptionsList.length > 1 && (
                        <button type="button" onClick={() => removeReturnShippingOption(index)} className="text-red-400 hover:text-red-300 text-sm">
                          Entfernen
                        </button>
                      )}
                    </div>
                  ))}
                  {returnCarrierMode === 'customer_choice' && (
                    <button type="button" onClick={addReturnShippingOption} className="text-sm text-luxe-gold hover:text-luxe-gold/80">
                      + Option hinzufügen
                    </button>
                  )}
                </div>
              </div>
              {requestItems.return.length > 0 && (
                <div>
                  <p className="block text-sm font-medium text-white mb-2">Artikel-Status (Erstatten / Nicht erstattungsfähig)</p>
                  <p className="text-xs text-luxe-silver/80 mb-2">Gib pro Artikel an, ob er erstattet wird oder nicht (z. B. Hygieneartikel geöffnet).</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {requestItems.return.map((i) => (
                      <div key={i.order_item_id} className="p-2 rounded bg-luxe-gray/50 border border-luxe-gray">
                        <p className="text-white text-sm">{i.product_name}{i.requested_quantity != null ? ` (${i.requested_quantity} von ${i.quantity ?? '?'})` : ''}</p>
                        <div className="flex flex-wrap gap-3 mt-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`return-status-${i.order_item_id}`}
                              checked={(returnItemStatus[i.order_item_id] ?? 'approved') === 'approved'}
                              onChange={() => setReturnItemStatus((prev) => ({ ...prev, [i.order_item_id]: 'approved' }))}
                              className="text-luxe-gold focus:ring-luxe-gold"
                            />
                            <span className="text-xs text-luxe-silver">Erstatten</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`return-status-${i.order_item_id}`}
                              checked={(returnItemStatus[i.order_item_id] ?? 'approved') === 'not_refundable'}
                              onChange={() => setReturnItemStatus((prev) => ({ ...prev, [i.order_item_id]: 'not_refundable' }))}
                              className="text-luxe-gold focus:ring-luxe-gold"
                            />
                            <span className="text-xs text-red-400">Nicht erstattungsfähig</span>
                          </label>
                        </div>
                        {(returnItemStatus[i.order_item_id] ?? 'approved') === 'not_refundable' && (
                          <input
                            type="text"
                            value={returnItemNote[i.order_item_id] ?? ''}
                            onChange={(e) => setReturnItemNote((prev) => ({ ...prev, [i.order_item_id]: e.target.value }))}
                            placeholder="Grund (optional)"
                            className="mt-1 w-full px-2 py-1 bg-luxe-gray border border-luxe-silver rounded text-white placeholder:text-luxe-silver/60 text-xs"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setApproveReturnDialogOpen(false)} className="text-luxe-silver">
                Abbrechen
              </Button>
              <Button onClick={submitApproveReturn} disabled={respondingReturn || !returnShippingCode.trim()} className="bg-green-600 hover:bg-green-700">
                {respondingReturn ? 'Wird gesendet…' : 'Annehmen & E-Mail senden'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Retoure abwickeln – Gutschrift, Finanz-Abzug, optional Lager */}
        <Dialog open={processReturnDialogOpen} onOpenChange={(open) => { setProcessReturnDialogOpen(open); if (!open) setProcessReturnBreakdown(null); }}>
          <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md" aria-describedby="dialog-desc-process-return">
            <DialogHeader>
              <DialogTitle>Retoure abwickeln</DialogTitle>
              <DialogDescription id="dialog-desc-process-return" className="sr-only">Gutschriftbetrag eingeben und Retoure buchen.</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 mb-4">
              <p className="text-amber-200 text-sm font-medium">Erstattung erfolgt nur nach manueller Prüfung.</p>
              <p className="text-luxe-silver text-xs mt-1">Es findet keine automatische Rückbuchung statt. Prüfe jeden Betrag sorgfältig (z. B. Artikel „nicht erstattungsfähig“ ausschließen).</p>
            </div>
            <p className="text-luxe-silver text-sm">
              Gutschrift-PDF wird erzeugt, der Betrag wird im Finanz-Dashboard von den Einnahmen abgezogen. Optional kann der Lagerbestand für zurückgesendete Artikel wieder erhöht werden.
            </p>
            {processReturnBreakdown && (
              <div className="rounded-lg bg-luxe-gray/50 border border-luxe-gray p-3 text-sm">
                <p className="text-luxe-silver mb-1">Berechnung (Vorschlag):</p>
                <p className="text-white">
                  Warenwert ohne Hinversand: {formatPrice(processReturnBreakdown.amountWithoutShipping)}
                </p>
                {processReturnBreakdown.returnShippingCents > 0 && (
                  <p className="text-white">
                    − Rücksende-Versand ({processReturnBreakdown.carrierLabel}): {formatPrice(processReturnBreakdown.returnShippingCents / 100)}
                  </p>
                )}
                {processReturnBreakdown.restockingFeeCents > 0 && (
                  <p className="text-white">
                    − Restocking Fee: {formatPrice(processReturnBreakdown.restockingFeeCents / 100)}
                  </p>
                )}
                <p className="text-luxe-gold font-medium mt-1">
                  = Erstattung: {formatPrice(Math.max(0, processReturnBreakdown.amountWithoutShipping - processReturnBreakdown.returnShippingCents / 100 - processReturnBreakdown.restockingFeeCents / 100))}
                </p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">Gutschriftbetrag (€)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={processReturnAmount}
                  onChange={(e) => setProcessReturnAmount(e.target.value)}
                  placeholder="z. B. 49,99"
                  className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver text-sm"
                />
                {processReturnBreakdown && (
                  <p className="text-luxe-silver text-xs mt-1">Vorausgefüllt mit Verkaufspreis ohne Versand minus Rücksende-Versand (gewählter Dienstleister). Du kannst den Betrag anpassen.</p>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={processReturnRestoreStock}
                  onChange={(e) => setProcessReturnRestoreStock(e.target.checked)}
                  className="text-luxe-gold focus:ring-luxe-gold rounded"
                />
                <span className="text-sm text-white">Lagerbestand für zurückgesendete Artikel wieder erhöhen</span>
              </label>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setProcessReturnDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
              <Button onClick={handleProcessReturn} disabled={processingReturn} className="bg-amber-600 hover:bg-amber-700">
                {processingReturn ? 'Wird verarbeitet…' : 'Gutschrift erstellen & buchen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Stornierung annehmen – pro Artikel Erstatten / Nicht erstattungsfähig */}
        <Dialog open={approveCancelDialogOpen} onOpenChange={setApproveCancelDialogOpen}>
          <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-lg" aria-describedby="dialog-desc-approve-cancel">
            <DialogHeader>
              <DialogTitle>Stornierung annehmen</DialogTitle>
              <DialogDescription id="dialog-desc-approve-cancel" className="sr-only">Pro Artikel Erstatten oder Nicht erstattungsfähig festlegen.</DialogDescription>
            </DialogHeader>
            <p className="text-luxe-silver text-sm">
              Du kannst pro Artikel festlegen, ob er storniert wird oder nicht erstattungsfähig ist (z. B. bereits versendet, beschädigt durch Kunde).
            </p>
            {requestItems.cancellation.length > 0 && (
              <div className="space-y-3 mt-3">
                <p className="text-sm font-medium text-white">Artikel-Status</p>
                {requestItems.cancellation.map((i) => (
                  <div key={i.order_item_id} className="p-3 rounded-lg bg-luxe-gray/50 border border-luxe-gray">
                    <p className="text-white text-sm">{i.product_name}{i.requested_quantity != null ? ` (${i.requested_quantity} von ${i.quantity ?? '?'})` : ''}</p>
                    <div className="flex flex-wrap gap-4 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`cancel-status-${i.order_item_id}`}
                          checked={(cancelItemStatus[i.order_item_id] ?? 'approved') === 'approved'}
                          onChange={() => setCancelItemStatus((prev) => ({ ...prev, [i.order_item_id]: 'approved' }))}
                          className="text-luxe-gold focus:ring-luxe-gold"
                        />
                        <span className="text-sm text-luxe-silver">Erstatten (stornieren)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`cancel-status-${i.order_item_id}`}
                          checked={(cancelItemStatus[i.order_item_id] ?? 'approved') === 'not_refundable'}
                          onChange={() => setCancelItemStatus((prev) => ({ ...prev, [i.order_item_id]: 'not_refundable' }))}
                          className="text-luxe-gold focus:ring-luxe-gold"
                        />
                        <span className="text-sm text-red-400">Nicht erstattungsfähig</span>
                      </label>
                    </div>
                    {(cancelItemStatus[i.order_item_id] ?? 'approved') === 'not_refundable' && (
                      <input
                        type="text"
                        value={cancelItemNote[i.order_item_id] ?? ''}
                        onChange={(e) => setCancelItemNote((prev) => ({ ...prev, [i.order_item_id]: e.target.value }))}
                        placeholder="Grund (z. B. Artikel beschädigt)"
                        className="mt-2 w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver/60 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setApproveCancelDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
              <Button onClick={submitApproveCancel} disabled={respondingCancel} className="bg-green-600 hover:bg-green-700">
                {respondingCancel ? 'Wird gesendet…' : 'Annehmen & E-Mail senden'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Stornierung ablehnen – optionaler Hinweis an Kunden */}
        <Dialog open={rejectCancelDialogOpen} onOpenChange={setRejectCancelDialogOpen}>
          <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md" aria-describedby="dialog-desc-reject-cancel">
            <DialogHeader>
              <DialogTitle>Stornierung ablehnen</DialogTitle>
              <DialogDescription id="dialog-desc-reject-cancel" className="sr-only">Optionalen Hinweis an den Kunden für die Ablehnung eingeben.</DialogDescription>
            </DialogHeader>
            <p className="text-luxe-silver text-sm">
              Der Kunde erhält eine freundliche E-Mail mit Entschuldigung. Du kannst optional einen Grund angeben, damit der Kunde die Entscheidung besser versteht.
            </p>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Hinweis an den Kunden (optional)</label>
              <textarea
                value={rejectCancelReason}
                onChange={(e) => setRejectCancelReason(e.target.value)}
                placeholder="z. B. Die Bestellung wurde bereits versendet, daher können wir die Stornierung leider nicht mehr annehmen."
                rows={3}
                className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver text-sm resize-y"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRejectCancelDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
              <Button onClick={submitRejectCancel} disabled={respondingCancel} className="bg-red-600 hover:bg-red-700">
                {respondingCancel ? 'Wird gesendet…' : 'Ablehnen & E-Mail senden'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Rücksendung ablehnen – optionaler Hinweis an Kunden */}
        <Dialog open={rejectReturnDialogOpen} onOpenChange={setRejectReturnDialogOpen}>
          <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md" aria-describedby="dialog-desc-reject-return">
            <DialogHeader>
              <DialogTitle>Rücksendung ablehnen</DialogTitle>
              <DialogDescription id="dialog-desc-reject-return" className="sr-only">Optionalen Hinweis an den Kunden für die Ablehnung eingeben.</DialogDescription>
            </DialogHeader>
            <p className="text-luxe-silver text-sm">
              Der Kunde erhält eine freundliche E-Mail mit Entschuldigung. Du kannst optional einen Grund angeben, damit der Kunde die Entscheidung besser versteht.
            </p>
            <div>
              <label className="block text-sm font-medium text-white mb-1">Hinweis an den Kunden (optional)</label>
              <textarea
                value={rejectReturnReason}
                onChange={(e) => setRejectReturnReason(e.target.value)}
                placeholder="z. B. Die Rückgabefrist ist leider abgelaufen, daher können wir die Rücksendung nicht mehr annehmen."
                rows={3}
                className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver text-sm resize-y"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRejectReturnDialogOpen(false)} className="text-luxe-silver">Abbrechen</Button>
              <Button onClick={submitRejectReturn} disabled={respondingReturn} className="bg-red-600 hover:bg-red-700">
                {respondingReturn ? 'Wird gesendet…' : 'Ablehnen & E-Mail senden'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Paket-Inhalt bearbeiten */}
        <Dialog open={editingShipmentContent !== null} onOpenChange={(open) => { if (!open) setEditingShipmentContent(null); }}>
          <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md" aria-describedby="dialog-paket-inhalt-desc">
            <DialogHeader>
              <DialogTitle>Inhalt dieses Pakets</DialogTitle>
              <DialogDescription id="dialog-paket-inhalt-desc" className="sr-only">
                Mengen pro Artikel für diese Sendung festlegen und speichern.
              </DialogDescription>
            </DialogHeader>
            <p className="text-luxe-silver text-sm mb-3">
              Lege fest, welche Artikel in diesem Paket sind (Menge pro Artikel, max. bestellte Menge).
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {orderItems.filter((item) => (item.item_status == null || item.item_status === 'active')).map((item) => {
                const q = shipmentContentQuantities[item.id] ?? 0
                const maxQ = item.quantity
                return (
                  <div key={item.id} className="flex items-center justify-between gap-2 py-1 border-b border-luxe-gray/50">
                    <span className="text-sm text-white truncate flex-1 min-w-0">{item.product_name}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setShipmentContentQuantities((prev) => {
                            const next = { ...prev, [item.id]: Math.max(0, (prev[item.id] ?? 0) - 1) }
                            shipmentContentQuantitiesRef.current = next
                            return next
                          })
                        }}
                        disabled={q <= 0}
                        className="p-1.5 rounded-md bg-luxe-gray border border-luxe-silver text-white hover:bg-luxe-gray/80 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Menge verringern"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-white tabular-nums">{q}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setShipmentContentQuantities((prev) => {
                            const next = { ...prev, [item.id]: Math.min(maxQ, (prev[item.id] ?? 0) + 1) }
                            shipmentContentQuantitiesRef.current = next
                            return next
                          })
                        }}
                        disabled={q >= maxQ}
                        className="p-1.5 rounded-md bg-luxe-gray border border-luxe-silver text-white hover:bg-luxe-gray/80 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Menge erhöhen"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs text-luxe-silver w-8 text-right">/ {maxQ}</span>
                  </div>
                )
              })}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingShipmentContent(null)} className="text-luxe-silver">Abbrechen</Button>
              <Button
                onClick={async () => {
                  const idToUse = (typeof orderId === 'string' ? orderId : Array.isArray(orderId) ? orderId[0] : '')?.trim()
                  if (!editingShipmentContent || !idToUse) return
                  const fromRef = shipmentContentQuantitiesRef.current
                  const fromState = shipmentContentQuantities
                  const merged: Record<string, number> = {}
                  for (const k of new Set([...Object.keys(fromRef), ...Object.keys(fromState)])) {
                    merged[k] = Math.max(fromRef[k] ?? 0, fromState[k] ?? 0)
                  }
                  const items = Object.entries(merged)
                    .filter(([, q]) => q > 0)
                    .map(([order_item_id, quantity]) => ({ order_item_id: String(order_item_id), quantity: Number(quantity) }))
                  if (items.length === 0) {
                    toast({ title: 'Keine Artikel', description: 'Bitte mit + mindestens einen Artikel zum Paket hinzufügen.', variant: 'destructive' })
                    return
                  }
                  setSavingShipmentContent(true)
                  try {
                    const res = await fetch(`/api/admin/orders/${encodeURIComponent(idToUse)}/shipments/${encodeURIComponent(editingShipmentContent)}/items`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ items }),
                    })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) {
                      const msg = [data.error, data.hint].filter(Boolean).join(' ') || 'Speichern fehlgeschlagen'
                      const debug = data.debug ? ` (${JSON.stringify(data.debug)})` : ''
                      toast({ title: 'Fehler', description: msg + debug, variant: 'destructive' })
                      return
                    }
                    const saved = data.savedCount ?? 0
                    if (saved === 0 && items.length > 0) {
                      const msg = data.error || 'Keine Einträge konnten gespeichert werden. Bitte Seite neu laden und erneut versuchen.'
                      const debug = data.debug ? ` ${JSON.stringify(data.debug)}` : ''
                      toast({ title: 'Hinweis', description: msg + debug, variant: 'destructive' })
                      return
                    }
                    const shipmentIdToUpdate = editingShipmentContent
                    setEditingShipmentContent(null)
                    setItemsByShipment((prev) => ({
                      ...prev,
                      [shipmentIdToUpdate]: Array.isArray(data.itemsForShipment) ? data.itemsForShipment : prev[shipmentIdToUpdate] ?? [],
                    }))
                    toast({ title: 'Paket-Inhalt gespeichert', description: `${saved} Position(en) gespeichert.` })
                  } catch {
                    toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen', variant: 'destructive' })
                  } finally {
                    setSavingShipmentContent(false)
                  }
                }}
                disabled={savingShipmentContent}
                className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90"
              >
                {savingShipmentContent ? 'Speichern…' : 'Speichern'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items & Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items – Hauptfokus */}
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">
                Bestellte Artikel ({orderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item) => {
                  const inShipments = shipments.flatMap((s) => (itemsByShipment[s.id] ?? []).filter((i) => i.order_item_id === item.id))
                  const totalShippedQty = inShipments.reduce((sum, i) => sum + i.quantity, 0)
                  const isInAnyShipment = totalShippedQty > 0
                  return (
                  <div key={item.id} className="flex items-center space-x-4 p-4 bg-luxe-gray rounded-lg">
                    <div className="w-20 h-20 bg-luxe-black rounded-lg overflow-hidden flex-shrink-0">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold">{item.product_name}</h3>
                      <p className="text-luxe-silver text-sm">Menge: {item.quantity}</p>
                      {isInAnyShipment && (
                        <Badge variant="outline" className="mt-1 border-blue-500/50 text-blue-400">
                          Versendet{totalShippedQty < item.quantity ? ` (${totalShippedQty} von ${item.quantity})` : ''}
                        </Badge>
                      )}
                      {((item.cancelled_quantity ?? 0) > 0 || (item.returned_quantity ?? 0) > 0 || item.item_status === 'cancelled' || item.item_status === 'returned') && (
                        <>
                          {((item.cancelled_quantity ?? 0) > 0 || item.item_status === 'cancelled') && (
                            <Badge variant="outline" className="mt-1 border-red-500/50 text-red-400">
                              {(item.cancelled_quantity ?? 0) >= item.quantity ? 'Storniert' : `${item.cancelled_quantity ?? 0} von ${item.quantity} storniert`}
                            </Badge>
                          )}
                          {((item.returned_quantity ?? 0) > 0 || item.item_status === 'returned') && (
                            <Badge variant="outline" className="mt-1 ml-1 border-violet-500/50 text-violet-400">
                              {(item.returned_quantity ?? 0) >= item.quantity ? 'Zurückgesendet' : `${item.returned_quantity ?? 0} von ${item.quantity} zurückgesendet`}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatPrice(item.total)}</p>
                      <p className="text-luxe-silver text-sm">
                        {formatPrice(item.price)} / Stück
                      </p>
                    </div>
                  </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Customer & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-luxe-gold" />
                  Kunde
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-white">
                  <Mail className="w-4 h-4 text-luxe-gold" />
                  <span className="text-sm">{order.customer_email}</span>
                </div>
                {order.shipping_address?.phone && (
                  <div className="flex items-center space-x-2 text-white">
                    <Phone className="w-4 h-4 text-luxe-gold" />
                    <span className="text-sm">{order.shipping_address.phone}</span>
                  </div>
                )}
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
                  <p className="text-white leading-relaxed text-sm">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}<br />
                    {order.shipping_address.street} {order.shipping_address.house_number}<br />
                    {order.shipping_address.postal_code} {order.shipping_address.city}<br />
                    {order.shipping_address.country || 'Deutschland'}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Bearbeitung / Zuweisung – nur anzeigen wenn Bestellung noch nicht abgeschlossen */}
          {!['delivered', 'return_completed', 'cancelled'].includes(order.status) && (
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-luxe-gold" />
                Bearbeiter zuweisen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.assigned_to_email ? (
                <p className="text-white text-sm">
                  <span className="text-luxe-silver">Aktuell:</span>{' '}
                  <span className="font-medium text-luxe-gold">{order.assigned_to_email}</span>
                  {order.assigned_at && <span className="text-luxe-silver text-xs ml-2">seit {formatDate(order.assigned_at)}</span>}
                </p>
              ) : (
                <p className="text-luxe-silver text-sm">Niemand zugewiesen</p>
              )}
              <div className="flex flex-col gap-2">
                <select
                  value={order.assigned_to_email ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    assignTo(v ? v : null)
                  }}
                  disabled={updatingAssignment}
                  className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm disabled:opacity-50"
                >
                  <option value="">— Freigeben / Niemand —</option>
                  {assignableStaff.map((s) => (
                    <option key={s.id} value={s.email}>
                      {s.displayName}{s.email !== s.displayName ? ` (${s.email})` : ''}
                    </option>
                  ))}
                </select>
                {currentUserEmail && (
                  <div className="flex gap-2">
                    <button
                      onClick={assignToMe}
                      disabled={updatingAssignment}
                      className="flex-1 px-3 py-2 bg-luxe-gold hover:bg-luxe-gold/80 text-luxe-black rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {updatingAssignment ? '…' : 'Schnell: Mich zuweisen'}
                    </button>
                    {order.assigned_to_email === currentUserEmail && (
                      <button
                        onClick={releaseAssignment}
                        disabled={updatingAssignment}
                        className="px-3 py-2 bg-luxe-gray hover:bg-luxe-silver/20 border border-luxe-silver rounded-md text-white text-sm disabled:opacity-50"
                      >
                        Freigeben
                      </button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Bearbeitungsstatus für Kollegen (einklappbar) */}
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <button
              type="button"
              onClick={() => setProcessingExpanded(!processingExpanded)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <CardTitle className="text-white text-base">Bearbeitungsstatus für Kollegen</CardTitle>
              {processingExpanded ? <ChevronUp className="w-4 h-4 text-luxe-silver" /> : <ChevronDown className="w-4 h-4 text-luxe-silver" />}
            </button>
            {processingExpanded && (
            <CardContent className="pt-0 space-y-3">
              <p className="text-xs text-luxe-silver">
                Damit andere sehen, wo du stehst (z. B. welche Pakete befüllt, Verpackung).
              </p>
              <select
                value={processingStatusInput}
                onChange={(e) => setProcessingStatusInput(e.target.value)}
                className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
              >
                <option value="">— Kein Status —</option>
                <option value="picking">Befüllung (Picking)</option>
                <option value="packing">Verpackung</option>
                <option value="packed">Verpackt</option>
                <option value="ready_to_ship">Bereit zum Versand</option>
              </select>
              <textarea
                value={processingNotesInput}
                onChange={(e) => setProcessingNotesInput(e.target.value)}
                placeholder="z. B. Paket 1 & 2 befüllt, Paket 3 offen …"
                rows={3}
                className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver text-sm resize-y"
              />
              <button
                type="button"
                onClick={() => saveProcessingStatus(processingStatusInput, processingNotesInput)}
                disabled={savingProcessing}
                className="w-full py-2 rounded-md bg-luxe-gold text-luxe-black font-semibold text-sm hover:bg-luxe-gold/90 disabled:opacity-50"
              >
                {savingProcessing ? 'Speichern…' : 'Bearbeitungsstatus speichern'}
              </button>
            </CardContent>
            )}
          </Card>

          {/* Status Management */}
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Status ändern</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                value={order.status}
                onChange={(e) => updateStatus(e.target.value)}
                className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white"
              >
                <option value="pending">Ausstehend</option>
                <option value="processing">In Bearbeitung</option>
                <option value="shipped">Versandt</option>
                <option value="delivered">Zugestellt</option>
                <option value="cancellation_requested">Stornierung beantragt</option>
                <option value="cancellation_rejected">Stornierung abgelehnt</option>
                <option value="return_requested">Rücksendung beantragt</option>
                <option value="return_rejected">Rücksendung abgelehnt</option>
                <option value="return_completed">Rücksendung abgeschlossen</option>
                <option value="cancelled">Storniert</option>
              </select>
              <p className="text-xs text-luxe-silver">
                Ändere den Bestellstatus
              </p>
              {(order.payment_status || 'pending') !== 'paid' && (
                <div className="pt-3 border-t border-luxe-gray mt-3">
                  <button
                    type="button"
                    onClick={syncPaymentFromMollie}
                    disabled={syncingPayment}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-luxe-gold/20 border border-luxe-gold/50 rounded-md text-luxe-gold hover:bg-luxe-gold/30 disabled:opacity-50 text-sm font-medium"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingPayment ? 'animate-spin' : ''}`} />
                    {syncingPayment ? 'Prüfe Mollie…' : 'Zahlungsstatus von Mollie abgleichen'}
                  </button>
                  <p className="text-xs text-luxe-silver mt-2">
                    Prüft bei Mollie, ob die Zahlung eingegangen ist, und übernimmt den Status.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sendungsverfolgung – mehrere Pakete pro Bestellung */}
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Truck className="w-5 h-5 mr-2 text-luxe-gold" />
                Sendungsverfolgung
                {shipments.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-luxe-silver">({shipments.length} Paket{shipments.length !== 1 ? 'e' : ''})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fulfillmentRoutes && fulfillmentRoutes.routes.length > 0 && (
                <div className="mb-4 p-3 bg-luxe-gray/50 rounded-lg">
                  <p className="text-xs font-medium text-luxe-silver mb-2">Fulfillment-Routing (FBA/FBM)</p>
                  <div className="space-y-1">
                    {fulfillmentRoutes.routes.map((r) => (
                      <div key={r.order_line_id} className="flex justify-between text-sm">
                        <span className="text-white">{r.shipped_by_label}</span>
                        <span className="text-luxe-silver">{formatPrice(r.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-luxe-silver mt-2">
                    Shop: {fulfillmentRoutes.shopFulfilledCount} · Vendor: {fulfillmentRoutes.vendorFulfilledCount} · FBA: {fulfillmentRoutes.fbaCount}
                  </p>
                </div>
              )}
              <div className="mb-4 p-3 bg-luxe-gray/50 rounded-lg space-y-1 text-xs text-luxe-silver">
                <p><strong className="text-white">Automatisch:</strong> Die Lieferadresse der Bestellung wird für das Label übernommen – keine manuelle Eingabe nötig.</p>
                <p>Die Abrechnung läuft über Ihren Vertrag beim gewählten Versanddienstleister (DHL EKP, GLS ShipIT, etc.).</p>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <select
                  value={labelCarrier}
                  onChange={(e) => setLabelCarrier(e.target.value as 'DHL' | 'DPD' | 'GLS' | 'Hermes' | 'UPS')}
                  className="px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm min-w-[120px]"
                >
                  <option value="DHL">DHL</option>
                  <option value="DPD">DPD</option>
                  <option value="GLS">GLS</option>
                  <option value="Hermes">Hermes</option>
                  <option value="UPS">UPS</option>
                </select>
                <button
                  type="button"
                  onClick={createLabel}
                  disabled={
                    !!(
                      creatingLabel ||
                      !order?.shipping_address ||
                      (fulfillmentRoutes && fulfillmentRoutes.routes.length > 0 && fulfillmentRoutes.shopFulfilledCount === 0)
                    )
                  }
                  className="flex-1 min-w-[140px] py-2.5 rounded-md bg-luxe-gold text-luxe-black font-semibold text-sm hover:bg-luxe-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingLabel ? 'Label wird erstellt…' : `${labelCarrier} Label erstellen`}
                </button>
              </div>
              <p className="text-xs text-luxe-silver -mt-2 mb-4">
                DHL &amp; GLS: Label direkt per API. DPD, Hermes, UPS: Portal öffnet sich zum Erstellen des Labels.
              </p>
              {fulfillmentRoutes && fulfillmentRoutes.routes.length > 0 && fulfillmentRoutes.shopFulfilledCount === 0 && (
                <p className="text-xs text-amber-400/90 -mt-3 mb-4">
                  DHL Label nur für Shop-versendete Pakete (FBM). Diese Bestellung wird von Vendor/FBA versendet.
                </p>
              )}
              {order?.has_adult_items && (
                <p className="text-xs text-luxe-silver mb-4">
                  Bei 18+ Bestellungen wird automatisch Alterssichtprüfung (VisualCheckOfAge) gebucht.
                </p>
              )}
              {shipments.length > 0 && (
                <div className="space-y-2 mb-4">
                  {shipments.map((s) => {
                    const packItems = itemsByShipment[s.id] ?? []
                    return (
                      <div key={s.id} className="p-3 bg-luxe-gray rounded-lg flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-luxe-silver mb-0.5">{s.tracking_carrier || 'DHL'}</p>
                          <p className="text-white font-mono font-semibold break-all text-sm">{s.tracking_number}</p>
                          {packItems.length > 0 && (
                            <p className="text-xs text-white/80 mt-1.5">
                              In diesem Paket: {packItems.map((i) => `${i.quantity}× ${i.product_name}`).join(', ')}
                            </p>
                          )}
                          {packItems.length === 0 && (
                            <p className="text-xs text-luxe-silver/80 mt-1.5 italic">Kein Inhalt zugeordnet</p>
                          )}
                          {s.shipped_at && (
                            <p className="text-xs text-luxe-silver mt-0.5">
                              Versandt: {new Date(s.shipped_at).toLocaleString('de-DE')}
                            </p>
                          )}
                          {s.delivered_at && (
                            <p className="text-xs text-green-400 mt-0.5">
                              Zugestellt: {new Date(s.delivered_at).toLocaleString('de-DE')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              const init: Record<string, number> = {}
                              packItems.forEach((i) => { init[i.order_item_id] = i.quantity })
                              shipmentContentQuantitiesRef.current = { ...init }
                              setShipmentContentQuantities(init)
                              setEditingShipmentContent(s.id)
                            }}
                            className="text-xs text-luxe-gold hover:underline"
                          >
                            Inhalt bearbeiten
                          </button>
                          {s.label_url && (
                            <>
                              <a
                                href={`/admin/orders/${encodeURIComponent(orderId)}/print-label?shipmentId=${encodeURIComponent(s.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-luxe-gold hover:underline"
                              >
                                Label drucken
                              </a>
                              <a
                                href={s.label_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-luxe-gold hover:underline"
                              >
                                Label PDF
                              </a>
                            </>
                          )}
                          <a
                            href={getTrackingUrl(s.tracking_carrier || 'DHL', s.tracking_number)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-luxe-gold hover:underline"
                          >
                            Verfolgen →
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-luxe-silver mb-1">Weitere Sendung hinzufügen (z. B. bei mehreren Paketen)</p>
              <select
                value={trackingCarrier}
                onChange={(e) => setTrackingCarrier(e.target.value)}
                className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
              >
                <option value="DHL">DHL</option>
                <option value="DPD">DPD</option>
                <option value="GLS">GLS</option>
                <option value="Hermes">Hermes</option>
                <option value="UPS">UPS</option>
              </select>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                placeholder="Sendungsnummer eingeben"
                className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-luxe-silver text-sm"
              />
              <p className="text-xs text-luxe-silver mt-2 mb-1">Inhalt dieses Pakets (optional)</p>
              <div className="space-y-1.5 mb-3 max-h-32 overflow-y-auto rounded bg-luxe-gray/50 p-2">
                {orderItems.filter((item) => (item.item_status == null || item.item_status === 'active')).map((item) => {
                  const q = newShipmentItems[item.id] ?? 0
                  const maxQ = item.quantity
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-white truncate flex-1 min-w-0">{item.product_name}</span>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const next = Math.max(0, q - 1)
                            setNewShipmentItems((prev) => (next === 0 ? (() => { const n = { ...prev }; delete n[item.id]; return n; })() : { ...prev, [item.id]: next }))
                          }}
                          disabled={q <= 0}
                          className="p-1 rounded-md bg-luxe-gray border border-luxe-silver text-white hover:bg-luxe-gray/80 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Menge verringern"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-medium text-white tabular-nums">{q}</span>
                        <button
                          type="button"
                          onClick={() => setNewShipmentItems((prev) => ({ ...prev, [item.id]: Math.min(maxQ, (prev[item.id] ?? 0) + 1) }))}
                          disabled={q >= maxQ}
                          className="p-1 rounded-md bg-luxe-gray border border-luxe-silver text-white hover:bg-luxe-gray/80 disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label="Menge erhöhen"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-luxe-silver text-xs w-6 text-right">/ {maxQ}</span>
                    </div>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={saveTracking}
                disabled={savingTracking || !trackingInput.trim()}
                className="w-full py-2 rounded-md bg-luxe-gold text-luxe-black font-semibold text-sm hover:bg-luxe-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingTracking ? 'Speichern…' : 'Sendung hinzufügen'}
              </button>
              <p className="text-xs text-luxe-silver">
                Fügt die Sendung zur Bestellung hinzu und setzt den Status auf „Versandt“. E-Mail unten separat versenden.
              </p>
              {shipments.length > 0 && (
                <>
                  <div className="border-t border-luxe-gray my-4" />
                  <button
                    type="button"
                    onClick={sendShippingEmail}
                    disabled={sendingShippingEmail}
                    className="w-full py-2 rounded-md bg-luxe-charcoal border border-luxe-gold text-luxe-gold font-semibold text-sm hover:bg-luxe-gold/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingShippingEmail ? 'Wird gesendet…' : `E-Mail mit allen ${shipments.length} Sendungsnummer(n) an Kunden senden`}
                  </button>
                  <p className="text-xs text-luxe-silver">
                    Eine E-Mail mit allen Sendungsnummern wird an {order?.customer_email} gesendet.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Verknüpfte Anfragen (einklappbar) */}
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <button
              type="button"
              onClick={() => setInquiriesExpanded(!inquiriesExpanded)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <CardTitle className="text-white text-base flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-luxe-gold" />
                Anfragen ({linkedInquiries.length})
              </CardTitle>
              {inquiriesExpanded ? <ChevronUp className="w-4 h-4 text-luxe-silver" /> : <ChevronDown className="w-4 h-4 text-luxe-silver" />}
            </button>
            {inquiriesExpanded && (
            <CardContent className="pt-0">
              {linkedInquiries.length === 0 ? (
                <p className="text-luxe-silver text-sm">Keine verknüpften Anfragen.</p>
              ) : (
                <div className="space-y-2">
                  {linkedInquiries.map((inq) => (
                    <Link
                      key={inq.id}
                      href={`/admin/support/${inq.id}`}
                      className="block p-3 rounded-lg bg-luxe-gray hover:bg-luxe-gray/80 border border-luxe-gray hover:border-luxe-gold/30 transition-colors"
                    >
                      <p className="text-white text-sm font-medium truncate">{inq.subject || 'Ohne Betreff'}</p>
                      <p className="text-luxe-silver text-xs mt-0.5">
                        {formatDate(inq.created_at)}
                        {inq.status === 'open' && <span className="ml-2 text-amber-400">• Offen</span>}
                        {inq.status === 'answered' && <span className="ml-2 text-green-400">• Beantwortet</span>}
                        {inq.status === 'closed' && <span className="ml-2">• Erledigt</span>}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
            )}
          </Card>

          {/* Protokoll (einklappbar) */}
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <button
              type="button"
              onClick={() => setAuditExpanded(!auditExpanded)}
              className="w-full flex items-center justify-between px-6 py-4 text-left"
            >
              <CardTitle className="text-white text-base flex items-center">
                <History className="w-5 h-5 mr-2 text-luxe-gold" />
                Protokoll ({auditEntries.length})
              </CardTitle>
              {auditExpanded ? <ChevronUp className="w-4 h-4 text-luxe-silver" /> : <ChevronDown className="w-4 h-4 text-luxe-silver" />}
            </button>
            {auditExpanded && (
            <CardContent className="pt-0">
              {auditLoading ? (
                <p className="text-luxe-silver text-sm py-4 text-center">Wird geladen…</p>
              ) : auditEntries.length === 0 ? (
                <p className="text-luxe-silver text-sm py-4">Noch keine Änderungen protokolliert.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {auditEntries.map((e) => (
                    <div key={e.id} className="text-sm border-b border-luxe-gray pb-2 last:border-0 last:pb-0">
                      <p className="text-luxe-silver text-xs mb-0.5">
                        {new Date(e.created_at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {e.changed_by_email && <span className="ml-2">• {e.changed_by_email}</span>}
                      </p>
                      <p className="text-white">
                        <span className="text-luxe-gold capitalize">{formatAuditField(e.field_name)}:</span>{' '}
                        <span className="text-red-400/90 line-through">{formatAuditValue(e.field_name, e.old_value) || '–'}</span>
                        {' → '}
                        <span className="text-green-400">{formatAuditValue(e.field_name, e.new_value) || '–'}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            )}
          </Card>

          {/* Order Summary */}
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.has_adult_items && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4" title="Beim Erstellen des Versandetiketts: DHL-Service „Alterssichtprüfung ab 18 Jahren“ wählen">
                  <p className="text-red-400 text-sm font-medium">
                    🔞 Alterssichtprüfung ab 18 Jahren (DHL)
                  </p>
                  <p className="text-red-400/80 text-xs mt-1">
                    Zustellung mit Ausweiskontrolle. Beim Versandetikett diesen Service aktivieren.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between text-luxe-silver text-sm">
                  <span>Zwischensumme</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-luxe-silver text-sm">
                  <span>Versandkosten</span>
                  <span>{formatPrice(order.shipping_cost)}</span>
                </div>
                {order.has_adult_items && (
                  <div className="flex justify-between text-red-400 text-sm">
                    <span>DHL Ident-Check</span>
                    <span>inkl.</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-luxe-gray">
                  <span className="text-white font-bold">Gesamt</span>
                  <span className="text-luxe-gold font-bold text-xl">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-luxe-gray">
                <p className="text-xs text-luxe-silver">
                  {orderItems.length} Artikel
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
