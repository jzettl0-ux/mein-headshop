'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Kurzformular: Bestellnummer optional eintragen, dann Link zum Kontaktformular
 * mit vorausgefülltem Betreff "Widerruf" und Bestellnummer.
 */
export function WiderrufFormular() {
  const [orderNumber, setOrderNumber] = useState('')
  const params = new URLSearchParams({ subject: 'Widerruf' })
  if (orderNumber.trim()) params.set('order_number', orderNumber.trim())
  const contactHref = `/contact?${params.toString()}`

  return (
    <div className="rounded-lg border border-luxe-gold/30 bg-luxe-gold/5 p-4 mt-6">
      <h3 className="text-white font-semibold flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-luxe-gold" />
        Widerruf erklären
      </h3>
      <p className="text-luxe-silver text-sm mb-4">
        Du kannst dein Widerrufsrecht formlos per E-Mail ausüben. Nutze dazu unser Kontaktformular – Betreff und optional deine Bestellnummer werden vorausgefüllt.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label htmlFor="widerruf-order" className="text-luxe-silver text-xs">Bestellnummer (optional)</Label>
          <Input
            id="widerruf-order"
            type="text"
            placeholder="z. B. B-2024-001234"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="mt-1 bg-luxe-charcoal border-luxe-gray text-white"
          />
        </div>
        <div className="flex items-end">
          <Button variant="luxe" className="w-full sm:w-auto" asChild>
            <Link href={contactHref}>Zum Kontaktformular</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
