'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TicketPercent, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import type { DiscountCode } from '@/lib/types'

export default function AdminDiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadCodes()
  }, [])

  const loadCodes = async () => {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({ title: 'Fehler beim Laden', variant: 'destructive' })
      setCodes([])
    } else {
      setCodes((data as DiscountCode[]) || [])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string, code: string) => {
    if (!confirm('Rabattcode "' + code + '" wirklich löschen?')) return
    const { error } = await supabase.from('discount_codes').delete().eq('id', id)
    if (error) {
      toast({ title: 'Löschen fehlgeschlagen', variant: 'destructive' })
    } else {
      toast({ title: 'Rabattcode gelöscht' })
      loadCodes()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <TicketPercent className="w-8 h-8 text-luxe-gold" />
            Rabattcodes
          </h1>
          <p className="text-luxe-silver mt-1">Gutschein-Codes für den Checkout verwalten</p>
        </div>
        <Link href="/admin/discount-codes/new">
          <Button variant="luxe" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Neuer Rabattcode
          </Button>
        </Link>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Alle Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">Noch keine Rabattcodes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-luxe-gray">
                    <th className="py-3 px-2 text-white font-semibold">Code</th>
                    <th className="py-3 px-2 text-white font-semibold">Typ</th>
                    <th className="py-3 px-2 text-white font-semibold">Wert</th>
                    <th className="py-3 px-2 text-white font-semibold">Mindestbestellung</th>
                    <th className="py-3 px-2 text-white font-semibold">Nutzungen</th>
                    <th className="py-3 px-2 text-white font-semibold">Gültig bis</th>
                    <th className="py-3 px-2 text-white font-semibold">Status</th>
                    <th className="py-3 px-2 text-white font-semibold">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((row) => {
                    const now = new Date()
                    const validFrom = new Date(row.valid_from)
                    const validUntil = row.valid_until ? new Date(row.valid_until) : null
                    const isActive =
                      row.is_active &&
                      validFrom <= now &&
                      (!validUntil || validUntil >= now) &&
                      (row.max_uses == null || row.used_count < row.max_uses)
                    return (
                      <tr key={row.id} className="border-b border-luxe-gray/50">
                        <td className="py-3 px-2">
                          <span className="font-mono font-bold text-luxe-gold">{row.code}</span>
                        </td>
                        <td className="py-3 px-2 text-luxe-silver">
                          {row.type === 'percent' ? '%' : '€'}
                        </td>
                        <td className="py-3 px-2 text-white">
                          {row.type === 'percent' ? row.value + '%' : row.value + ' €'}
                        </td>
                        <td className="py-3 px-2 text-luxe-silver">
                          {row.min_order_amount != null ? row.min_order_amount + ' €' : '–'}
                        </td>
                        <td className="py-3 px-2 text-luxe-silver">
                          {row.used_count}
                          {row.max_uses != null ? ' / ' + row.max_uses : ''}
                        </td>
                        <td className="py-3 px-2 text-luxe-silver text-sm">
                          {row.valid_until ? formatDate(row.valid_until) : '∞'}
                        </td>
                        <td className="py-3 px-2">
                          {isActive ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                              Aktiv
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inaktiv</Badge>
                          )}
                        </td>
                        <td className="py-3 px-2 flex items-center gap-2">
                          <Link href={'/admin/discount-codes/' + row.id + '/edit'}>
                            <Button variant="ghost" size="sm" className="text-luxe-silver">
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300"
                            onClick={() => handleDelete(row.id, row.code)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
