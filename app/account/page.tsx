'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, Mail, Package, LogOut, ShoppingBag, Calendar, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUser, signOut } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Order {
  id: string
  order_number: string
  created_at: string
  total: number
  status: string
  has_adult_items: boolean
  items_count: number
}

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser()
      
      if (!currentUser) {
        router.push('/auth')
        return
      }

      setUser(currentUser)

      // Bestellungen mit order_items-Anzahl laden
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items ( id )
        `)
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const ordersWithCount = (ordersData || []).map((order: any) => {
        const items = order?.order_items
        return {
          ...order,
          order_items: undefined,
          items_count: Array.isArray(items) ? items.length : 0,
        }
      })

      setOrders(ordersWithCount)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
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
      default: return 'bg-luxe-gray text-luxe-silver border-luxe-silver/50'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'delivered': return 'Zugestellt'
      case 'shipped': return 'Versandt'
      case 'processing': return 'In Bearbeitung'
      case 'cancelled': return 'Storniert'
      case 'pending': return 'Ausstehend'
      default: return status ? status : 'Ausstehend'
    }
  }

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Mein Konto</h1>
            <p className="text-luxe-silver">Verwalte dein Profil und deine Bestellungen</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-luxe-gray hover:bg-luxe-gray/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <User className="w-5 h-5 mr-2 text-luxe-gold" />
                  Profil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-luxe-gold to-luxe-neon rounded-full flex items-center justify-center">
                    <User className="w-12 h-12 text-luxe-black" />
                  </div>
                </div>

                {/* User Info */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-luxe-silver">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-luxe-silver">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      Mitglied seit {formatDate(user?.created_at || new Date())}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-luxe-silver">
                    <Package className="w-4 h-4" />
                    <span className="text-sm">{orders.length} Bestellungen</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-6 border-t border-luxe-gray">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-white">{orders.length}</div>
                      <div className="text-xs text-luxe-silver">Bestellungen</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-luxe-gold">
                        {formatPrice(orders.reduce((sum, o) => sum + o.total, 0))}
                      </div>
                      <div className="text-xs text-luxe-silver">Gesamt</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders */}
          <div className="lg:col-span-2">
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <ShoppingBag className="w-5 h-5 mr-2 text-luxe-gold" />
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
                      Keine Bestellungen vorhanden
                    </h3>
                    <p className="text-luxe-silver max-w-sm mx-auto mb-8">
                      Sobald du deine erste Bestellung aufgegeben hast, findest du sie hier mit allen Details und dem Bestellstatus.
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
                    {orders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-luxe-gray rounded-lg hover:bg-luxe-gray/80 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-white font-semibold">
                                #{order.order_number}
                              </h3>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusLabel(order.status)}
                              </Badge>
                              {order.has_adult_items && (
                                <Badge variant="adult">18+</Badge>
                              )}
                            </div>
                            <p className="text-sm text-luxe-silver">
                              {formatDate(order.created_at)} • {order.items_count} Artikel
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-white">
                              {formatPrice(order.total)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-luxe-charcoal">
                          <Link
                            href={`/account/orders/${order.id}`}
                            className="text-sm text-luxe-gold hover:text-luxe-gold/80 transition-colors"
                          >
                            Details ansehen →
                          </Link>
                          {order.status === 'delivered' && (
                            <button className="text-sm text-luxe-silver hover:text-white transition-colors">
                              Erneut bestellen
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
