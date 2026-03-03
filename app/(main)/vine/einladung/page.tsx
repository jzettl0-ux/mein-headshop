'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Gift, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function VineInvitationPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'not_found' | 'invited' | 'accepted' | 'declined' | 'done'>('loading')
  const [productName, setProductName] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('not_found')
      return
    }
    fetch(`/api/vine/invitation?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) {
          setStatus('not_found')
          return
        }
        setProductName(data.product_name ?? '')
        const s = data.status
        setStatus(s === 'accepted' || s === 'declined' || s === 'completed' ? 'done' : s === 'invited' ? 'invited' : 'done')
      })
      .catch(() => setStatus('not_found'))
  }, [token])

  const handleAccept = async () => {
    if (!token) return
    const res = await fetch('/api/vine/invitation/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (res.ok) setStatus('accepted')
  }

  const handleDecline = async () => {
    if (!token) return
    const res = await fetch('/api/vine/invitation/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (res.ok) setStatus('declined')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-luxe-silver">Laden...</p>
      </div>
    )
  }

  if (status === 'not_found') {
    return (
      <div className="container-luxe py-16">
        <Card className="max-w-lg mx-auto bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-8 text-center">
            <p className="text-luxe-silver">Einladung nicht gefunden oder abgelaufen.</p>
            <Link href="/">
              <Button variant="luxe" className="mt-4">Zur Startseite</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'accepted' || status === 'done') {
    return (
      <div className="container-luxe py-16">
        <Card className="max-w-lg mx-auto bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-8 text-center">
            <Gift className="w-12 h-12 mx-auto text-luxe-gold mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Vielen Dank!</h1>
            <p className="text-luxe-silver">
              {status === 'accepted'
                ? 'Du hast die Einladung angenommen. Wir informieren dich per E-Mail, sobald dein Muster versandt wurde. Bitte schreibe danach eine Bewertung zum Produkt.'
                : 'Diese Einladung wurde bereits bearbeitet.'}
            </p>
            <Link href="/">
              <Button variant="luxe" className="mt-4">Zum Shop</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (status === 'declined') {
    return (
      <div className="container-luxe py-16">
        <Card className="max-w-lg mx-auto bg-luxe-charcoal border-luxe-gray">
          <CardContent className="p-8 text-center">
            <p className="text-luxe-silver">Du hast die Einladung abgelehnt.</p>
            <Link href="/">
              <Button variant="luxe" className="mt-4">Zur Startseite</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container-luxe py-16">
      <Card className="max-w-lg mx-auto bg-luxe-charcoal border-luxe-gray">
        <CardContent className="p-8">
          <Gift className="w-12 h-12 text-luxe-gold mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Produkttester-Einladung</h1>
          <p className="text-luxe-silver mb-6">
            Du wurdest eingeladen, <strong className="text-white">{productName || 'ein Produkt'}</strong> als Tester zu bewerten. Du erhältst ein kostenloses Muster und schreibst danach eine Bewertung.
          </p>
          <div className="flex gap-4">
            <Button variant="luxe" onClick={handleAccept} className="flex-1">
              <Check className="w-4 h-4 mr-2" /> Annehmen
            </Button>
            <Button variant="admin-outline" onClick={handleDecline} className="flex-1">
              <X className="w-4 h-4 mr-2" /> Ablehnen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
