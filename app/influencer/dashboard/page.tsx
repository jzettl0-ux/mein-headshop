'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Wallet,
  MousePointer,
  Tag,
  Banknote,
  Send,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatPrice } from '@/lib/utils'

type Stats = {
  revenue: number
  commission: number
  clicks: number
  commission_rate: number
  sales_by_day: { date: string; total: number }[]
}

type CodeInfo = {
  code: string | null
  type: string | null
  value: number | null
  is_active: boolean
  can_request_code_change?: boolean
}

type PayoutRow = {
  id: string
  amount: number
  status: string
  requested_at: string | null
  paid_at: string | null
  created_at: string
  note: string | null
}

type PayoutsData = {
  payouts: PayoutRow[]
  open_balance: number
  total_earned: number
}

export default function InfluencerDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [codeInfo, setCodeInfo] = useState<CodeInfo | null>(null)
  const [payoutsData, setPayoutsData] = useState<PayoutsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [codeRequest, setCodeRequest] = useState('')
  const [requestingCode, setRequestingCode] = useState(false)
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([
      fetch('/api/influencer/stats').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/influencer/code').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/influencer/payouts').then((r) => (r.ok ? r.json() : null)),
    ]).then(([s, c, p]) => {
      setStats(s ?? null)
      setCodeInfo(c ?? null)
      setPayoutsData(p ?? null)
    }).finally(() => setLoading(false))
  }, [])

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeRequest.trim()) return
    setRequestingCode(true)
    try {
      const res = await fetch('/api/influencer/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requested_code: codeRequest.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: data.error ?? 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: data.message ?? 'Anfrage gesendet' })
      setCodeRequest('')
      const codeRes = await fetch('/api/influencer/code')
      if (codeRes.ok) setCodeInfo(await codeRes.json())
    } finally {
      setRequestingCode(false)
    }
  }

  const handleRequestPayout = async () => {
    setRequestingPayout(true)
    try {
      const res = await fetch('/api/influencer/payouts', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast({ title: data.error ?? 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: data.message ?? 'Auszahlung angefragt' })
      const listRes = await fetch('/api/influencer/payouts')
      if (listRes.ok) setPayoutsData(await listRes.json())
    } finally {
      setRequestingPayout(false)
    }
  }

  const copyCode = () => {
    if (!codeInfo?.code) return
    navigator.clipboard.writeText(codeInfo.code)
    setCopied(true)
    toast({ title: 'Code kopiert' })
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    )
  }

  const tiles = [
    {
      title: 'Generierter Umsatz',
      value: formatPrice(stats?.revenue ?? 0),
      sub: 'Brutto aller Bestellungen mit deinem Code',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Meine Provision',
      value: formatPrice(stats?.commission ?? 0),
      sub: `${stats?.commission_rate ?? 0} % vom Umsatz`,
      icon: Wallet,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Klicks',
      value: String(stats?.clicks ?? 0),
      sub: 'Link-Aufrufe (falls getrackt)',
      icon: MousePointer,
      color: 'text-sky-600',
      bg: 'bg-sky-50',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="text-stone-500 mt-1">Übersicht deiner Performance und Auszahlungen</p>
      </div>

      {/* Kacheln */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiles.map((tile, i) => {
          const Icon = tile.icon
          return (
            <motion.div
              key={tile.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="border-stone-200 bg-white shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-stone-500">{tile.title}</p>
                      <p className="text-2xl font-semibold text-stone-900 mt-1">{tile.value}</p>
                      <p className="text-xs text-stone-400 mt-1">{tile.sub}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${tile.bg}`}>
                      <Icon className={`h-5 w-5 ${tile.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-stone-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-stone-900">Umsatz (letzte 30 Tage)</CardTitle>
            <CardDescription>Täglicher Brutto-Umsatz über deinen Code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={stats?.sales_by_day ?? []}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => (v ? new Date(v).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '')}
                    stroke="#a8a29e"
                    fontSize={11}
                  />
                  <YAxis
                    tickFormatter={(v) => `${v} €`}
                    stroke="#a8a29e"
                    fontSize={11}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [formatPrice(value ?? 0), 'Umsatz']}
                    labelFormatter={(label) => label ? new Date(label).toLocaleDateString('de-DE') : ''}
                    contentStyle={{ borderRadius: 8, border: '1px solid #e7e5e4' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#0d9488"
                    strokeWidth={2}
                    dot={false}
                    name="Umsatz"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Code-Verwaltung */}
      <section id="code">
        <Card className="border-stone-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-stone-900 flex items-center gap-2">
              <Tag className="h-4 w-4" /> Mein Rabattcode
            </CardTitle>
            <CardDescription>
              Dein aktiver Code wird im Checkout eingegeben – Kunden erhalten den Rabatt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {codeInfo?.code ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2.5 rounded-lg bg-stone-100 font-mono text-lg font-semibold text-stone-900">
                  {codeInfo.code}
                </div>
                <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Kopiert' : 'Kopieren'}
                </Button>
                {codeInfo.value != null && (
                  <span className="text-sm text-stone-500">
                    {codeInfo.type === 'percent' ? `${codeInfo.value} %` : `${codeInfo.value} €`} Rabatt
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-500">Noch kein Code zugewiesen. Kontaktiere den Admin.</p>
            )}
            {codeInfo?.can_request_code_change && (
              <form onSubmit={handleRequestCode} className="flex flex-wrap items-end gap-2 pt-2 border-t border-stone-100">
                <div>
                  <Label htmlFor="requested_code" className="text-stone-600 text-xs">Neuen Code anfragen</Label>
                  <Input
                    id="requested_code"
                    value={codeRequest}
                    onChange={(e) => setCodeRequest(e.target.value.toUpperCase())}
                    placeholder="z.B. NEUER20"
                    className="mt-1 max-w-xs border-stone-200"
                    maxLength={20}
                  />
                </div>
                <Button type="submit" disabled={requestingCode || !codeRequest.trim()} size="sm">
                  {requestingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Anfrage senden
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Auszahlungen */}
      <section id="payouts">
        <Card className="border-stone-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-stone-900 flex items-center gap-2">
              <Banknote className="h-4 w-4" /> Auszahlungen
            </CardTitle>
            <CardDescription>
              Offener Betrag und Historie. Auszahlung anfordern sendet eine Anfrage an den Admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-stone-500">Offener Betrag</p>
                <p className="text-xl font-semibold text-stone-900">
                  {formatPrice(payoutsData?.open_balance ?? 0)}
                </p>
              </div>
              <Button
                onClick={handleRequestPayout}
                disabled={requestingPayout || (payoutsData?.open_balance ?? 0) < 1}
                size="sm"
                className="gap-2"
              >
                {requestingPayout ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Auszahlung anfordern
              </Button>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700 mb-2">Bisherige Auszahlungen</p>
              {!payoutsData?.payouts?.length ? (
                <p className="text-sm text-stone-500">Noch keine Auszahlungen.</p>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {payoutsData.payouts.map((p) => (
                    <li key={p.id} className="flex items-center justify-between py-3 first:pt-0">
                      <div>
                        <span className="font-medium text-stone-900">{formatPrice(p.amount)}</span>
                        <span className="ml-2 text-xs text-stone-500">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString('de-DE') : ''}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          p.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'requested'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {p.status === 'paid' ? 'Ausgezahlt' : p.status === 'requested' ? 'Angefragt' : 'Offen'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
