'use client'

import { useState, useEffect } from 'react'
import { Users, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface CustomerLtv {
  email: string
  name: string
  total: number
  count: number
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function AdminCustomersPage() {
  const [data, setData] = useState<{ customers: CustomerLtv[] } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/customers/ltv')
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-neutral-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        Lade Kunden-LTV…
      </div>
    )
  }

  const customers = data?.customers ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight flex items-center gap-2">
          <Users className="w-7 h-7 text-neutral-600" />
          Customer Lifetime Value
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Gesamtumsatz pro Kunde (bezahlte Bestellungen abzüglich Gutschriften).
        </p>
      </div>

      <Card className="bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-neutral-100">
          <CardTitle className="text-neutral-900 text-lg font-medium">Kunden nach LTV</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-neutral-200 hover:bg-transparent">
                <TableHead className="text-neutral-600 font-medium">Kunde / E-Mail</TableHead>
                <TableHead className="text-neutral-600 font-medium text-right">Bestellungen</TableHead>
                <TableHead className="text-neutral-600 font-medium text-right">LTV (Gesamtumsatz)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-neutral-500 py-8">
                    Keine Kundendaten.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.email} className="border-neutral-200">
                    <TableCell>
                      <div className="font-medium text-neutral-900">{c.name || c.email}</div>
                      <div className="text-xs text-neutral-500">{c.email}</div>
                    </TableCell>
                    <TableCell className="text-right text-neutral-700">{c.count}</TableCell>
                    <TableCell className="text-right font-medium text-neutral-900">{formatEur(c.total)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
