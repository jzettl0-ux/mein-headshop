'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Search, Eye, Package, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice, formatDate } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total: number
  status: string
  has_adult_items: boolean
  created_at: string
  shipping_address: any
  items_count?: number
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading orders:', error)
        return
      }

      if (!data || data.length === 0) {
        setOrders([])
        return
      }

      // Get item counts for each order
      const ordersWithCount = await Promise.all(
        data.map(async (order) => {
          const { count, error: countError } = await supabase
            .from('order_items')
            .select('*', { count: 'exact', head: true })
            .eq('order_id', order.id)

          if (countError) {
            console.error('Error counting items for order:', order.id, countError)
          }

          return {
            ...order,
            items_count: count || 0,
          }
        })
      )
      
      setOrders(ordersWithCount)
    } catch (error) {
      console.error('Error in loadOrders:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      toast({
        title: 'Status aktualisiert',
        description: `Bestellung wurde auf "${getStatusLabel(newStatus)}" gesetzt.`,
      })

      loadOrders()
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

  const filteredOrders = orders.filter(o =>
    o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Bestellungen</h1>
        <p className="text-luxe-silver">
          Verwalte alle Kundenbestellungen
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Gesamt', value: orders.length, color: 'text-white' },
          { label: 'Ausstehend', value: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-400' },
          { label: 'Versandt', value: orders.filter(o => o.status === 'shipped').length, color: 'text-blue-400' },
          { label: 'Zugestellt', value: orders.filter(o => o.status === 'delivered').length, color: 'text-green-400' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-luxe-charcoal border-luxe-gray">
            <CardContent className="pt-6">
              <p className="text-luxe-silver text-sm">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-luxe-silver" />
            <Input
              type="text"
              placeholder="Bestellungen durchsuchen (Nummer, Name, Email)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 bg-luxe-gray border-luxe-silver text-white"
            />
          </div>
        </CardContent>
      </Card>

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
          filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="bg-luxe-charcoal border-luxe-gray hover:border-luxe-gold/50 transition-colors">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            #{order.order_number}
                          </h3>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                          {order.has_adult_items && (
                            <Badge variant="adult">18+ DHL Ident</Badge>
                          )}
                        </div>
                        <p className="text-sm text-luxe-silver">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-luxe-gold">
                          {formatPrice(order.total)}
                        </div>
                        <p className="text-sm text-luxe-silver">
                          {order.items_count || 0} Artikel
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-luxe-gray">
                      <div className="space-y-2">
                        <p className="text-luxe-silver text-sm font-medium">Kunde</p>
                        <div className="space-y-1">
                          <p className="text-white flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-luxe-gold" />
                            {order.customer_email}
                          </p>
                          {order.shipping_address?.phone && (
                            <p className="text-white flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-luxe-gold" />
                              {order.shipping_address.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-luxe-silver text-sm font-medium">Lieferadresse</p>
                        {order.shipping_address && (
                          <p className="text-white text-sm flex items-start">
                            <MapPin className="w-4 h-4 mr-2 text-luxe-gold mt-0.5 flex-shrink-0" />
                            <span>
                              {order.shipping_address.first_name} {order.shipping_address.last_name}<br />
                              {order.shipping_address.street} {order.shipping_address.house_number}<br />
                              {order.shipping_address.postal_code} {order.shipping_address.city}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-luxe-gray">
                      <div className="flex items-center space-x-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="px-3 py-1.5 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
                        >
                          <option value="pending">Ausstehend</option>
                          <option value="processing">In Bearbeitung</option>
                          <option value="shipped">Versandt</option>
                          <option value="delivered">Zugestellt</option>
                          <option value="cancelled">Storniert</option>
                        </select>
                      </div>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-sm text-luxe-gold hover:text-luxe-gold/80 transition-colors"
                      >
                        Details ansehen →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
