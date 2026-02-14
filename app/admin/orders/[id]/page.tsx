'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, MapPin, Mail, Phone, Calendar, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'

interface OrderItem {
  id: string
  product_name: string
  product_image: string
  quantity: number
  price: number
  total: number
}

interface Order {
  id: string
  order_number: string
  created_at: string
  total: number
  subtotal: number
  shipping_cost: number
  status: string
  has_adult_items: boolean
  customer_name: string
  customer_email: string
  shipping_address: any
}

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadOrder()
  }, [])

  const loadOrder = async () => {
    try {
      // Load order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
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

      // Load order items
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', params.id)

      setOrderItems(itemsData || [])
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', params.id)

      if (error) throw error

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'shipped': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'processing': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/50'
      default: return 'bg-luxe-gray text-luxe-silver border-luxe-silver/50'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Zugestellt'
      case 'shipped': return 'Versandt'
      case 'processing': return 'In Bearbeitung'
      case 'cancelled': return 'Storniert'
      default: return 'Ausstehend'
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
          <h1 className="text-3xl font-bold text-white mb-2">
            Bestellung #{order.order_number}
          </h1>
          <p className="text-luxe-silver">
            <Calendar className="w-4 h-4 inline mr-1" />
            {formatDate(order.created_at)}
          </p>
        </div>
        <div className="space-y-2">
          <Badge className={getStatusColor(order.status)}>
            {getStatusLabel(order.status)}
          </Badge>
          {order.has_adult_items && (
            <Badge variant="adult" className="block">18+ DHL Ident</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items & Address */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">
                Bestellte Artikel ({orderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item) => (
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
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">{formatPrice(item.total)}</p>
                      <p className="text-luxe-silver text-sm">
                        {formatPrice(item.price)} / Stück
                      </p>
                    </div>
                  </div>
                ))}
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
                <option value="cancelled">Storniert</option>
              </select>
              <p className="text-xs text-luxe-silver">
                Ändere den Bestellstatus
              </p>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Zusammenfassung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.has_adult_items && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                  <p className="text-red-400 text-sm">
                    🔞 18+ DHL Ident-Check
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
