'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Printer, ExternalLink, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Seite zum Anzeigen und Drucken eines Versandlabels.
 * ?shipmentId=xxx erforderlich. Lädt das Label-PDF per API und zeigt es im iframe.
 */
export default function PrintLabelPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''
  const shipmentId = searchParams?.get('shipmentId') ?? ''

  const [error, setError] = useState<string | null>(null)
  const pdfUrl =
    orderId && shipmentId
      ? `/api/admin/orders/${encodeURIComponent(orderId)}/shipments/${encodeURIComponent(shipmentId)}/label-pdf`
      : null

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const handleOpenInNewTab = useCallback(() => {
    if (pdfUrl) window.open(pdfUrl, '_blank', 'noopener,noreferrer')
  }, [pdfUrl])

  useEffect(() => {
    if (!orderId || !shipmentId) setError('Bestellung oder Sendung fehlt')
  }, [orderId, shipmentId])

  if (!orderId || !shipmentId) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-luxe-silver">Bestellung oder Sendung nicht angegeben.</p>
          <Link href={`/admin/orders/${orderId || ''}`}>
            <Button variant="outline" className="border-luxe-gold text-luxe-gold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zur Bestellung
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxe-charcoal text-white p-4 print:p-0">
      <div className="max-w-4xl mx-auto space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/admin/orders/${orderId}`}
            className="text-luxe-gold hover:underline flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zur Bestellung
          </Link>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handlePrint}
              className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90"
            >
              <Printer className="w-4 h-4 mr-2" />
              Jetzt drucken
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenInNewTab}
              className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              In neuem Tab öffnen
            </Button>
          </div>
        </div>
        <p className="text-xs text-luxe-silver">
          Das Label wird unten angezeigt. Klicke auf „Jetzt drucken“ oder öffne es in einem neuen Tab und drucke dort (Strg+P).
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 p-4 print:hidden">
          {error}
        </div>
      )}

      <div className="mt-4 rounded-lg overflow-hidden border border-luxe-gray bg-white print:border-0 print:rounded-none" style={{ minHeight: '80vh' }}>
        {pdfUrl && !error && (
          <iframe
            title="Versandlabel"
            src={pdfUrl}
            className="w-full h-[85vh] min-h-[800px] print:h-screen print:min-h-0"
            style={{ border: 'none' }}
          />
        )}
      </div>
    </div>
  )
}
