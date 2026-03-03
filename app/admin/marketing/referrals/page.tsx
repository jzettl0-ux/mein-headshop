'use client'

import { useState, useEffect } from 'react'
import { UserPlus, Users, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

type ReferralRow = {
  id: string
  referrer_user_id: string
  referrer_email: string | null
  referral_code: string
  referred_email: string
  referred_user_id: string | null
  order_id: string | null
  status: string
  created_at: string
  completed_at: string | null
}

type Data = {
  total: number
  completed: number
  pending: number
  referrals: ReferralRow[]
}

export default function AdminMarketingReferralsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/referrals')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => toast({ title: 'Laden fehlgeschlagen', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-luxe-gold animate-spin" />
      </div>
    )
  }

  const stats = [
    { label: 'Empfehlungen gesamt', value: data?.total ?? 0, icon: UserPlus },
    { label: 'Abgeschlossen (bezahlt)', value: data?.completed ?? 0, icon: CheckCircle },
    { label: 'Ausstehend', value: data?.pending ?? 0, icon: Clock },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <UserPlus className="w-7 h-7 text-luxe-gold" />
          Empfehlungsprogramm
        </h1>
        <p className="text-luxe-silver mt-1">
          Neukunden, die über Empfehlungslinks geworben wurden
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="bg-luxe-charcoal border-luxe-gray">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-luxe-gold/10">
                  <Icon className="w-5 h-5 text-luxe-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-sm text-luxe-silver">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-luxe-gold" />
            Letzte Empfehlungen
          </CardTitle>
          <CardDescription className="text-luxe-silver">
            Werber, geworbener Kunde, Status und Bestellung
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.referrals?.length ? (
            <p className="text-luxe-silver py-6">Noch keine Empfehlungen.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-luxe-gray text-left text-luxe-silver">
                    <th className="pb-3 pr-4">Datum</th>
                    <th className="pb-3 pr-4">Werber (E-Mail)</th>
                    <th className="pb-3 pr-4">Code</th>
                    <th className="pb-3 pr-4">Geworbener</th>
                    <th className="pb-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.referrals.map((r) => (
                    <tr key={r.id} className="border-b border-luxe-gray/70">
                      <td className="py-3 pr-4 text-luxe-silver">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('de-DE', { dateStyle: 'short' }) : '–'}
                      </td>
                      <td className="py-3 pr-4 text-white">{r.referrer_email ?? r.referrer_user_id}</td>
                      <td className="py-3 pr-4 font-mono text-luxe-silver">{r.referral_code}</td>
                      <td className="py-3 pr-4 text-white">{r.referred_email}</td>
                      <td className="py-3">
                        <span className={r.status === 'completed' ? 'text-green-400' : 'text-amber-400'}>
                          {r.status === 'completed' ? 'Abgeschlossen' : 'Ausstehend'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
