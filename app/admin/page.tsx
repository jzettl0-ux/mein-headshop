'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Package, Users, ShoppingCart, TrendingUp, AlertCircle, Bell, ArrowRight, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'

function RecentOrdersWidget() {
  const [orders, setOrders] = useState<Array<{ id: string; order_number: string; total: number; status: string; created_at: string }>>([])
  useEffect(() => {
    supabase
      .from('orders')
      .select('id, order_number, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => setOrders(data ?? []))
  }, [])
  if (orders.length === 0) return null
  return (
    <Card className="bg-luxe-charcoal border-luxe-gray">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">Letzte Bestellungen</CardTitle>
        <Link href="/admin/orders" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
          Alle <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-luxe-gray/50 transition-colors">
                <span className="text-white font-medium">#{o.order_number}</span>
                <span className="text-white/85 text-sm">{formatPrice(o.total)}</span>
                <span className="text-white/75 text-xs">{formatDate(o.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

type NotificationAlert = {
  id: string
  type: string
  title: string
  message: string
  href: string
  severity: 'warning' | 'info' | 'error'
  count?: number
}

export default function AdminDashboardPage() {
  const [alerts, setAlerts] = useState<NotificationAlert[]>([])
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

    // Wichtige Hinweise (offene Anfragen, Bestellungen, Lager, Umsatz, Beschwerden)
    const notifRes = await fetch('/api/admin/notifications')
    if (notifRes.ok) {
      const json = await notifRes.json().catch(() => ({ alerts: [] }))
      setAlerts(Array.isArray(json.alerts) ? json.alerts : [])
    }

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
        <h1 className="text-3xl font-bold text-white mb-2">Übersicht</h1>
        <p className="text-white/85">
          Willkommen im Premium Headshop Admin-Panel
        </p>
      </div>

      {/* Kurz erklärt: So findest du dich zurecht */}
      <Card className="bg-luxe-charcoal/80 border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-luxe-gold" />
            So findest du dich zurecht
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-white/85 space-y-3">
          <p>Das Menü links ist wie bei Amazon Seller Central strukturiert – von links nach rechts:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 list-none pl-0">
            <li><strong>Bestellungen</strong> – Bestellungen prüfen, versenden, Tracking eintragen</li>
            <li><strong>Kundenservice</strong> – Anfragen, Beschwerden, Garantien bearbeiten</li>
            <li><strong>Produkte & Sortiment</strong> – Artikel, Kategorien, Influencer, Medien</li>
            <li><strong>Bewertungen & Feedback</strong> – Sterne-Bewertungen, Vorschläge von Kunden</li>
            <li><strong>Marketing</strong> – Rabattcodes, Newsletter, Werbung</li>
            <li><strong>Lager & Versand</strong> – Bestand, Wareneingang, Lieferanten, DHL/DPD</li>
            <li><strong>Finanzen</strong> – Umsatz, Einkauf, Ausgaben</li>
            <li><strong>Einstellungen</strong> – Shop, Team, Rechtliches (Versand, DSGVO)</li>
          </ul>
          <p className="text-white/70 text-xs">
            Fahre mit der Maus über einen Menüpunkt – dann siehst du eine kurze Erklärung. Eine ausführliche Erklärung aller Bereiche findest du in <code className="bg-luxe-gray/60 px-1 rounded">docs/ADMIN-ERKLAERUNG.md</code>.
          </p>
        </CardContent>
      </Card>

      {/* Wichtige Hinweise – zentrale Benachrichtigungen */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-amber-500/40 bg-amber-500/5 overflow-hidden"
        >
          <div className="p-4 border-b border-amber-500/20 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Wichtige Hinweise</h2>
            <span className="ml-2 text-sm text-white/90">({alerts.length})</span>
          </div>
          <ul className="divide-y divide-luxe-gray">
            {alerts.map((alert) => {
              const isWarning = alert.severity === 'warning'
              const isError = alert.severity === 'error'
              return (
                <li key={alert.id}>
                  <Link href={alert.href} className="block p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isError ? 'bg-red-500/20' : isWarning ? 'bg-amber-500/20' : 'bg-green-500/20'}`}>
                        <AlertCircle className={`w-5 h-5 ${isError ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-green-400'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-white">{alert.title}</h3>
                        <p className="text-sm text-white/90 mt-0.5">{alert.message}</p>
                        <p className="text-xs text-white/80 mt-1">→ Zur Übersicht</p>
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </motion.div>
      )}

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
                  <CardTitle className="text-sm font-medium text-white/85">
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

      {/* Letzte Bestellungen */}
      <RecentOrdersWidget />

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
                  <p className="text-white/80 text-sm">Produkte hinzufügen oder bearbeiten</p>
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
                  <p className="text-white/80 text-sm">Influencer-Profile bearbeiten</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Info Box – Manuelles Control Center */}
      <Card className="bg-luxe-gold/10 border-luxe-gold/30">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-luxe-gold/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-luxe-gold" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">
                Steuerzentrale
              </h3>
              <p className="text-white/85 text-sm leading-relaxed">
                Alle Steuerung erfolgt manuell: Produkte, Badges (NEU/SALE) und Texte verwalten Sie selbst.
                Keine automatischen Vorschläge – Sie behalten die letzte Entscheidung. Navigation links.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
