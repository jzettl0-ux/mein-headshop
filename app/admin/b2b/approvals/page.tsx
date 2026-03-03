'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ClipboardCheck, Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatDate, formatPrice } from '@/lib/utils'

const POLICY_LABELS: Record<string, string> = {
  ORDER_LIMIT: 'Bestelllimit',
  RESTRICTED_CATEGORY: 'Kategorie',
  PREFERRED_VENDOR: 'Anbieter',
}

export default function AdminB2BApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    fetch('/api/admin/b2b/approvals')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setApprovals(Array.isArray(data) ? data : []))
      .catch(() => setApprovals([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleApprove = async (id: string) => {
    setActing(id)
    try {
      const res = await fetch(`/api/admin/b2b/approvals/${id}/approve`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({ title: 'Freigabe erteilt' })
      load()
    } catch (e) {
      toast({ title: 'Fehler', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setActing(null)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Grund der Ablehnung (optional):')
    setActing(id)
    try {
      const res = await fetch(`/api/admin/b2b/approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || null }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Freigabe abgelehnt' })
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7 text-luxe-gold" />
            B2B-Freigaben
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            Bestellungen, die auf Freigabe durch Einkaufsrichtlinien warten.
          </p>
        </div>
        <Link href="/admin/b2b">
          <Button variant="admin-outline">Zurück zu B2B-Konten</Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : approvals.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="w-12 h-12 text-luxe-silver/50 mx-auto mb-4" />
            <p className="text-luxe-silver">Keine Freigaben ausstehend.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {approvals.map((a) => {
            const order = a.orders
            const policy = a.purchasing_policies?.[0]
            const company = a.business_accounts?.company_name
            return (
              <Card key={a.approval_id} className="bg-luxe-charcoal border-luxe-gray">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">
                        {company && <span className="text-luxe-gold">{company}</span>} · #{order?.order_number ?? a.order_id?.slice(0, 8)}
                      </p>
                      <p className="text-sm text-luxe-silver">{order?.customer_name} · {order?.customer_email}</p>
                      <p className="text-sm text-luxe-silver mt-1">{formatPrice(order?.total ?? 0)}</p>
                      {policy && (
                        <Badge variant="secondary" className="mt-2">
                          {POLICY_LABELS[policy.policy_type] ?? policy.policy_type}
                        </Badge>
                      )}
                      <p className="text-xs text-luxe-silver mt-1">Angefordert: {formatDate(a.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(a.approval_id)} disabled={!!acting}>
                        {acting === a.approval_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                        Freigeben
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-500/50 text-red-400" onClick={() => handleReject(a.approval_id)} disabled={!!acting}>
                        <X className="w-4 h-4 mr-1" /> Ablehnen
                      </Button>
                      <Link href={`/admin/orders/${a.order_id}`}>
                        <Button size="sm" variant="admin-outline">Bestellung</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
