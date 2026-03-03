'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Share2, UserPlus, CreditCard, Loader2, Check, Copy, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCurrentUser } from '@/lib/supabase/auth'
import { formatPrice } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Participant {
  participant_id: string
  customer_id: string | null
  guest_email: string | null
  amount_assigned: number
  amount_paid: number
  payment_status: string
  amount_remaining: number
}

interface SplitData {
  split_id: string
  order_number: string | null
  customer_name: string | null
  total_order_amount: number
  total_paid_so_far: number
  status: string
  initiator_customer_id: string
  participants: Participant[]
}

export default function SplitPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = typeof params.token === 'string' ? params.token : ''
  const { toast } = useToast()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [split, setSplit] = useState<SplitData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addEmail, setAddEmail] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [adding, setAdding] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [guestEmail, setGuestEmail] = useState<Record<string, string>>({})

  useEffect(() => {
    getCurrentUser().then((u) => setUser(u ?? null))
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`/api/split/${encodeURIComponent(token)}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('Split nicht gefunden')
        return r.json()
      })
      .then(setSplit)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const isInitiator = user && split?.initiator_customer_id === user.id
  const paidParam = searchParams.get('paid')

  useEffect(() => {
    if (paidParam === '1' && token) {
      toast({ title: 'Zahlung erfolgreich', description: 'Dein Anteil wurde verbucht.' })
      router.replace(`/split/${token}`, { scroll: false })
    }
  }, [paidParam, token, router, toast])

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addEmail.trim() || !addAmount) return
    const amount = parseFloat(addAmount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return
    setAdding(true)
    try {
      const res = await fetch(`/api/split/${encodeURIComponent(token)}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: addEmail.trim(), amount_eur: amount }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setAddEmail('')
      setAddAmount('')
      toast({ title: 'Teilnehmer hinzugefügt' })
      const refetch = await fetch(`/api/split/${encodeURIComponent(token)}`, { credentials: 'include' })
      if (refetch.ok) setSplit(await refetch.json())
    } catch (err: unknown) {
      toast({ title: (err as Error).message, variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }

  const handlePay = async (participantId: string, isGuest: boolean) => {
    setPayingId(participantId)
    try {
      const body: { participant_id: string; email?: string } = { participant_id: participantId }
      if (isGuest && guestEmail[participantId]) body.email = guestEmail[participantId]
      const res = await fetch(`/api/split/${encodeURIComponent(token)}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      if (data.checkout_url) window.location.href = data.checkout_url
    } catch (err: unknown) {
      toast({ title: (err as Error).message, variant: 'destructive' })
    } finally {
      setPayingId(null)
    }
  }

  const copyShareLink = () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/split/${token}` : ''
    navigator.clipboard?.writeText(url).then(
      () => toast({ title: 'Link kopiert' }),
      () => toast({ title: 'Kopieren fehlgeschlagen', variant: 'destructive' })
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-luxe-gold animate-spin" />
      </div>
    )
  }

  if (error || !split) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-luxe-charcoal border border-luxe-gray rounded-lg p-8 max-w-md text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Link ungültig</h1>
          <p className="text-luxe-silver mb-6">{error ?? 'Diese Split-Zahlung existiert nicht oder ist abgelaufen.'}</p>
          <Link href="/" className="text-luxe-gold hover:underline">
            Zur Startseite
          </Link>
        </motion.div>
      </div>
    )
  }

  const fullyPaid = split.status === 'FULLY_PAID'

  return (
    <div className="min-h-screen bg-luxe-black py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-luxe-charcoal border border-luxe-gray rounded-xl p-6 sm:p-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {fullyPaid ? 'Rechnung vollständig bezahlt' : 'Rechnung teilen'}
          </h1>
          {split.order_number && (
            <p className="text-luxe-silver mb-6">Bestellung #{split.order_number}</p>
          )}

          <div className="grid gap-6 sm:grid-cols-2 mb-8">
            <div className="p-4 rounded-lg bg-luxe-black/50">
              <p className="text-luxe-silver text-sm">Gesamtbetrag</p>
              <p className="text-2xl font-bold text-white">{formatPrice(split.total_order_amount)}</p>
            </div>
            <div className="p-4 rounded-lg bg-luxe-black/50">
              <p className="text-luxe-silver text-sm">Bereits bezahlt</p>
              <p className="text-2xl font-bold text-luxe-gold">{formatPrice(split.total_paid_so_far)}</p>
            </div>
          </div>

          {!fullyPaid && (
            <div className="flex flex-wrap gap-3 mb-6">
              <Button
                variant="outline"
                onClick={copyShareLink}
                className="border-luxe-gray text-white hover:bg-luxe-gray/20"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Link kopieren
              </Button>
            </div>
          )}

          <h2 className="text-lg font-semibold text-white mb-4">Teilnehmer</h2>
          <div className="space-y-3 mb-8">
            {split.participants.map((p) => (
              <div
                key={p.participant_id}
                className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-lg bg-luxe-black/50 border border-luxe-gray/50"
              >
                <div>
                  <p className="text-white font-medium">
                    {p.guest_email ?? (p.customer_id === split.initiator_customer_id ? `${split.customer_name ?? 'Du'} (Initiator)` : 'Teilnehmer')}
                  </p>
                  <p className="text-luxe-silver text-sm">{formatPrice(p.amount_assigned)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {p.payment_status === 'SUCCESS' ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-sm">
                      <Check className="w-4 h-4" />
                      Bezahlt
                    </span>
                  ) : p.amount_remaining > 0 ? (
                    <>
                      {!p.customer_id && (
                        <Input
                          type="email"
                          placeholder="Deine E-Mail"
                          value={guestEmail[p.participant_id] ?? ''}
                          onChange={(e) => setGuestEmail((prev) => ({ ...prev, [p.participant_id]: e.target.value }))}
                          className="max-w-[180px] bg-luxe-black border-luxe-gray text-white"
                        />
                      )}
                      <Button
                        size="sm"
                        onClick={() => handlePay(p.participant_id, !p.customer_id)}
                        disabled={payingId === p.participant_id || (!p.customer_id && !guestEmail[p.participant_id]?.trim())}
                      >
                        {payingId === p.participant_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-1" />
                            {formatPrice(p.amount_remaining)} zahlen
                          </>
                        )}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {isInitiator && !fullyPaid && (
            <form onSubmit={handleAddParticipant} className="space-y-4 p-4 rounded-lg border border-luxe-gold/30 bg-luxe-gold/5">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Teilnehmer hinzufügen
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor="add-email" className="text-luxe-silver text-sm">E-Mail</Label>
                  <Input
                    id="add-email"
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="freund@beispiel.de"
                    required
                    className="bg-luxe-black border-luxe-gray text-white mt-1"
                  />
                </div>
                <div className="w-full sm:w-32">
                  <Label htmlFor="add-amount" className="text-luxe-silver text-sm">Betrag (€)</Label>
                  <Input
                    id="add-amount"
                    type="text"
                    inputMode="decimal"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value.replace(/[^0-9,.]/g, ''))}
                    placeholder="25,00"
                    required
                    className="bg-luxe-black border-luxe-gray text-white mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={adding}>
                    {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hinzufügen'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {fullyPaid && (
            <p className="text-luxe-silver text-sm text-center mt-6">
              Die Bestellung wird bearbeitet. Du erhältst eine Bestätigung per E-Mail.
            </p>
          )}

          <div className="mt-8 text-center">
            <Link href="/" className="text-luxe-gold hover:underline text-sm">
              Zurück zur Startseite
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
