'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, ArrowLeft, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCurrentUser } from '@/lib/supabase/auth'
import { useToast } from '@/hooks/use-toast'

export default function AccountB2BPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState<{ has_b2b: boolean; status: string | null; company_name?: string | null; vat_id?: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState('')
  const [vatId, setVatId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) {
        router.push('/auth?redirect=/account/b2b')
        return
      }
      fetch('/api/account/b2b/status')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setStatus(data ?? { has_b2b: false, status: null }))
        .catch(() => setStatus({ has_b2b: false, status: null }))
        .finally(() => setLoading(false))
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyName.trim()) {
      toast({ title: 'Firmenname erforderlich', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/account/b2b/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_name: companyName.trim(), vat_id: vatId.trim() || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'B2B-Antrag eingereicht', description: 'Wir melden uns nach Prüfung.' })
      setStatus((prev) => ({ ...prev!, has_b2b: true, status: 'pending', company_name: companyName.trim() }))
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-xl">
        <Link href="/account" className="inline-flex items-center text-luxe-silver hover:text-white mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück zum Konto
        </Link>

        <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
          <Building2 className="w-7 h-7 text-luxe-gold" />
          B2B-Geschäftskonto
        </h1>
        <p className="text-luxe-silver text-sm mb-8">
          Als Geschäftskunde erhältst du Staffelpreise bei Mengenbestellungen. USt-IdNr. wird per VIES validiert.
        </p>

        {status?.status === 'approved' && (
          <Card className="bg-luxe-charcoal border-luxe-gray mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <Check className="w-5 h-5" />
                <span className="font-semibold">B2B-Konto freigegeben</span>
              </div>
              <p className="text-luxe-silver text-sm">
                Du erhältst automatisch Staffelpreise im Checkout, sofern für die bestellten Produkte definiert.
              </p>
              {status.company_name && (
                <p className="text-white mt-2">{status.company_name}</p>
              )}
            </CardContent>
          </Card>
        )}

        {status?.status === 'rejected' && (
          <Card className="bg-luxe-charcoal border-red-500/30 mb-8">
            <CardContent className="p-6">
              <p className="text-red-400 font-medium">B2B-Antrag wurde abgelehnt.</p>
              <p className="text-luxe-silver text-sm mt-1">Bei Fragen kontaktiere uns bitte.</p>
            </CardContent>
          </Card>
        )}

        {status?.status === 'pending' && (
          <Card className="bg-luxe-charcoal border-amber-500/30 mb-8">
            <CardContent className="p-6">
              <p className="text-amber-400 font-medium">Antrag wird geprüft</p>
              <p className="text-luxe-silver text-sm mt-1">Wir melden uns mit dem Ergebnis.</p>
            </CardContent>
          </Card>
        )}

        {(!status?.has_b2b || status?.status === 'rejected') && (
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-luxe-silver">Firmenname *</Label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="z. B. Muster GmbH"
                    className="bg-luxe-black border-luxe-gray text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-luxe-silver">USt-IdNr. (optional)</Label>
                  <Input
                    value={vatId}
                    onChange={(e) => setVatId(e.target.value)}
                    placeholder="DE123456789"
                    className="bg-luxe-black border-luxe-gray text-white mt-1"
                  />
                  <p className="text-xs text-luxe-silver mt-1">Wird bei Angabe per VIES validiert.</p>
                </div>
                <Button type="submit" variant="luxe" disabled={submitting}>
                  {submitting ? 'Wird gesendet…' : 'B2B-Konto beantragen'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
