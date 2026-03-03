'use client'

import { useState } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export interface AdminBereichErklaerungProps {
  /** Titel des Bereichs (z. B. "Bestellungen") */
  title?: string
  /** Was macht dieser Bereich? Kurz in 1–2 Sätzen. */
  was?: string
  /** Wozu ist es gut? Nutzen für den Shop. */
  wozu?: string
  /** Wie funktioniert es? Ablauf oder Hinweise. */
  wie?: string
  /** Optional: Nur als Klappbereich anzeigen (standard: true) */
  collapsible?: boolean
  /** Legacy: Titel (alt: titel) */
  titel?: string
  /** Legacy: Zweck/Nutzen (wird zu wozu) */
  zweck?: string
  /** Legacy: Ablauf (wird zu wie) */
  funktionsweise?: string
  /** Legacy: Wann nutzen (wird in wozu eingebaut) */
  wannNutzen?: string
}

/**
 * Zeigt auf Admin-Seiten eine einheitliche Erklärung: Was macht der Bereich, wozu ist er da, wie funktioniert er?
 * Hilft neuen Nutzern, sich zurechtzufinden.
 */
export function AdminBereichErklaerung(props: AdminBereichErklaerungProps) {
  const {
    title: titleProp,
    was: wasProp,
    wozu: wozuProp,
    wie: wieProp,
    collapsible = true,
    titel,
    zweck,
    funktionsweise,
    wannNutzen,
  } = props
  const title = titleProp ?? titel ?? ''
  const was = wasProp ?? zweck ?? ''
  const wozu = wozuProp ?? wannNutzen ?? ''
  const wie = wieProp ?? funktionsweise
  const [open, setOpen] = useState(false)

  return (
    <Card className="bg-luxe-charcoal/80 border-luxe-gray mb-6">
      <CardHeader
        className="cursor-pointer py-3 px-4 flex flex-row items-center justify-between gap-2"
        onClick={collapsible ? () => setOpen((o) => !o) : undefined}
      >
        <span className="text-sm font-medium text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-luxe-gold shrink-0" />
          Was macht dieser Bereich?
        </span>
        {collapsible && (open ? <ChevronUp className="w-4 h-4 text-luxe-silver" /> : <ChevronDown className="w-4 h-4 text-luxe-silver" />)}
      </CardHeader>
      {(!collapsible || open) && (title || was || wozu || wie) && (
        <CardContent className="pt-0 px-4 pb-4 text-sm text-white/90 space-y-3">
          {title && <p className="font-medium text-white/95">{title}</p>}
          {was && <p className="text-white/85">{was}</p>}
          {wozu && (
            <div>
              <p className="font-medium text-white/95">Wozu ist das gut?</p>
              <p className="text-white/85 mt-0.5">{wozu}</p>
            </div>
          )}
          {wie && (
            <div>
              <p className="font-medium text-white/95">So funktioniert es</p>
              <p className="text-white/85 mt-0.5">{wie}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
