'use client'

import { useState, useEffect } from 'react'
import { TicketPercent } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VoucherBadgesProps {
  /** Aktuelle Kategorie (z.B. bongs) für scope=category */
  category?: string
  /** Subtotal für Mindestbestellwert-Filter */
  subtotal?: number
  /** Produkt-ID für scope=product */
  productId?: string
  /** Wenn gesetzt: Code nur übernehmen, nicht zu Checkout navigieren (z.B. auf Checkout-Seite) */
  onApply?: (code: string) => void
}

export function VoucherBadges({ category, subtotal = 0, productId, onApply }: VoucherBadgesProps) {
  const [badges, setBadges] = useState<{ code: string; badge_label: string }[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const params = new URLSearchParams()
    if (subtotal > 0) params.set('subtotal', String(subtotal))
    if (category) params.set('category', category)
    if (productId) params.set('product_id', productId)
    fetch(`/api/coupons/eligible?${params}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBadges(Array.isArray(data) ? data : []))
      .catch(() => setBadges([]))
  }, [category, subtotal, productId])

  const handleClick = (code: string) => {
    if (onApply) {
      onApply(code)
      toast({ title: 'Code übernommen', description: code })
      return
    }
    navigator.clipboard?.writeText(code).then(() => {
      toast({ title: 'Code kopiert', description: `${code} – Weiterleitung zum Checkout` })
      window.location.href = `/checkout?discount=${encodeURIComponent(code)}`
    }).catch(() => {
      window.location.href = `/checkout?discount=${encodeURIComponent(code)}`
    })
  }

  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b) => (
        <button
          key={b.code}
          type="button"
          onClick={() => handleClick(b.code)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-luxe-gold/20 border border-luxe-gold/50 text-luxe-gold hover:bg-luxe-gold/30 text-sm font-medium transition-colors"
        >
          <TicketPercent className="w-4 h-4" />
          {b.badge_label}
        </button>
      ))}
    </div>
  )
}
