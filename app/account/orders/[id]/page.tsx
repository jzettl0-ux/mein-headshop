'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, MapPin, Mail, Phone, Calendar, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/supabase/auth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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
  payment_status?: string
  has_adult_items: boolean
  customer_name: string
  customer_email: string
  shipping_address: any
  invoice_url?: string | null
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadOrder()
  }, [])

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
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setIsLoading(false)
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

                <div className="pt-4 border-t border-luxe-gray">
                  <p className="text-xs text-luxe-silver mb-3">
                    Inkl. MwSt. | Bestellnummer: {order.order_number}
                  </p>
                  {order.invoice_url && order.payment_status === 'paid' && (
                    <a
                      href={`/api/account/orders/${order.id}/invoice`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray hover:bg-luxe-gray/80 text-white text-sm border border-luxe-silver/50"
                    >
                      <FileText className="w-4 h-4" />
                      Rechnung (PDF) herunterladen
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
