'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Search, Package, Mail, MapPin, Calendar, Download, RefreshCw, Filter, User, Truck, RotateCcw, Loader2, ChevronDown, ChevronUp, Wrench } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { formatPrice, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { AdminBereichErklaerung } from '@/components/admin/admin-bereich-erklaerung'

interface OrderItemPreview {
  product_name: string
  quantity: number
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  status: string
  payment_status?: string
  has_adult_items: boolean
  created_at: string
  shipping_address: any
  items_count?: number
  items_preview?: OrderItemPreview[]
  assigned_to_email?: string | null
  assigned_at?: string | null
  supplier_submitted?: boolean
  profit?: number | null
  return_request_status?: string | null
  tracking_number?: string | null
  tracking_carrier?: string | null
}

/** Bezahlt und noch nicht versandt = zum Bearbeiten bereit */
function isReadyToProcess(o: Order) {
  return (o.payment_status || '') === 'paid' && ['pending', 'processing'].includes(o.status)
}

/** Zahlung noch offen (nicht storniert) */
function isPaymentOpen(o: Order) {
  return o.status !== 'cancelled' && (o.payment_status || 'pending') !== 'paid'
}

/** Bestellung abgeschlossen – keine weitere Bearbeitung nötig (auch Rücksendung abgelehnt) */
const COMPLETED_STATUSES = ['delivered', 'return_completed', 'return_rejected', 'cancelled']
function isOrderCompleted(o: Order) {
  return COMPLETED_STATUSES.includes(o.status)
}

function hoursSince(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60)
}

export default function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [paymentFilter, setPaymentFilter] = useState<string>('')
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'mine'>('all')
  const [quickView, setQuickView] = useState<'all' | 'ready' | 'unpaid' | 'mine'>('all')
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [exportYear, setExportYear] = useState<string>('')
  const [bulkShipOpen, setBulkShipOpen] = useState(false)
  const [bulkShipTrackings, setBulkShipTrackings] = useState<Record<string, string>>({})
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkStatusValue, setBulkStatusValue] = useState('shipped')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [syncingPayments, setSyncingPayments] = useState(false)
  const [unpaidCancelHours, setUnpaidCancelHours] = useState<number | null>(null)
  const [toolsExpanded, setToolsExpanded] = useState(false)
  const [orderExpanded, setOrderExpanded] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const toggleOrderExpanded = (id: string) => {
    setOrderExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = ['', currentYear, currentYear - 1, currentYear - 2, currentYear - 3]

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'mine') {
      setQuickView('mine')
      setAssignmentFilter('mine')
    } else if (filter === 'ready') {
      setQuickView('ready')
      setAssignmentFilter('all')
    } else if (filter === 'unpaid') {
      setQuickView('unpaid')
      setAssignmentFilter('all')
    }
  }, [searchParams])

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => data?.user?.email && setCurrentUserEmail(data.user.email))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/settings/unpaid-cancel-hours')
      .then((res) => res.ok ? res.json() : null)
      .then((data: { unpaid_cancel_hours?: number } | null) => data && typeof data.unpaid_cancel_hours === 'number' && setUnpaidCancelHours(data.unpaid_cancel_hours))
      .catch(() => {})
  }, [])

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast({ title: 'Bestellungen konnten nicht geladen werden', description: err.error || res.statusText, variant: 'destructive' })
        setOrders([])
        return
      }
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error in loadOrders:', error)
      toast({ title: 'Fehler', description: 'Bestellungen konnten nicht geladen werden.', variant: 'destructive' })
      setOrders([])
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || res.statusText)
      }
      toast({
        title: 'Status aktualisiert',
        description: `Bestellung wurde auf "${getStatusLabel(newStatus)}" gesetzt.`,
      })
      loadOrders()
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error?.message || 'Status konnte nicht aktualisiert werden.',
        variant: 'destructive',
      })
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
      default: return 'Offen'
    }
  }

  const baseFiltered = orders.filter((o) => {
    const matchesSearch =
      !searchTerm ||
      o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || o.status === statusFilter
    const matchesPayment =
      !paymentFilter || (paymentFilter === 'paid' && o.payment_status === 'paid') || (paymentFilter === 'pending' && (o.payment_status || 'pending') !== 'paid')
    const matchesAssignment =
      assignmentFilter === 'all' || (assignmentFilter === 'mine' && !!currentUserEmail && (o.assigned_to_email || '').toLowerCase() === currentUserEmail.toLowerCase())
    return matchesSearch && matchesStatus && matchesPayment && matchesAssignment
  })

  const filteredOrders =
    quickView === 'ready'
      ? baseFiltered.filter(isReadyToProcess)
      : quickView === 'unpaid'
        ? baseFiltered.filter(isPaymentOpen)
        : quickView === 'mine' && currentUserEmail
          ? baseFiltered.filter((o) => (o.assigned_to_email || '').toLowerCase() === currentUserEmail.toLowerCase() && !isOrderCompleted(o))
          : baseFiltered

  const ordersReadyToProcess = orders.filter(isReadyToProcess)
  const ordersPaymentOpen = orders.filter(isPaymentOpen)
  const myOrders = currentUserEmail ? orders.filter((o) => (o.assigned_to_email || '').toLowerCase() === currentUserEmail.toLowerCase() && !isOrderCompleted(o)) : []

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllFiltered = () => {
    const ids = filteredOrders.map((o) => o.id)
    const allSelected = ids.every((id) => selectedIds.has(id))
    if (allSelected) setSelectedIds((prev) => { const s = new Set(prev); ids.forEach((id) => s.delete(id)); return s })
    else setSelectedIds((prev) => { const s = new Set(prev); ids.forEach((id) => s.add(id)); return s })
  }

  const clearSelection = () => setSelectedIds(new Set())

  const selectedOrders = orders.filter((o) => selectedIds.has(o.id))
  const canBulkShip = selectedOrders.some((o) => (o.payment_status || '') === 'paid' && !['shipped', 'delivered', 'cancelled'].includes(o.status))
  const canBulkReturnReceived = selectedOrders.every((o) => o.return_request_status === 'approved') && selectedOrders.length > 0

  const runBulkShip = async () => {
    const items = selectedOrders
      .filter((o) => (o.payment_status || '') === 'paid' && !['shipped', 'delivered', 'cancelled'].includes(o.status))
      .map((o) => ({ orderId: o.id, trackingNumber: (bulkShipTrackings[o.id] || o.tracking_number || '').trim(), trackingCarrier: 'DHL' }))
      .filter((i) => i.trackingNumber)
    if (items.length === 0) {
      toast({ title: 'Keine Sendungsnummern', description: 'Bitte für jede Bestellung eine DHL-/Tracking-Nummer angeben.', variant: 'destructive' })
      return
    }
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ship', items }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({
        title: 'Versand aktualisiert',
        description: `${data.successCount || 0} Bestellung(en) als versandt markiert.`,
      })
      setBulkShipOpen(false)
      setBulkShipTrackings({})
      clearSelection()
      loadOrders()
    } finally {
      setBulkLoading(false)
    }
  }

  const runBulkReturnReceived = async () => {
    const ids = selectedOrders.filter((o) => o.return_request_status === 'approved').map((o) => o.id)
    if (ids.length === 0) {
      toast({ title: 'Nicht möglich', description: 'Nur Bestellungen mit angenommener Rücksendung können markiert werden.', variant: 'destructive' })
      return
    }
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_return_received', orderIds: ids }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({
        title: 'Rücksendung eingegangen',
        description: `${data.successCount || 0} Bestellung(en) aktualisiert.`,
      })
      clearSelection()
      loadOrders()
    } finally {
      setBulkLoading(false)
    }
  }

  const runBulkStatus = async () => {
    setBulkLoading(true)
    try {
      const res = await fetch('/api/admin/orders/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', orderIds: [...selectedIds], status: bulkStatusValue }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || res.statusText, variant: 'destructive' })
        return
      }
      toast({
        title: 'Status aktualisiert',
        description: `${data.successCount || 0} Bestellung(en) auf "${getStatusLabel(bulkStatusValue)}" gesetzt.`,
      })
      setBulkStatusOpen(false)
      clearSelection()
      loadOrders()
    } finally {
      setBulkLoading(false)
    }
  }

  const openBulkShip = () => {
    const init: Record<string, string> = {}
    selectedOrders.forEach((o) => { init[o.id] = o.tracking_number || '' })
    setBulkShipTrackings(init)
    setBulkShipOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Bestellungen</h1>
        <p className="text-luxe-silver">
          Verwalte alle Kundenbestellungen
        </p>
      </div>

      <AdminBereichErklaerung
        titel="Bestellungen"
        zweck="Hier siehst du alle Kundenbestellungen. Du kannst den Status ändern, Tracking eintragen, DHL-Labels erstellen und Versand-E-Mails versenden."
        funktionsweise="Oben die Kacheln filtern nach: ‚Zum Bearbeiten bereit‘ (bezahlt, noch nicht versendet), ‚Zahlung offen‘, ‚Meine Bestellungen‘. Mit Suche und Filtern findest du einzelne Bestellungen. Klick auf eine Zeile öffnet die Detailansicht – dort Status, Tracking, Label, E-Mail."
        wannNutzen="Täglich beim Abarbeiten neuer Bestellungen und bei Kundenanfragen zum Versand."
      />

      {/* Quick-Übersicht: Kacheln zum Filtern */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => { setQuickView(quickView === 'ready' ? 'all' : 'ready'); setPaymentFilter(''); setStatusFilter(''); setAssignmentFilter('all'); }}
          className={`text-left rounded-lg border-2 transition-all ${quickView === 'ready' ? 'border-luxe-gold bg-luxe-gold/10' : 'border-luxe-gray bg-luxe-charcoal hover:border-luxe-gold/50'}`}
        >
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="pt-6">
              <p className="text-luxe-silver text-sm">Zum Bearbeiten bereit</p>
              <p className="text-2xl font-bold text-green-400">{ordersReadyToProcess.length}</p>
              <p className="text-xs text-luxe-silver mt-1">Bezahlt, noch nicht versandt</p>
            </CardContent>
          </Card>
        </button>
        <button
          type="button"
          onClick={() => { setQuickView(quickView === 'unpaid' ? 'all' : 'unpaid'); setPaymentFilter(''); setStatusFilter(''); setAssignmentFilter('all'); }}
          className={`text-left rounded-lg border-2 transition-all ${quickView === 'unpaid' ? 'border-amber-500 bg-amber-500/10' : 'border-luxe-gray bg-luxe-charcoal hover:border-amber-500/50'}`}
        >
          <Card className="border-0 bg-transparent shadow-none">
            <CardContent className="pt-6">
              <p className="text-luxe-silver text-sm">Zahlung offen</p>
              <p className="text-2xl font-bold text-amber-400">{ordersPaymentOpen.length}</p>
              <p className="text-xs text-luxe-silver mt-1">
                {unpaidCancelHours === 0 ? 'Auto-Stornierung aus' : unpaidCancelHours ? `Nach ${unpaidCancelHours} h auto-storniert` : 'Werden nach Frist auto-storniert'}
              </p>
            </CardContent>
          </Card>
        </button>
        {currentUserEmail && (
          <button
            type="button"
            onClick={() => { setQuickView(quickView === 'mine' ? 'all' : 'mine'); setPaymentFilter(''); setStatusFilter(''); setAssignmentFilter(quickView === 'mine' ? 'all' : 'mine'); }}
            className={`text-left rounded-lg border-2 transition-all ${quickView === 'mine' ? 'border-luxe-gold bg-luxe-gold/10' : 'border-luxe-gray bg-luxe-charcoal hover:border-luxe-gold/50'}`}
          >
            <Card className="border-0 bg-transparent shadow-none">
              <CardContent className="pt-6">
                <p className="text-luxe-silver text-sm flex items-center gap-1">
                  <User className="w-4 h-4" /> Meine Bestellungen
                </p>
                <p className="text-2xl font-bold text-luxe-gold">{myOrders.length}</p>
                <p className="text-xs text-luxe-silver mt-1">Mir zugewiesen</p>
              </CardContent>
            </Card>
          </button>
        )}
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6">
            <p className="text-luxe-silver text-sm">Versandt</p>
            <p className="text-2xl font-bold text-blue-400">{orders.filter(o => o.status === 'shipped').length}</p>
          </CardContent>
        </Card>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="pt-6">
            <p className="text-luxe-silver text-sm">Zugestellt</p>
            <p className="text-2xl font-bold text-green-400">{orders.filter(o => o.status === 'delivered').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Suche & Filter */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-silver" />
            <Input
              type="text"
              placeholder="Bestellungen durchsuchen (Nummer, Name, E-Mail)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-luxe-gray border-luxe-silver text-white"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-luxe-silver shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setQuickView('all'); }}
              className="px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
            >
              <option value="">Alle Status</option>
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
            <select
              value={paymentFilter}
              onChange={(e) => { setPaymentFilter(e.target.value); setQuickView('all'); }}
              className="px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
            >
              <option value="">Alle Zahlungen</option>
              <option value="paid">Bezahlt</option>
              <option value="pending">Zahlung offen</option>
            </select>
            {currentUserEmail && (
              <select
                value={assignmentFilter}
                onChange={(e) => { const v = e.target.value as 'all' | 'mine'; setAssignmentFilter(v); setQuickView(v === 'mine' ? 'mine' : 'all'); }}
                className="px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
              >
                <option value="all">Alle Zuweisungen</option>
                <option value="mine">Nur meine Bestellungen</option>
              </select>
            )}
            {(statusFilter || paymentFilter || quickView !== 'all') && (
              <button
                type="button"
                onClick={() => { setStatusFilter(''); setPaymentFilter(''); setAssignmentFilter('all'); setQuickView('all'); }}
                className="text-sm text-luxe-gold hover:text-luxe-gold/80"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
          <p className="text-xs text-luxe-silver">
            {filteredOrders.length} von {orders.length} Bestellungen
          </p>
        </CardContent>
      </Card>

      {/* Werkzeuge: Mollie-Abgleich + Export (einklappbar) */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <button
          type="button"
          onClick={() => setToolsExpanded(!toolsExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 text-left"
        >
          <span className="flex items-center gap-2 text-luxe-silver font-medium">
            <Wrench className="w-4 h-4" />
            Werkzeuge
          </span>
          {toolsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {toolsExpanded && (
          <CardContent className="pt-0 pb-6 space-y-6">
            {orders.some(o => (o.payment_status || 'pending') !== 'paid') && (
              <div>
                <p className="text-luxe-silver text-sm font-medium mb-2">Zahlungsstatus von Mollie übernehmen</p>
                <button
                  type="button"
                  onClick={async () => {
                    setSyncingPayments(true)
                    try {
                      const res = await fetch('/api/admin/orders/sync-payments', { method: 'POST' })
                      const data = await res.json().catch(() => ({}))
                      if (!res.ok) {
                        toast({ title: 'Abgleich fehlgeschlagen', description: data.error, variant: 'destructive' })
                        return
                      }
                      toast({ title: data.updated > 0 ? 'Zahlungen übernommen' : 'Abgleich fertig', description: data.message })
                      loadOrders()
                    } finally {
                      setSyncingPayments(false)
                    }
                  }}
                  disabled={syncingPayments}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-luxe-gold/20 border border-luxe-gold/50 text-luxe-gold hover:bg-luxe-gold/30 disabled:opacity-50 font-medium text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingPayments ? 'animate-spin' : ''}`} />
                  {syncingPayments ? 'Prüfe Mollie…' : 'Mollie-Zahlungen abgleichen'}
                </button>
              </div>
            )}
            <div>
              <p className="text-luxe-silver text-sm font-medium mb-2">Export für Steuer & Google Sheets</p>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={exportYear}
                  onChange={(e) => setExportYear(e.target.value)}
                  className="px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
                >
                  <option value="">Alle Jahre</option>
                  {yearOptions.filter(Boolean).map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
                <a
                  href={`/api/admin/orders/export${exportYear ? `?year=${exportYear}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold text-sm"
                >
                  <Download className="w-4 h-4" />
                  Als CSV herunterladen
                </a>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Bulk-Aktionen Leiste */}
      {selectedIds.size > 0 && (
        <Card className="bg-luxe-gold/10 border-luxe-gold/50">
          <CardContent className="py-4 flex flex-wrap items-center gap-4">
            <span className="text-white font-medium">
              {selectedIds.size} Bestellung(en) ausgewählt
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {canBulkShip && (
                <button
                  type="button"
                  onClick={openBulkShip}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-luxe-gold/30 border border-luxe-gold/60 text-luxe-gold hover:bg-luxe-gold/40 text-sm font-medium"
                >
                  <Truck className="w-4 h-4" />
                  Als versandt + DHL-Nr.
                </button>
              )}
              {canBulkReturnReceived && (
                <button
                  type="button"
                  onClick={runBulkReturnReceived}
                  disabled={bulkLoading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium disabled:opacity-50"
                >
                  {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Rücksendung eingegangen
                </button>
              )}
              <button
                type="button"
                onClick={() => { setBulkStatusValue('shipped'); setBulkStatusOpen(true); }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-luxe-gray border border-luxe-silver/50 text-white hover:bg-luxe-gray/80 text-sm font-medium"
              >
                Status ändern
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="text-luxe-silver hover:text-white text-sm"
              >
                Auswahl aufheben
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardContent className="py-12 text-center">
              <Package className="w-16 h-16 text-luxe-silver/30 mx-auto mb-4" />
              <p className="text-luxe-silver">
                {orders.length === 0 ? 'Noch keine Bestellungen' : 'Keine Bestellungen gefunden'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select-all für gefilterte Liste */}
            <div className="flex items-center gap-3 px-2 py-1">
              <label className="flex items-center gap-2 cursor-pointer text-luxe-silver hover:text-white">
                <input
                  type="checkbox"
                  checked={filteredOrders.length > 0 && filteredOrders.every((o) => selectedIds.has(o.id))}
                  onChange={selectAllFiltered}
                  className="rounded border-luxe-silver bg-luxe-gray text-luxe-gold focus:ring-luxe-gold"
                />
                <span className="text-sm">Alle auf dieser Seite auswählen</span>
              </label>
            </div>
            {filteredOrders.map((order) => {
              const isExpanded = orderExpanded.has(order.id)
              const addr = order.shipping_address
              const addrLine = addr
                ? `${addr.first_name || ''} ${addr.last_name || ''} · ${addr.street || ''} ${addr.house_number || ''}, ${addr.postal_code || ''} ${addr.city || ''}`.replace(/\s+/g, ' ').trim()
                : ''
              return (
              <Card key={order.id} className="bg-luxe-charcoal border-luxe-gray hover:border-luxe-gold/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <label className="pt-1 shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-luxe-silver bg-luxe-gray text-luxe-gold focus:ring-luxe-gold"
                      />
                    </label>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-white font-medium">#{order.order_number}</span>
                        <span className="text-luxe-silver text-sm">{formatDate(order.created_at)}</span>
                        <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                        <Badge className={getPaymentStatusColor(order.payment_status || 'pending')} variant="outline">
                          {order.payment_status === 'refunded' ? '€' : getPaymentStatusLabel(order.payment_status || 'pending')}
                        </Badge>
                        {order.assigned_to_email && !isOrderCompleted(order) && (
                          <Badge className="bg-luxe-gold/20 text-luxe-gold border-luxe-gold/50">
                            <User className="w-3 h-3 mr-1 inline" />
                            {order.assigned_to_email}
                          </Badge>
                        )}
                        {order.has_adult_items && <Badge variant="adult">18+</Badge>}
                      </div>
                      <p className="text-luxe-silver text-sm mt-1 truncate max-w-md">
                        {order.items_preview && order.items_preview.length > 0
                          ? order.items_preview.map((i) => (i.quantity > 1 ? `${i.product_name} (×${i.quantity})` : i.product_name)).join(' · ')
                          : `${order.items_count || 0} Artikel`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-lg font-semibold text-luxe-gold">{formatPrice(order.total)}</span>
                    </div>
                  </div>

                  {/* Status + Details immer sichtbar; Kunde/Adresse ausklappbar */}
                  <div className="mt-3 pt-3 border-t border-luxe-gray flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="px-3 py-1.5 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
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
                      <button
                        type="button"
                        onClick={() => toggleOrderExpanded(order.id)}
                        className="text-luxe-silver hover:text-white text-sm flex items-center gap-0.5"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isExpanded ? 'Weniger' : 'Mehr'}
                      </button>
                    </div>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-sm text-luxe-gold hover:text-luxe-gold/80"
                    >
                      Details →
                    </Link>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-luxe-silver text-xs mb-1">Kunde</p>
                        <p className="text-white flex items-center gap-1">
                          <Mail className="w-4 h-4 shrink-0" />
                          {order.customer_email}
                        </p>
                      </div>
                      {addrLine && (
                        <div>
                          <p className="text-luxe-silver text-xs mb-1">Lieferadresse</p>
                          <p className="text-white flex items-center gap-1">
                            <MapPin className="w-4 h-4 shrink-0" />
                            {addrLine}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              )
            })}
          </>
        )}
      </div>

      {/* Dialog: Bulk Versandt + Tracking */}
      <Dialog open={bulkShipOpen} onOpenChange={setBulkShipOpen}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Als versandt markieren + DHL-Nummer</DialogTitle>
          </DialogHeader>
          <p className="text-luxe-silver text-sm">Für jede Bestellung die Sendungsnummer eintragen:</p>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {selectedOrders
              .filter((o) => (o.payment_status || '') === 'paid' && !['shipped', 'delivered', 'cancelled'].includes(o.status))
              .map((o) => (
                <div key={o.id} className="flex items-center gap-3">
                  <span className="text-sm text-luxe-silver shrink-0 w-24">#{o.order_number}</span>
                  <Input
                    value={bulkShipTrackings[o.id] ?? o.tracking_number ?? ''}
                    onChange={(e) => setBulkShipTrackings((prev) => ({ ...prev, [o.id]: e.target.value }))}
                    placeholder="DHL-Sendungsnummer"
                    className="bg-luxe-gray border-luxe-silver text-white flex-1"
                  />
                </div>
              ))}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setBulkShipOpen(false)}
              className="px-4 py-2 text-luxe-silver hover:text-white"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={runBulkShip}
              disabled={bulkLoading}
              className="px-4 py-2 rounded-md bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-medium disabled:opacity-50"
            >
              {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null} Speichern
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Bulk Status */}
      <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Status für {selectedIds.size} Bestellung(en) ändern</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-luxe-silver">Neuer Status</label>
            <select
              value={bulkStatusValue}
              onChange={(e) => setBulkStatusValue(e.target.value)}
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
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setBulkStatusOpen(false)}
              className="px-4 py-2 text-luxe-silver hover:text-white"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={runBulkStatus}
              disabled={bulkLoading}
              className="px-4 py-2 rounded-md bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-medium disabled:opacity-50"
            >
              {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null} Anwenden
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
