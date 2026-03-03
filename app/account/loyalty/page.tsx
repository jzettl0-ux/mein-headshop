'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Gift, Award, ChevronRight, Coins, Sparkles, ArrowLeft, Star, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/supabase/auth'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  amount: number
  reason: string
  reason_label: string
  created_at: string
}

interface LoyaltyData {
  enabled?: boolean
  points_balance: number
  tier: 'bronze' | 'silver' | 'gold'
  next_tier: 'silver' | 'gold' | null
  points_needed: number
  progress_percent: number
  transactions: Transaction[]
  settings: {
    points_per_eur_discount?: number
    silver_discount_percent?: number
    gold_discount_percent?: number
    min_order_eur_for_discount?: number
  }
}

const tierConfig = {
  bronze: {
    label: 'Bronze',
    desc: 'Dein Start',
    color: 'text-amber-600',
    bg: 'from-amber-900/30 to-amber-800/10',
    border: 'border-amber-500/40',
    glow: 'shadow-amber-500/20',
    icon: Award,
  },
  silver: {
    label: 'Silber',
    desc: 'Exklusiv',
    color: 'text-slate-200',
    bg: 'from-slate-600/30 to-slate-700/20',
    border: 'border-slate-400/50',
    glow: 'shadow-slate-400/20',
    icon: Award,
  },
  gold: {
    label: 'Gold',
    desc: 'Premium',
    color: 'text-luxe-gold',
    bg: 'from-luxe-gold/20 to-amber-600/10',
    border: 'border-luxe-gold/60',
    glow: 'shadow-luxe-gold/30',
    icon: Sparkles,
  },
}

export default function AccountLoyaltyPage() {
  const router = useRouter()
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getCurrentUser().then((user) => {
      if (!user && mounted) {
        router.replace('/auth?redirect=/account/loyalty')
        return
      }
      if (!user) return
      fetch('/api/account/loyalty')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (mounted) setData(d)
        })
        .finally(() => {
          if (mounted) setLoading(false)
        })
    })
    return () => { mounted = false }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe-black">
        <div className="container max-w-3xl mx-auto px-4 py-12">
          <div className="animate-pulse rounded-2xl bg-luxe-charcoal h-56" />
          <div className="mt-6 animate-pulse rounded-2xl bg-luxe-charcoal h-48" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-luxe-black">
        <div className="container max-w-3xl mx-auto px-4 py-12">
          <p className="text-luxe-silver">Treue-Daten konnten nicht geladen werden.</p>
          <Link href="/account" className="mt-4 inline-flex items-center text-luxe-gold hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zum Konto
          </Link>
        </div>
      </div>
    )
  }

  if (data.enabled === false) {
    return (
      <div className="min-h-screen bg-luxe-black">
        <div className="container max-w-3xl mx-auto px-4 py-12">
          <Link href="/account" className="inline-flex items-center text-sm text-luxe-silver hover:text-white mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zum Konto
          </Link>
          <Card className="border border-luxe-gray bg-luxe-charcoal">
            <CardContent className="pt-6">
              <p className="text-luxe-silver">
                Das Treueprogramm ist derzeit pausiert. Punkte und Rabatte sind vorübergehend nicht verfügbar. Schau später wieder vorbei!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const tier = tierConfig[data.tier]
  const TierIcon = tier.icon

  return (
    <div className="min-h-screen bg-luxe-black">
      <div className="container max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            href="/account"
            className="inline-flex items-center text-sm text-luxe-silver hover:text-luxe-gold mb-8 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zum Konto
          </Link>

          {/* Hero Header */}
          <div className="mb-10 text-center sm:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-luxe-gold/10 border border-luxe-gold/30 text-luxe-gold text-sm font-medium mb-4"
            >
              <Star className="w-4 h-4 fill-luxe-gold" />
              Dein Treueprogramm
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3"
            >
              <Gift className="w-9 h-9 text-luxe-gold" />
              Punkte & Belohnungen
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-luxe-silver mt-2 text-lg max-w-xl"
            >
              Sammle bei jedem Einkauf und jeder Bewertung Punkte – und spare bei deiner nächsten Bestellung. Je mehr du sammelst, desto mehr profitierst du.
            </motion.p>
          </div>

          {/* Status Card – Premium Design */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className={cn(
              'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 sm:p-8',
              tier.bg,
              tier.border,
              'shadow-xl'
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.08)_0%,transparent_50%)]" />
            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center border',
                    tier.border,
                    'bg-luxe-black/40'
                  )}>
                    <TierIcon className={cn('w-8 h-8', tier.color)} />
                  </div>
                  <div>
                    <p className="text-luxe-silver text-sm font-medium">Dein Status</p>
                    <h2 className={cn('text-2xl sm:text-3xl font-bold', tier.color)}>
                      {tier.label}
                    </h2>
                    <p className="text-luxe-silver/80 text-sm mt-0.5">{tier.desc}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-luxe-silver text-sm">Punkte-Guthaben</p>
                  <p className={cn('text-4xl sm:text-5xl font-bold tabular-nums', tier.color)}>
                    {data.points_balance.toLocaleString('de-DE')}
                  </p>
                  <p className="text-luxe-silver/80 text-sm">Punkte</p>
                </div>
              </div>

              {data.next_tier && (() => {
                const totalToNext = data.points_balance + data.points_needed
                const pct = totalToNext > 0
                  ? Math.min(100, Math.round((data.points_balance / totalToNext) * 100))
                  : 100
                const nextTierCfg = tierConfig[data.next_tier]
                const isClose = pct >= 70
                const isAlmost = pct >= 90
                const barGradient = isAlmost
                  ? 'from-luxe-gold via-amber-400 to-amber-300'
                  : isClose
                    ? 'from-amber-500 via-amber-400 to-luxe-gold'
                    : pct >= 40
                      ? 'from-amber-600 via-amber-500 to-amber-400'
                      : 'from-slate-500 via-amber-600/90 to-amber-500'
                const motivationalText = isAlmost
                  ? 'Fast geschafft – gleich erreichst du ' + (nextTierCfg?.label ?? data.next_tier) + '!'
                  : isClose
                    ? 'Du bist nah dran – noch ein kleiner Schritt!'
                    : 'Jeder Einkauf bringt dich näher – weiter so!'
                return (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-baseline mb-3">
                      <span className="text-sm text-luxe-silver">
                        <span className="font-semibold text-white">{data.points_balance}</span> Punkte
                      </span>
                      <span className={cn(
                        'text-sm font-medium',
                        isAlmost ? 'text-luxe-gold' : isClose ? 'text-amber-400' : 'text-luxe-silver'
                      )}>
                        Noch {data.points_needed} bis {nextTierCfg?.label ?? data.next_tier}
                      </span>
                    </div>
                    <div className="relative h-5 rounded-full bg-luxe-black/50 overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className={cn(
                          'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r shadow-lg min-w-[8px]',
                          barGradient,
                          isAlmost && 'shadow-luxe-gold/40',
                          isClose && !isAlmost && 'shadow-amber-500/30'
                        )}
                      />
                      {pct > 5 && pct < 100 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1, duration: 0.4 }}
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent"
                          style={{ width: `${pct}%` }}
                        />
                      )}
                    </div>
                    <p className={cn(
                      'text-xs mt-2',
                      isAlmost ? 'text-luxe-gold font-medium' : 'text-luxe-silver'
                    )}>
                      {motivationalText}
                    </p>
                  </div>
                )
              })()}
              {!data.next_tier && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-luxe-gold font-medium flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Du hast den höchsten Status erreicht!
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info Cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              <Card className="h-full border-luxe-gray bg-luxe-charcoal hover:border-luxe-gold/30 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Coins className="w-5 h-5 text-luxe-gold" />
                    Punkte einlösen
                  </CardTitle>
                  <CardDescription className="text-luxe-silver">
                    {data.settings.points_per_eur_discount} Punkte = 1 € Rabatt im Warenkorb. Beim Checkout kannst du deine Punkte ganz einfach einlösen.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <Card className="h-full border-luxe-gray bg-luxe-charcoal hover:border-luxe-gold/30 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-luxe-gold" />
                    Deine Vorteile
                  </CardTitle>
                  <CardDescription className="text-luxe-silver">
                    {data.tier === 'gold' &&
                      (data.settings.min_order_eur_for_discount
                        ? `${data.settings.gold_discount_percent}% Rabatt ab ${data.settings.min_order_eur_for_discount} € Bestellwert`
                        : `${data.settings.gold_discount_percent}% Rabatt auf jede Bestellung`)}
                    {data.tier === 'silver' &&
                      (data.settings.min_order_eur_for_discount
                        ? `${data.settings.silver_discount_percent}% Rabatt ab ${data.settings.min_order_eur_for_discount} € Bestellwert`
                        : `${data.settings.silver_discount_percent}% Rabatt auf jede Bestellung`)}
                    {data.tier === 'bronze' && 'Steige in Silber auf und erhalte Rabatt ab einem Mindestbestellwert. Jeder Einkauf bringt dich näher!'}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </div>

          {/* Transaktionen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.4 }}
          >
            <Card className="mt-8 border-luxe-gray bg-luxe-charcoal">
              <CardHeader>
                <CardTitle className="text-white text-lg">Letzte Transaktionen</CardTitle>
                <CardDescription className="text-luxe-silver">
                  Punkte-Gutschriften und Einlösungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.transactions.length === 0 ? (
                  <div className="py-12 text-center">
                    <Coins className="w-12 h-12 text-luxe-gray mx-auto mb-3" />
                    <p className="text-luxe-silver">Noch keine Transaktionen</p>
                    <p className="text-luxe-silver/70 text-sm mt-1">Deine Punkte-Gutschriften erscheinen hier nach dem Einkauf</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-luxe-gray">
                    {data.transactions.map((t, i) => (
                      <motion.li
                        key={t.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className="flex items-center justify-between py-4 first:pt-0"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-white font-medium">{t.reason_label}</span>
                          <span className="text-luxe-silver text-sm">
                            {new Date(t.created_at).toLocaleDateString('de-DE', { dateStyle: 'medium' })}
                          </span>
                        </div>
                        <span className={cn(
                          'font-bold tabular-nums text-lg',
                          t.amount >= 0 ? 'text-emerald-400' : 'text-luxe-silver'
                        )}>
                          {t.amount >= 0 ? '+' : ''}{t.amount}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-10 flex justify-center"
          >
            <Link
              href="/shop"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-luxe-gold px-8 py-4 text-luxe-black font-bold text-lg hover:bg-luxe-gold/90 transition-all hover:scale-[1.02]"
            >
              Jetzt einkaufen & Punkte sammeln
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
