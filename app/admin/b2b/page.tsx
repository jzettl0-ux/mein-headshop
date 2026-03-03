'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'

export default function AdminB2BPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/b2b/accounts')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAccounts(Array.isArray(data) ? data : []))
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/b2b/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      })
      if (!res.ok) throw new Error()
      load()
      toast({ title: 'B2B-Konto freigegeben' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Grund der Ablehnung (optional):')
    try {
      const res = await fetch(`/api/admin/b2b/accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejected_reason: reason || null }),
      })
      if (!res.ok) throw new Error()
      load()
      toast({ title: 'B2B-Konto abgelehnt' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-7 h-7 text-luxe-gold" />
            B2B-Geschäftskonten
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Anträge prüfen und freigeben. USt-IdNr. wird bei Registrierung per VIES validiert.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/b2b/approvals">
            <Button variant="admin-outline">Freigaben</Button>
          </Link>
          <Link href="/admin/b2b/tiered-pricing">
            <Button variant="admin-outline">Staffelpreise</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : accounts.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Noch keine B2B-Anträge.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {accounts.map((a) => (
            <Card key={a.id} className="bg-luxe-charcoal border-luxe-gray">
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                <Link href={`/admin/b2b/accounts/${a.id}`} className="block hover:opacity-90">
                  <p className="font-medium text-white">{a.company_name}</p>
                  <p className="text-sm text-luxe-silver">{a.vat_id || '–'} · User: {a.user_id?.slice(0, 8)}…</p>
                  <p className="text-xs text-luxe-silver mt-0.5">Eingereicht: {formatDate(a.created_at)}</p>
                  <Badge variant={a.status === 'approved' ? 'default' : a.status === 'rejected' ? 'destructive' : 'secondary'} className="mt-1">
                    {a.status === 'approved' ? 'Freigegeben' : a.status === 'rejected' ? 'Abgelehnt' : 'Wartet'}
                  </Badge>
                </Link>
                {a.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(a.id)}>
                      <Check className="w-4 h-4 mr-1" /> Freigeben
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-500/50 text-red-400" onClick={() => handleReject(a.id)}>
                      <X className="w-4 h-4 mr-1" /> Ablehnen
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
