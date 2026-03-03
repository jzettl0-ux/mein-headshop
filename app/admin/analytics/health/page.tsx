'use client'

import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { Activity, Server, Send, TrendingUp, Loader2, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type HealthData = {
  total_client: number
  total_server: number
  total_forwarded: number
  client_forwarded: number
  daily: Array<{
    date: string
    label: string
    client: number
    server: number
    forwarded: number
  }>
  event_breakdown: Array<{
    event_name: string
    client: number
    server: number
    forwarded: number
  }>
}

const CHART_COLORS = {
  client: '#374151',
  server: '#6b7280',
  forwarded: '#059669',
}

export default function AdminAnalyticsHealthPage() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics/health')
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-luxe-silver">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-luxe-gray bg-luxe-charcoal p-8 text-center text-luxe-silver">
        Keine Daten oder Berechtigung. Tabelle <code className="bg-luxe-black px-1 rounded">server_event_logs</code> vorhanden?
      </div>
    )
  }

  const { total_client, total_server, total_forwarded, client_forwarded, daily, event_breakdown } = data
  const clientRate = total_client > 0 ? Math.round((client_forwarded / total_client) * 100) : 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Tracking-Integrität</h1>
        <p className="text-sm text-luxe-silver mt-1">
          Vergleich Browser-Events vs. Server-Verarbeitung. Daten anonymisiert (DSGVO).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/95 border border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Vom Browser gesendet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-neutral-900">{total_client}</p>
            <p className="text-xs text-neutral-500 mt-1">Client-Events (letzte 7 Tage)</p>
          </CardContent>
        </Card>
        <Card className="bg-white/95 border border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2">
              <Server className="w-4 h-4" />
              Vom Server verarbeitet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-neutral-900">{total_server}</p>
            <p className="text-xs text-neutral-500 mt-1">Server-Events (z. B. Purchase)</p>
          </CardContent>
        </Card>
        <Card className="bg-white/95 border border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Erfolgreich weitergeleitet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-neutral-900">{total_forwarded}</p>
            <p className="text-xs text-neutral-500 mt-1">An GTM/Collect-Endpoint</p>
          </CardContent>
        </Card>
        <Card className="bg-white/95 border border-neutral-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Client-Weiterleitung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-neutral-900">{clientRate}%</p>
            <p className="text-xs text-neutral-500 mt-1">Von Client-Events weitergeleitet</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/95 border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Verlauf (7 Tage)</CardTitle>
          <p className="text-sm text-neutral-500">Browser vs. Server vs. Weitergeleitet</p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                  labelStyle={{ color: '#374151' }}
                />
                <Legend />
                <Line type="monotone" dataKey="client" name="Browser" stroke={CHART_COLORS.client} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="server" name="Server" stroke={CHART_COLORS.server} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="forwarded" name="Weitergeleitet" stroke={CHART_COLORS.forwarded} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/95 border border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-neutral-900">Nach Event-Typ</CardTitle>
          <p className="text-sm text-neutral-500">Client / Server / Weitergeleitet</p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={event_breakdown}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 80, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis type="category" dataKey="event_name" tick={{ fontSize: 12, fill: '#6b7280' }} width={72} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}
                />
                <Legend />
                <Bar dataKey="client" name="Browser" fill={CHART_COLORS.client} radius={[0, 4, 4, 0]} />
                <Bar dataKey="server" name="Server" fill={CHART_COLORS.server} radius={[0, 4, 4, 0]} />
                <Bar dataKey="forwarded" name="Weitergeleitet" fill={CHART_COLORS.forwarded} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 text-sm text-neutral-600">
        <Shield className="w-5 h-5 shrink-0 text-neutral-500 mt-0.5" />
        <div>
          <p className="font-medium text-neutral-700">Datenschutz</p>
          <p className="mt-1">
            In <code className="bg-white px-1 rounded border border-neutral-200">server_event_logs</code> werden nur Event-Name, Quelle, Consent-Status und Weiterleitungs-Erfolg gespeichert. Keine IP, keine User-Agents, keine personenbezogenen Daten.
          </p>
        </div>
      </div>
    </div>
  )
}
