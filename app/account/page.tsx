'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Mail, Package, LogOut, ShoppingBag, Calendar, MapPin, Plus, Pencil, Trash2, Star, FileText, XCircle, Truck, Undo2, Gift, UserPlus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getCurrentUser, signOut } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { getStableSpruch } from '@/lib/copy'
import { CANCELLATION_REASONS } from '@/lib/cancellation-reasons'
import { RETURN_REASONS } from '@/lib/return-reasons'
import { formatReturnOptionPrice, getCarrierLabel, carrierSupportsQr } from '@/lib/return-shipping-carriers'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { getTrackingUrl } from '@/lib/tracking-urls'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface OrderItem {
  id: string
  product_name: string
  product_image: string | null
  quantity: number
  product_id?: string
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
  status: string
  has_adult_items: boolean
  items_count: number
  order_items?: OrderItem[]
  shipments?: Shipment[]
  invoice_url?: string | null
  payment_status?: string
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
  return_carrier_preference?: string | null
  return_method_preference?: string | null
}

interface SavedAddress {
  id: string
  label: string | null
  first_name: string
  last_name: string
  street: string
  house_number: string
  postal_code: string
  city: string
  country: string
  phone: string
  is_default: boolean
}

const emptyAddress = {
  label: '',
  first_name: '',
  last_name: '',
  street: '',
  house_number: '',
  postal_code: '',
  city: '',
  country: 'Deutschland',
  phone: '',
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null)
  const [addressForm, setAddressForm] = useState(emptyAddress)
  const [savingAddress, setSavingAddress] = useState(false)
  const [ordersDisplayLimit, setOrdersDisplayLimit] = useState(10)
  const [activeSection, setActiveSection] = useState<'profil' | 'adressen' | 'bestellungen' | 'newsletter'>('profil')
  const [cancelRequestOrderId, setCancelRequestOrderId] = useState<string | null>(null)
  const [cancelRequestReason, setCancelRequestReason] = useState<string>('')
  const [cancelRequestReasonOther, setCancelRequestReasonOther] = useState('')
  const [isSubmittingCancelRequest, setIsSubmittingCancelRequest] = useState(false)
  const [returnRequestOrderId, setReturnRequestOrderId] = useState<string | null>(null)
  const [returnRequestReason, setReturnRequestReason] = useState('')
  const [returnRequestReasonOther, setReturnRequestReasonOther] = useState('')
  const [cancelRequestQuantities, setCancelRequestQuantities] = useState<Record<string, number>>({})
  const [returnRequestQuantities, setReturnRequestQuantities] = useState<Record<string, number>>({})
  const [returnCarrierOptions, setReturnCarrierOptions] = useState<{ value: string; label: string; price_cents: number; supports_qr?: boolean }[]>([])
  const [preferredCarrier, setPreferredCarrier] = useState('')
  const [returnMethodPreference, setReturnMethodPreference] = useState<'printed_code' | 'qr_code'>('qr_code')
  const [isSubmittingReturnRequest, setIsSubmittingReturnRequest] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [newsletterResult, setNewsletterResult] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const displayedOrders = orders.slice(0, ordersDisplayLimit)
  const hasMoreOrders = orders.length > ordersDisplayLimit

  // Nur nicht stornierte Bestellungen für Umsatz
  const ordersPaid = orders.filter((o) => o.status !== 'cancelled')

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()
  const spentThisMonth = ordersPaid
    .filter((o) => {
      const d = new Date(o.created_at)
      return d.getFullYear() === thisYear && d.getMonth() === thisMonth
    })
    .reduce((sum, o) => sum + o.total, 0)
  // URL-Hash für direkte Links (z. B. /account#bestellungen)
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
    if (hash === 'profil' || hash === 'adressen' || hash === 'bestellungen' || hash === 'newsletter') {
      setActiveSection(hash)
    }
  }, [])
  const setSectionAndHash = (section: 'profil' | 'adressen' | 'bestellungen' | 'newsletter') => {
    setActiveSection(section)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${section}`)
    }
  }

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser()
      
      if (!currentUser) {
        router.push('/auth?redirect=/account')
        return
      }

      setUser(currentUser)

      // Bestellungen inkl. Artikel (Produktname, Bild) laden
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items ( id, product_name, product_image, quantity, product_id )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const orderIds = (ordersData || []).map((o: any) => o.id).filter(Boolean)
      let shipmentsByOrder = new Map<string, Shipment[]>()
      if (orderIds.length > 0) {
        const { data: shipmentsData } = await supabase
          .from('order_shipments')
          .select('id, order_id, tracking_number, tracking_carrier')
          .in('order_id', orderIds)
          .order('created_at', { ascending: true })
        if (shipmentsData) {
          for (const s of shipmentsData) {
            const list = shipmentsByOrder.get(s.order_id) ?? []
            list.push({ id: s.id, tracking_number: s.tracking_number, tracking_carrier: s.tracking_carrier ?? null })
            shipmentsByOrder.set(s.order_id, list)
          }
        }
      }

      const ordersWithItems = (ordersData || []).map((order: any) => {
        const items: OrderItem[] = order?.order_items ?? []
        const shipments = shipmentsByOrder.get(order.id) ?? []
        return {
          ...order,
          order_items: items,
          items_count: items.length,
          shipments: shipments.length > 0 ? shipments : undefined,
        }
      })

      setOrders(ordersWithItems)

      const { data: addressesData } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('is_default', { ascending: false })
      setAddresses(addressesData || [])

      setNewsletterEmail(currentUser.email ?? '')
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openAddAddress = () => {
    setEditingAddress(null)
    setAddressForm(emptyAddress)
    setAddressDialogOpen(true)
  }
  const openEditAddress = (a: SavedAddress) => {
    setEditingAddress(a)
    setAddressForm({
      label: a.label ?? '',
      first_name: a.first_name,
      last_name: a.last_name,
      street: a.street,
      house_number: a.house_number,
      postal_code: a.postal_code,
      city: a.city,
      country: a.country,
      phone: a.phone,
    })
    setAddressDialogOpen(true)
  }
  const closeAddressDialog = () => {
    setAddressDialogOpen(false)
    setEditingAddress(null)
    setAddressForm(emptyAddress)
  }

  const saveAddress = async () => {
    if (!user?.id) return
    if (!addressForm.first_name?.trim() || !addressForm.last_name?.trim() || !addressForm.street?.trim() || !addressForm.house_number?.trim() || !addressForm.postal_code?.trim() || !addressForm.city?.trim() || !addressForm.phone?.trim()) {
      toast({ title: 'Bitte alle Pflichtfelder ausfüllen', variant: 'destructive' })
      return
    }
    setSavingAddress(true)
    try {
      const payload = {
        user_id: user.id,
        label: addressForm.label?.trim() || null,
        first_name: addressForm.first_name.trim(),
        last_name: addressForm.last_name.trim(),
        street: addressForm.street.trim(),
        house_number: addressForm.house_number.trim(),
        postal_code: addressForm.postal_code.trim(),
        city: addressForm.city.trim(),
        country: addressForm.country.trim() || 'Deutschland',
        phone: addressForm.phone.trim(),
        is_default: addresses.length === 0 && !editingAddress,
      }
      if (editingAddress) {
        const { error } = await supabase.from('customer_addresses').update(payload).eq('id', editingAddress.id)
        if (error) throw error
        toast({ title: 'Adresse aktualisiert' })
        setAddresses(prev => prev.map(a => a.id === editingAddress.id ? { ...a, ...payload } : a))
      } else {
        const { data, error } = await supabase.from('customer_addresses').insert(payload).select('*').single()
        if (error) throw error
        toast({ title: 'Adresse hinzugefügt' })
        setAddresses(prev => [...prev, { ...data, is_default: payload.is_default }])
      }
      closeAddressDialog()
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' })
    } finally {
      setSavingAddress(false)
    }
  }

  const setDefaultAddress = async (id: string) => {
    if (!user?.id) return
    try {
      await supabase.from('customer_addresses').update({ is_default: true }).eq('id', id).eq('user_id', user.id)
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })))
      toast({ title: 'Standardadresse gesetzt' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const deleteAddress = async (id: string) => {
    if (!confirm('Adresse wirklich löschen?')) return
    try {
      await supabase.from('customer_addresses').delete().eq('id', id)
      setAddresses(prev => prev.filter(a => a.id !== id))
      toast({ title: 'Adresse gelöscht' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const handleOpenCancelRequest = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    const items = order?.order_items ?? []
    const hasPending = !!(order?.cancellation_requested_at && (order.cancellation_request_status === 'pending' || !order.cancellation_request_status))
    setCancelRequestOrderId(orderId)
    setCancelRequestReason('')
    setCancelRequestReasonOther('')
    const init: Record<string, number> = {}
    if (hasPending && orderId) {
      try {
        const res = await fetch(`/api/account/orders/${orderId}/request-items`)
        const data = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(data.cancellation)) {
          data.cancellation.forEach((r: { order_item_id: string; requested_quantity?: number; max_cancel?: number }) => {
            const item = items.find((i) => i.id === r.order_item_id)
            const max = r.max_cancel ?? (item ? Math.max(0, item.quantity - (item.cancelled_quantity ?? 0)) : 0)
            init[r.order_item_id] = r.requested_quantity ?? max
          })
        }
      } catch { /* fallback: max available */ }
    }
    items.forEach((i) => {
      if (!(i.id in init)) init[i.id] = Math.max(0, i.quantity - (i.cancelled_quantity ?? 0))
    })
    setCancelRequestQuantities(init)
  }

  const handleCloseCancelRequest = () => {
    setCancelRequestOrderId(null)
    setCancelRequestReason('')
    setCancelRequestReasonOther('')
    setCancelRequestQuantities({})
  }

  const handleSubmitCancelRequest = async () => {
    if (!cancelRequestOrderId) return
    const order = orders.find((o) => o.id === cancelRequestOrderId)
    const items = order?.order_items ?? []
    const cancelItems = items
      .filter((i) => (cancelRequestQuantities[i.id] ?? 0) > 0)
      .map((i) => ({ order_item_id: i.id, quantity: Math.min(cancelRequestQuantities[i.id] ?? 0, Math.max(0, i.quantity - (i.cancelled_quantity ?? 0))) }))
      .filter((x) => x.quantity > 0)
    if (items.length > 0 && cancelItems.length === 0) {
      toast({ title: 'Bitte gib mindestens bei einem Artikel die Menge an', variant: 'destructive' })
      return
    }
    setIsSubmittingCancelRequest(true)
    try {
      const res = await fetch(`/api/account/orders/${cancelRequestOrderId}/request-cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: cancelRequestReason || undefined,
          reason_other: cancelRequestReasonOther || undefined,
          items: cancelItems.length > 0 ? cancelItems : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Anfrage fehlgeschlagen', description: data.error, variant: 'destructive' })
        return
      }
      const requestedAt = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelRequestOrderId
            ? { ...o, cancellation_requested_at: requestedAt, cancellation_reason: cancelRequestReason || null, cancellation_reason_other: cancelRequestReasonOther || null }
            : o
        )
      )
      handleCloseCancelRequest()
      toast({ title: 'Stornierung angefragt', description: data.message })
    } catch {
      toast({ title: 'Fehler', description: 'Anfrage konnte nicht gesendet werden.', variant: 'destructive' })
    } finally {
      setIsSubmittingCancelRequest(false)
    }
  }

  const handleOpenReturnRequest = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId)
    const items = order?.order_items ?? []
    const hasPending = !!(order?.return_requested_at && (order.return_request_status === 'pending' || !order.return_request_status))
    setReturnRequestOrderId(orderId)
    setReturnRequestReason('')
    setReturnRequestReasonOther('')
    setPreferredCarrier('')
    const init: Record<string, number> = {}
    if (hasPending && orderId) {
      try {
        const res = await fetch(`/api/account/orders/${orderId}/request-items`)
        const data = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(data.return)) {
          data.return.forEach((r: { order_item_id: string; requested_quantity?: number; max_return?: number }) => {
            const item = items.find((i) => i.id === r.order_item_id)
            const max = r.max_return ?? (item ? Math.max(0, item.quantity - (item.returned_quantity ?? 0)) : 0)
            init[r.order_item_id] = r.requested_quantity ?? max
          })
        }
      } catch { /* fallback: max available */ }
    }
    items.forEach((i) => {
      if (!(i.id in init)) init[i.id] = Math.max(0, i.quantity - (i.returned_quantity ?? 0))
    })
    setReturnRequestQuantities(init)
    if (returnCarrierOptions.length === 0) {
      fetch('/api/return-carrier-prices')
        .then((res) => res.ok ? res.json() : { carriers: [] })
        .then((data: { carriers?: { value: string; label: string; price_cents: number }[] }) => setReturnCarrierOptions(data.carriers ?? []))
        .catch(() => setReturnCarrierOptions([]))
    }
  }

  const handleCloseReturnRequest = () => {
    setReturnRequestOrderId(null)
    setReturnRequestReason('')
    setReturnRequestReasonOther('')
    setReturnRequestQuantities({})
    setPreferredCarrier('')
    setReturnMethodPreference('qr_code')
  }

  const handleSubmitReturnRequest = async () => {
    if (!returnRequestOrderId) return
    const order = orders.find((o) => o.id === returnRequestOrderId)
    const items = order?.order_items ?? []
    const returnItems = items
      .filter((i) => (returnRequestQuantities[i.id] ?? 0) > 0)
      .map((i) => ({ order_item_id: i.id, quantity: Math.min(returnRequestQuantities[i.id] ?? 0, Math.max(0, i.quantity - (i.returned_quantity ?? 0))) }))
      .filter((x) => x.quantity > 0)
    if (items.length > 0 && returnItems.length === 0) {
      toast({ title: 'Bitte gib mindestens bei einem Artikel die Menge an', variant: 'destructive' })
      return
    }
    const hasPendingReturn = order?.return_requested_at && (order.return_request_status === 'pending' || !order.return_request_status)
    if (!hasPendingReturn && (!preferredCarrier || !returnCarrierOptions.some((c) => c.value === preferredCarrier))) {
      toast({ title: 'Bitte wähle einen Versanddienstleister für die Rücksendung', variant: 'destructive' })
      return
    }
    if (!hasPendingReturn && !returnMethodPreference) {
      toast({ title: 'Bitte wähle, wie du die Retoure verschicken möchtest (gedruckter Code oder QR-Code)', variant: 'destructive' })
      return
    }
    setIsSubmittingReturnRequest(true)
    try {
      const res = await fetch(`/api/account/orders/${returnRequestOrderId}/request-return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: returnRequestReason || undefined,
          reason_other: returnRequestReasonOther || undefined,
          items: returnItems.length > 0 ? returnItems : undefined,
          preferred_carrier: preferredCarrier || undefined,
          return_method_preference: returnMethodPreference || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Anfrage fehlgeschlagen', description: data.error, variant: 'destructive' })
        return
      }
      const requestedAt = new Date().toISOString()
      setOrders((prev) =>
        prev.map((o) =>
          o.id === returnRequestOrderId
            ? { ...o, return_requested_at: requestedAt, return_reason: returnRequestReason || null, return_reason_other: returnRequestReasonOther || null }
            : o
        )
      )
      handleCloseReturnRequest()
      toast({ title: 'Rücksendung angefragt', description: data.message })
    } catch {
      toast({ title: 'Fehler', description: 'Anfrage konnte nicht gesendet werden.', variant: 'destructive' })
    } finally {
      setIsSubmittingReturnRequest(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: 'Erfolgreich abgemeldet',
        description: 'Bis bald!',
      })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <div className="text-white">Laden...</div>
      </div>
    )
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
      case 'pending': return 'Ausstehend'
      default: return status ? status : 'Ausstehend'
    }
  }

  const tabs = [
    { id: 'profil' as const, label: 'Profil', icon: User },
    { id: 'adressen' as const, label: 'Adressen', icon: MapPin },
    { id: 'bestellungen' as const, label: 'Bestellungen', icon: ShoppingBag },
    { id: 'newsletter' as const, label: 'Newsletter', icon: Mail },
  ]

  return (
    <>
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Mein Konto</h1>
          <p className="text-luxe-silver text-sm">Wähle einen Bereich – du siehst nur den ausgewählten Inhalt.</p>
        </div>

        {/* Tab-Navigation */}
        <nav className="flex border-b border-luxe-gray mb-8" aria-label="Kontobereiche">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeSection === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSectionAndHash(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors touch-target',
                  isActive
                    ? 'border-luxe-gold text-luxe-gold'
                    : 'border-transparent text-luxe-silver hover:text-white'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Nur der gewählte Bereich wird angezeigt */}
        {activeSection === 'profil' && (
          <section id="profil" className="animate-in fade-in duration-200">
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-luxe-gold to-luxe-neon rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-luxe-black" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-luxe-silver">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-luxe-silver">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Mitglied seit {formatDate(user?.created_at || new Date())}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-luxe-silver">
                    <Package className="w-4 h-4" />
                    <span className="text-sm">
                      {ordersPaid.length} Bestellungen
                      {orders.length > ordersPaid.length && (
                        <span className="text-luxe-silver/80"> ({orders.length - ordersPaid.length} storniert)</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="pt-6 border-t border-luxe-gray text-center">
                  <div className="text-2xl font-bold text-white">{ordersPaid.length}</div>
                  <div className="text-xs text-luxe-silver">Bestellungen (ohne Storn.)</div>
                </div>
                <div className="pt-4 border-t border-luxe-gray">
                  <p className="text-sm text-luxe-silver">
                    Du hast in diesem Monat <span className="font-semibold text-white">{formatPrice(spentThisMonth)}</span> ausgegeben.
                  </p>
                  <p className="text-xs text-luxe-silver/80 mt-1">Jeder Euro gut investiert in dein Setup.</p>
                </div>
                {ordersPaid.length > 0 && (
                  <div className="pt-4 border-t border-luxe-gray p-4 rounded-lg bg-luxe-gold/10 border border-luxe-gold/30">
                    <p className="text-sm font-medium text-white mb-1">Danke für dein Vertrauen!</p>
                    <p className="text-sm text-luxe-silver">
                      Dass du so viel bei uns bestellst, bedeutet uns was. Danke, dass du Teil der Community bist.
                    </p>
                    <p className="text-sm text-luxe-gold mt-2 italic">
                      „{getStableSpruch(user?.id ?? 'guest')}"
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-luxe-gray flex flex-wrap gap-2">
                  <Link
                    href="/account/loyalty"
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-lg border border-luxe-gold/50 bg-luxe-gold/10 text-luxe-gold hover:bg-luxe-gold/20 transition-colors"
                  >
                    <Gift className="w-4 h-4" />
                    Punkte
                  </Link>
                  <Link
                    href="/account/b2b"
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-lg border border-luxe-gold/50 bg-luxe-gold/10 text-luxe-gold hover:bg-luxe-gold/20 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    B2B
                  </Link>
                  <Link
                    href="/account/referral"
                    className="flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-lg border border-luxe-gold/50 bg-luxe-gold/10 text-luxe-gold hover:bg-luxe-gold/20 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Freunde werben
                  </Link>
                </div>
                <div className="pt-4 border-t border-luxe-gray">
                  <Link
                    href="/profile/privacy"
                    className="block w-full text-center py-2.5 text-sm text-luxe-silver hover:text-luxe-gold transition-colors"
                  >
                    Datenschutz & Transparenz (Daten exportieren / Konto löschen)
                  </Link>
                </div>
                <div className="pt-4 border-t border-luxe-gray">
                  <Button onClick={handleLogout} variant="outline" className="w-full border-luxe-gray hover:bg-luxe-gray/20 text-luxe-silver">
                    <LogOut className="w-4 h-4 mr-2" />
                    Abmelden
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === 'adressen' && (
          <section id="adressen" className="animate-in fade-in duration-200">
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="text-lg font-semibold">Meine Adressen</span>
                  <Button size="sm" onClick={openAddAddress} className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90">
                    <Plus className="w-4 h-4 mr-1" />
                    Hinzufügen
                  </Button>
                </CardTitle>
                <p className="text-sm text-luxe-silver mt-1">
                  Die <span className="text-luxe-gold inline-flex items-center gap-0.5"><Star className="w-3.5 h-3.5 fill-current" /> Standard</span>-Adresse wird beim Checkout automatisch vorausgefüllt. Bei anderen Adressen: Stern anklicken, um sie zur Standardadresse zu machen.
                </p>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 ? (
                  <p className="text-luxe-silver text-sm">Noch keine Adressen. Beim Checkout auswählbar, wenn du welche anlegst.</p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="p-4 bg-luxe-gray rounded-lg flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-white text-sm truncate">{addr.label || `${addr.first_name} ${addr.last_name}`}</span>
                            {addr.is_default && (
                              <Badge className="bg-luxe-gold/20 text-luxe-gold border-luxe-gold/50 text-xs shrink-0">
                                <Star className="w-3 h-3 mr-0.5" /> Standard
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-luxe-silver mt-0.5">{addr.street} {addr.house_number}, {addr.postal_code} {addr.city}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!addr.is_default && (
                            <Button size="sm" variant="ghost" className="text-luxe-silver h-8 px-2 text-xs" onClick={() => setDefaultAddress(addr.id)} title="Als Standard">
                              <Star className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="text-luxe-silver h-8 px-2" onClick={() => openEditAddress(addr)} title="Bearbeiten">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 h-8 px-2" onClick={() => deleteAddress(addr.id)} title="Löschen">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === 'bestellungen' && (
          <section id="bestellungen" className="animate-in fade-in duration-200">
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white text-lg font-semibold">
                  Meine Bestellungen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <div className="w-24 h-24 rounded-full bg-luxe-gray/50 flex items-center justify-center mx-auto mb-6">
                      <ShoppingBag className="w-12 h-12 text-luxe-silver/50" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Noch keine Bestellungen
                    </h3>
                    <p className="text-luxe-silver max-w-sm mx-auto mb-8">
                      Deine erste Bestellung wartet – Zeit für ein Upgrade. Sobald du bestellt hast, siehst du hier alle Details und den Versandstatus.
                    </p>
                    <Link
                      href="/shop"
                      className="inline-flex items-center justify-center h-12 rounded-lg px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
                    >
                      Jetzt shoppen
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.3) }}
                        className="p-4 sm:p-5 bg-luxe-gray rounded-lg hover:bg-luxe-gray/80 transition-colors"
                      >
                        <div className="flex gap-4 sm:gap-6 items-stretch">
                          {/* Links: Produktvorschau (kompakt) */}
                          <div className="flex items-center gap-2 shrink-0">
                            {(order.order_items?.length ?? 0) > 0 ? (
                              <>
                                {order.order_items!.slice(0, 3).map((item) => (
                                  <div key={item.id} className="w-11 h-11 rounded-lg bg-luxe-black overflow-hidden flex-shrink-0">
                                    {item.product_image ? (
                                      <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-luxe-silver">
                                        <Package className="w-5 h-5" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {(order.items_count ?? 0) > 3 && (
                                  <span className="text-luxe-silver text-xs font-medium">+{(order.items_count ?? 0) - 3}</span>
                                )}
                              </>
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-luxe-black flex items-center justify-center text-luxe-silver">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          {/* Rechts: Infos rechtbündig */}
                          <div className="flex-1 min-w-0 flex flex-col items-end text-right gap-2">
                            <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                              <span className="text-xs text-luxe-silver">{formatDate(order.created_at)}</span>
                              <span className="text-xs text-luxe-silver">#{order.order_number}</span>
                              <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                              {order.has_adult_items && <Badge variant="adult">18+</Badge>}
                            </div>
                            {(order.status === 'shipped' || order.status === 'delivered') && (() => {
                              const trackings = (order.shipments?.length ? order.shipments : (order.tracking_number ? [{ id: 'single', tracking_number: order.tracking_number, tracking_carrier: order.tracking_carrier ?? null }] : [])) as Shipment[]
                              return trackings.length > 0 ? (
                                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5">
                                  <Truck className="w-3.5 h-3.5 text-luxe-gold shrink-0" />
                                  {trackings.map((s) => (
                                    <a
                                      key={`${order.id}-${s.id}-${s.tracking_number}`}
                                      href={getTrackingUrl(s.tracking_carrier || 'DHL', s.tracking_number)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-mono text-luxe-gold hover:text-luxe-gold/80 transition-colors"
                                      title="Sendung verfolgen"
                                    >
                                      {s.tracking_number}
                                      {s.tracking_carrier && <span className="text-luxe-silver font-sans ml-0.5">({s.tracking_carrier})</span>}
                                    </a>
                                  ))}
                                </div>
                              ) : null
                            })()}
                            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 pt-1 border-t border-luxe-charcoal/80 w-full">
                            <span className="font-semibold text-white">{formatPrice(order.total)}</span>
                              <a
                                href={`/api/account/orders/${order.id}/invoice`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-luxe-gold hover:text-luxe-gold/80 transition-colors"
                                title="Rechnung (PDF)"
                              >
                                <FileText className="w-4 h-4" />
                                Rechnung
                              </a>
                              {['pending', 'processing', 'cancellation_rejected', 'cancellation_requested'].includes(order.status) && (
                                <>
                                  {order.cancellation_request_status === 'rejected' && <span className="text-sm text-luxe-silver italic">Stornierung abgelehnt. </span>}
                                  {(order.cancellation_requested_at && (order.cancellation_request_status === 'pending' || !order.cancellation_request_status)) && (
                                    <span className="text-sm text-luxe-silver italic">Stornierung angefragt. </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCancelRequest(order.id)}
                                    className="inline-flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors"
                                    title={order.cancellation_requested_at && (order.cancellation_request_status === 'pending' || !order.cancellation_request_status) ? 'Weitere Artikel stornieren' : 'Stornierung anfragen'}
                                  >
                                    <XCircle className="w-4 h-4" />
                                    {order.cancellation_requested_at && (order.cancellation_request_status === 'pending' || !order.cancellation_request_status) ? 'Weitere Artikel stornieren' : 'Stornierung anfragen'}
                                  </button>
                                </>
                              )}
                              {['shipped', 'delivered', 'return_rejected', 'return_requested'].includes(order.status) && (
                                <>
                                  {order.return_request_status === 'approved' && <span className="text-sm text-luxe-silver italic">Rücksendung angenommen. </span>}
                                  {order.return_request_status === 'rejected' && <span className="text-sm text-luxe-silver italic">Rücksendung abgelehnt. </span>}
                                  {(order.return_requested_at && (order.return_request_status === 'pending' || !order.return_request_status)) && (
                                    <span className="text-sm text-luxe-silver italic">Rücksendung angefragt. </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReturnRequest(order.id)}
                                    className="inline-flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                                    title={order.return_requested_at && (order.return_request_status === 'pending' || !order.return_request_status) ? 'Weitere Artikel retournieren' : 'Rücksendung anfragen'}
                                  >
                                    <Undo2 className="w-4 h-4" />
                                    {order.return_requested_at && (order.return_request_status === 'pending' || !order.return_request_status) ? 'Weitere Artikel retournieren' : 'Rücksendung anfragen'}
                                  </button>
                                </>
                              )}
                              <Link
                                href={`/account/orders/${order.id}`}
                                className="text-sm font-medium text-luxe-gold hover:text-luxe-gold/80 transition-colors"
                              >
                                Details →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {hasMoreOrders && (
                      <div className="pt-2 text-center">
                        <Button
                          variant="ghost"
                          className="text-luxe-silver hover:text-white"
                          onClick={() => setOrdersDisplayLimit(prev => prev + 10)}
                        >
                          Ältere Bestellungen anzeigen ({orders.length - ordersDisplayLimit} weitere)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {activeSection === 'newsletter' && (
          <section id="newsletter" className="animate-in fade-in duration-200">
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-luxe-gold" />
                  Newsletter
                </CardTitle>
                <p className="text-luxe-silver text-sm mt-1">
                  Melde dich mit deiner E-Mail für den Newsletter an und erhalte einen Willkommens-Rabatt (falls konfiguriert).
                </p>
                <p className="text-luxe-silver/40 text-[10px] mt-1">
                  <Link href="/privacy" className="text-luxe-silver/50 hover:underline">Datenschutzerklärung</Link> · Hinweise zum Rabattversand dort.
                </p>
              </CardHeader>
              <CardContent>
                {newsletterResult ? (
                  <div className="rounded-lg border border-luxe-gold/50 bg-luxe-gold/10 p-4">
                    <p className="text-luxe-gold">{newsletterResult}</p>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      if (!newsletterEmail.trim()) return
                      setNewsletterLoading(true)
                      setNewsletterResult(null)
                      try {
                        const res = await fetch('/api/newsletter/signup', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: newsletterEmail.trim(), source: 'account' }),
                        })
                        const data = await res.json()
                        if (!res.ok) {
                          toast({ title: data.error || 'Fehler', variant: 'destructive' })
                          return
                        }
                        setNewsletterResult(data.message || 'Danke!')
                      } catch {
                        toast({ title: 'Fehler', variant: 'destructive' })
                      } finally {
                        setNewsletterLoading(false)
                      }
                    }}
                    className="flex flex-wrap gap-2"
                  >
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="E-Mail-Adresse"
                      required
                      className="flex-1 min-w-[200px] rounded-lg border border-luxe-gray bg-luxe-black/50 px-3 py-2.5 text-white placeholder:text-luxe-silver focus:border-luxe-gold focus:outline-none"
                    />
                    <Button type="submit" disabled={newsletterLoading} variant="luxe">
                      {newsletterLoading ? 'Wird gesendet…' : 'Anmelden'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>

    {/* Dialog: Adresse hinzufügen / bearbeiten */}
    <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Adresse bearbeiten' : 'Neue Adresse'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-luxe-silver">Bezeichnung (optional)</Label>
              <Input
                value={addressForm.label}
                onChange={(e) => setAddressForm(f => ({ ...f, label: e.target.value }))}
                placeholder="z. B. Zuhause, Arbeit"
                className="bg-luxe-gray border-luxe-silver text-white mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-luxe-silver">Vorname *</Label>
                <Input value={addressForm.first_name} onChange={(e) => setAddressForm(f => ({ ...f, first_name: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white mt-1" required />
              </div>
              <div>
                <Label className="text-luxe-silver">Nachname *</Label>
                <Input value={addressForm.last_name} onChange={(e) => setAddressForm(f => ({ ...f, last_name: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white mt-1" required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label className="text-luxe-silver">Straße *</Label>
                <Input value={addressForm.street} onChange={(e) => setAddressForm(f => ({ ...f, street: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white mt-1" required />
              </div>
              <div>
                <Label className="text-luxe-silver">Nr. *</Label>
                <Input value={addressForm.house_number} onChange={(e) => setAddressForm(f => ({ ...f, house_number: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white mt-1" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-luxe-silver">PLZ *</Label>
                <Input value={addressForm.postal_code} onChange={(e) => setAddressForm(f => ({ ...f, postal_code: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white mt-1" required />
              </div>
              <div>
                <Label className="text-luxe-silver">Stadt *</Label>
                <Input value={addressForm.city} onChange={(e) => setAddressForm(f => ({ ...f, city: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white mt-1" required />
              </div>
            </div>
            <div>
              <Label className="text-luxe-silver">Land</Label>
              <Input value={addressForm.country} onChange={(e) => setAddressForm(f => ({ ...f, country: e.target.value }))} className="bg-luxe-gray border-luxe-silver text-white mt-1" />
            </div>
            <div>
              <Label className="text-luxe-silver">Telefon *</Label>
              <Input value={addressForm.phone} onChange={(e) => setAddressForm(f => ({ ...f, phone: e.target.value }))} type="tel" className="bg-luxe-gray border-luxe-silver text-white mt-1" required />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeAddressDialog} className="text-luxe-silver">Abbrechen</Button>
            <Button onClick={saveAddress} disabled={savingAddress} className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90">
              {savingAddress ? 'Speichern…' : (editingAddress ? 'Speichern' : 'Hinzufügen')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    {/* Dialog: Stornierung anfragen */}
    <Dialog open={!!cancelRequestOrderId} onOpenChange={(open) => !open && handleCloseCancelRequest()}>
      <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
        <DialogHeader>
          <DialogTitle>
            {orders.find((o) => o.id === cancelRequestOrderId)?.cancellation_requested_at && (orders.find((o) => o.id === cancelRequestOrderId)?.cancellation_request_status === 'pending' || !orders.find((o) => o.id === cancelRequestOrderId)?.cancellation_request_status)
              ? 'Weitere Artikel zur Stornierung hinzufügen'
              : 'Stornierung anfragen'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-luxe-silver">
          {orders.find((o) => o.id === cancelRequestOrderId)?.cancellation_requested_at && (orders.find((o) => o.id === cancelRequestOrderId)?.cancellation_request_status === 'pending' || !orders.find((o) => o.id === cancelRequestOrderId)?.cancellation_request_status)
            ? 'Wähle zusätzliche Artikel, die du zur Stornierung hinzufügen möchtest.'
            : 'Du kannst keinen direkten Storno auslösen. Wir bearbeiten deine Anfrage und melden uns bei dir. Ein Grund ist optional.'}
        </p>
        <div className="grid gap-4 py-4">
          {(() => {
            const order = orders.find((o) => o.id === cancelRequestOrderId)
            const items = order?.order_items ?? []
            if (items.length === 0) return null
            return (
              <div>
                <Label className="text-luxe-silver">Wie viele Stück pro Artikel stornieren?</Label>
                <p className="text-xs text-luxe-silver/80 mt-0.5">Gib 0 ein, wenn der Artikel nicht betroffen ist.</p>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item) => {
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
            )
          })()}
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
          <Button variant="ghost" onClick={handleCloseCancelRequest} className="text-luxe-silver">Abbrechen</Button>
          <Button onClick={handleSubmitCancelRequest} disabled={isSubmittingCancelRequest} className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90">
            {isSubmittingCancelRequest ? 'Wird gesendet…' : (orders.find((o) => o.id === cancelRequestOrderId)?.cancellation_requested_at && (orders.find((o) => o.id === cancelRequestOrderId)?.cancellation_request_status === 'pending' || !orders.find((o) => o.id === cancelRequestOrderId)?.cancellation_request_status) ? 'Artikel hinzufügen' : 'Anfrage absenden')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Dialog: Rücksendung anfragen */}
    <Dialog open={!!returnRequestOrderId} onOpenChange={(open) => !open && handleCloseReturnRequest()}>
      <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
        <DialogHeader>
          <DialogTitle>
            {orders.find((o) => o.id === returnRequestOrderId)?.return_requested_at && (orders.find((o) => o.id === returnRequestOrderId)?.return_request_status === 'pending' || !orders.find((o) => o.id === returnRequestOrderId)?.return_request_status)
              ? 'Weitere Artikel zur Rücksendung hinzufügen'
              : 'Rücksendung anfragen'}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-luxe-silver">
          {orders.find((o) => o.id === returnRequestOrderId)?.return_requested_at && (orders.find((o) => o.id === returnRequestOrderId)?.return_request_status === 'pending' || !orders.find((o) => o.id === returnRequestOrderId)?.return_request_status)
            ? 'Wähle zusätzliche Artikel, die du zur Rücksendung hinzufügen möchtest.'
            : 'Bevor du die Rücksendung absendest: Wähle die Artikel, den Versanddienstleister und wie du die Retoure verschicken möchtest (gedruckter Code oder QR-Code). Du erhältst entsprechend den passenden Retourencode.'}
        </p>
        <div className="grid gap-4 py-4">
          {(() => {
            const order = orders.find((o) => o.id === returnRequestOrderId)
            const items = order?.order_items ?? []
            if (items.length === 0) return null
            return (
              <div>
                <Label className="text-luxe-silver">1. Welche Artikel möchtest du zurücksenden?</Label>
                <p className="text-xs text-luxe-silver/80 mt-0.5">Gib 0 ein, wenn der Artikel nicht betroffen ist.</p>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item) => {
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
            )
          })()}
          {(() => {
            const order = orders.find((o) => o.id === returnRequestOrderId)
            const hasPending = !!(order?.return_requested_at && (order.return_request_status === 'pending' || !order.return_request_status))
            if (hasPending) return null
            return (
              <>
                <div key="carrier">
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
                <div>
                  <Label className="text-luxe-silver">3. Wie möchtest du die Retoure verschicken? <span className="text-red-400">*</span></Label>
                  {carrierSupportsQr(preferredCarrier) ? (
                    <>
                      <p className="text-xs text-luxe-silver/80 mt-0.5">Du erhältst den passenden Retourencode von uns.</p>
                      <div className="mt-2 space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer rounded-lg border border-luxe-gray p-3 hover:bg-luxe-gray/50 has-[:checked]:border-luxe-gold has-[:checked]:bg-luxe-gold/10">
                          <input
                            type="radio"
                            name="returnMethodPreferenceAccount"
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
                            name="returnMethodPreferenceAccount"
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
              </>
            )
          })()}
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
          <Button variant="ghost" onClick={handleCloseReturnRequest} className="text-luxe-silver">Abbrechen</Button>
          <Button onClick={handleSubmitReturnRequest} disabled={isSubmittingReturnRequest} className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90">
            {isSubmittingReturnRequest ? 'Wird gesendet…' : (orders.find((o) => o.id === returnRequestOrderId)?.return_requested_at && (orders.find((o) => o.id === returnRequestOrderId)?.return_request_status === 'pending' || !orders.find((o) => o.id === returnRequestOrderId)?.return_request_status) ? 'Artikel hinzufügen' : 'Anfrage absenden')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
