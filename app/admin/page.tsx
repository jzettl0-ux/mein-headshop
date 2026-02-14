'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Package, Users, ShoppingCart, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState([
    {
      title: 'Produkte',
      value: '0',
      icon: Package,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
    },
    {
      title: 'Influencer',
      value: '0',
      icon: Users,
      color: 'text-luxe-gold',
      bgColor: 'bg-luxe-gold/10',
    },
    {
      title: 'Bestellungen',
      value: '0',
      icon: ShoppingCart,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
    },
    {
      title: 'Umsatz',
      value: '0,00 €',
      icon: TrendingUp,
      color: 'text-luxe-neon',
      bgColor: 'bg-luxe-neon/10',
    },
  ])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    // Products count
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    // Influencers count
    const { count: influencersCount } = await supabase
      .from('influencers')
      .select('*', { count: 'exact', head: true })

    // Orders count
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    // Total revenue
    const { data: ordersData } = await supabase
      .from('orders')
      .select('total')

    const totalRevenue = ordersData?.reduce((sum, order) => sum + order.total, 0) || 0

    setStats([
      {
        title: 'Produkte',
        value: (productsCount || 0).toString(),
        icon: Package,
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
      },
      {
        title: 'Influencer',
        value: (influencersCount || 0).toString(),
        icon: Users,
        color: 'text-luxe-gold',
        bgColor: 'bg-luxe-gold/10',
      },
      {
        title: 'Bestellungen',
        value: (ordersCount || 0).toString(),
        icon: ShoppingCart,
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
      },
      {
        title: 'Umsatz',
        value: `${totalRevenue.toFixed(2)} €`,
        icon: TrendingUp,
        color: 'text-luxe-neon',
        bgColor: 'bg-luxe-neon/10',
      },
    ])
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-luxe-silver">
          Willkommen im Premium Headshop Admin-Panel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-luxe-charcoal border-luxe-gray">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-luxe-silver">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Schnellzugriff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/admin/products"
              className="block p-6 bg-luxe-gray hover:bg-luxe-gray/80 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-400/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Produkte verwalten</h3>
                  <p className="text-luxe-silver text-sm">Produkte hinzufügen oder bearbeiten</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/influencers"
              className="block p-6 bg-luxe-gray hover:bg-luxe-gray/80 rounded-lg transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-luxe-gold/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-luxe-gold" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Influencer verwalten</h3>
                  <p className="text-luxe-silver text-sm">Influencer-Profile bearbeiten</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-luxe-gold/10 border-luxe-gold/30">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-luxe-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-luxe-gold" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">
                Admin-Panel erfolgreich eingerichtet!
              </h3>
              <p className="text-luxe-silver text-sm leading-relaxed">
                Du kannst jetzt Produkte und Influencer verwalten. Die Datenbank ist mit Testdaten gefüllt.
                Verwende die Navigation links, um zwischen den Bereichen zu wechseln.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
