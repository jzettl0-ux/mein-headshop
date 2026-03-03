'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface DropRadarButtonProps {
  productId: string
  className?: string
}

export function DropRadarButton({ productId, className }: DropRadarButtonProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast({ title: 'E-Mail angeben', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/drop-radar/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, email: email.trim(), notification_channel: 'EMAIL' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setSubscribed(true)
      toast({ title: 'Du wirst bei Restock per E-Mail benachrichtigt.' })
    } catch (err: any) {
      toast({ title: err.message || 'Fehler', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (subscribed) {
    return (
      <div className={`p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg ${className ?? ''}`}>
        <div className="flex items-center gap-2 text-emerald-400">
          <Bell className="w-5 h-5" />
          <span>Du wirst bei Restock benachrichtigt.</span>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-2 ${className ?? ''}`}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Deine E-Mail"
        className="flex-1 rounded-lg bg-luxe-charcoal border border-luxe-gray text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-luxe-gold"
        required
      />
      <Button
        type="submit"
        variant="luxe"
        disabled={loading}
        className="flex items-center justify-center gap-2 shrink-0"
      >
        <Bell className="w-4 h-4" />
        {loading ? 'Wird gesendet…' : 'Benachrichtige mich'}
      </Button>
    </form>
  )
}
