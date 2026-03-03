'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'

interface PriceLockButtonProps {
  productId: string
  lockedPrice: number
  className?: string
}

export function PriceLockButton({ productId, lockedPrice, className }: PriceLockButtonProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/price-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          locked_price: lockedPrice,
          email: email.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      const url = data.checkout_url
      setCheckoutUrl(url)
      toast({ title: 'Preis für 24h gesichert! Checkout-Link per E-Mail oder hier klicken.' })
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (checkoutUrl) {
    return (
      <a
        href={checkoutUrl}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gold text-luxe-black font-semibold hover:bg-luxe-gold/90 ${className ?? ''}`}
      >
        <Lock className="w-4 h-4" />
        Jetzt zum exklusiven Preis einkaufen
      </a>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-2 ${className ?? ''}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-Mail (für Checkout-Link)"
        className="flex-1 rounded-lg bg-luxe-charcoal border border-luxe-gray text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-luxe-gold"
      />
      <Button
        type="submit"
        variant="luxe"
        disabled={loading}
        className="flex items-center justify-center gap-2 shrink-0"
      >
        <Lock className="w-4 h-4" />
        {loading ? 'Wird gesichert…' : `${formatPrice(lockedPrice)} für 24h sichern`}
      </Button>
    </form>
  )
}
