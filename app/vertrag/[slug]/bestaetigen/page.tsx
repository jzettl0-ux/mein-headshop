'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function AcceptContent() {
  const params = useParams()
  const slug = params?.slug as string
  const [contract, setContract] = useState<{ label: string; text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [accepted, setAccepted] = useState(false)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      setError('Vertrag nicht gefunden')
      return
    }
    fetch(`/api/contract/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Vertrag nicht gefunden')
        return res.json()
      })
      .then((data) => setContract({ label: data.label, text: data.text }))
      .catch(() => setError('Vertrag konnte nicht geladen werden.'))
      .finally(() => setLoading(false))
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accepted || !email.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/contract/accept/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || undefined, email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Bestätigung fehlgeschlagen')
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Bestätigung fehlgeschlagen.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-luxe-gold" />
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center p-8">
        <div className="text-center text-luxe-silver">
          <p className="text-lg">{error}</p>
          <Link href="/" className="text-luxe-gold hover:underline mt-4 inline-block">Zur Startseite</Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-luxe-black flex items-center justify-center p-8">
        <Card className="bg-luxe-charcoal border-luxe-gray max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-white mb-2">Vertrag bestätigt</h1>
            <p className="text-luxe-silver">
              Sie haben den Vertrag „{contract?.label}“ elektronisch bestätigt. Sie erhalten keine separate E-Mail; diese Seite dient als Nachweis.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-3xl">
        <div className="flex items-center gap-2 text-luxe-silver mb-6">
          <FileText className="w-5 h-5 text-luxe-gold" />
          <h1 className="text-2xl font-bold text-white">{contract?.label}</h1>
        </div>

        <Card className="bg-luxe-charcoal border-luxe-gray mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Vertragstext</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-luxe-silver text-sm leading-relaxed max-h-[50vh] overflow-y-auto">
              {contract?.text}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-lg">Elektronisch bestätigen</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">
              Mit der Bestätigung erklären Sie, den Vertrag gelesen und akzeptiert zu haben. Ein Ausdruck ist nicht erforderlich.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-luxe-silver">Name / Firma (optional)</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 bg-luxe-black border-luxe-gray text-white"
                  placeholder="Max Mustermann oder Firma GmbH"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-luxe-silver">E-Mail (Pflicht)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 bg-luxe-black border-luxe-gray text-white"
                  placeholder="ihre@email.de"
                  required
                />
              </div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="accept"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 rounded border-luxe-gray bg-luxe-black text-luxe-gold"
                />
                <Label htmlFor="accept" className="text-luxe-silver text-sm cursor-pointer">
                  Ich habe den Vertrag gelesen und akzeptiere ihn. Die elektronische Bestätigung ersetzt die Unterschrift, sofern vom Anbieter so vorgesehen.
                </Label>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <Button type="submit" variant="luxe" disabled={!accepted || !email.trim() || submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Vertrag elektronisch bestätigen
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VertragBestaetigenPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-luxe-black flex items-center justify-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-luxe-gold" />
      </div>
    }>
      <AcceptContent />
    </Suspense>
  )
}
