'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import type { DiscountCode } from '@/lib/types'

export default function EditDiscountCodePage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const [form, setForm] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: '',
    min_order_amount: '',
    max_uses: '',
    valid_until: '',
    is_active: true,
  })

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('id', params.id)
        .single()
      if (error || !data) {
        toast({ title: 'Code nicht gefunden', variant: 'destructive' })
        router.push('/admin/discount-codes')
        return
      }
      const row = data as DiscountCode
      setForm({
        code: row.code,
        type: row.type,
        value: row.value.toString(),
        min_order_amount: row.min_order_amount?.toString() ?? '',
        max_uses: row.max_uses?.toString() ?? '',
        valid_until: row.valid_until ? row.valid_until.slice(0, 10) : '',
        is_active: row.is_active,
      })
      setLoadingData(false)
    }
    load()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase
        .from('discount_codes')
        .update({
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: parseFloat(form.value) || 0,
          min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          valid_until: form.valid_until || null,
          is_active: form.is_active,
        })
        .eq('id', params.id)
      if (error) throw error
      toast({ title: 'Rabattcode aktualisiert' })
      router.push('/admin/discount-codes')
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin/discount-codes"
        className="inline-flex items-center text-luxe-silver hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück zu Rabattcodes
      </Link>
      <h1 className="text-3xl font-bold text-white">Rabattcode bearbeiten</h1>

      <Card className="bg-luxe-charcoal border-luxe-gray max-w-xl">
        <CardHeader>
          <CardTitle className="text-white">Code-Daten</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white">Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="bg-luxe-gray border-luxe-silver text-white font-mono uppercase"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Typ</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}
                  className="w-full h-10 px-3 rounded-md bg-luxe-gray border border-luxe-silver text-white"
                >
                  <option value="percent">Prozent (%)</option>
                  <option value="fixed">Fester Betrag (€)</option>
                </select>
              </div>
              <div>
                <Label className="text-white">Wert *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="bg-luxe-gray border-luxe-silver text-white"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Mindestbestellung (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                  className="bg-luxe-gray border-luxe-silver text-white"
                />
              </div>
              <div>
                <Label className="text-white">Max. Nutzungen</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  className="bg-luxe-gray border-luxe-silver text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-white">Gültig bis (optional)</Label>
              <Input
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                className="bg-luxe-gray border-luxe-silver text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded border-luxe-gray"
              />
              <Label htmlFor="is_active" className="text-white">Aktiv</Label>
            </div>
            <Button type="submit" variant="luxe" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
