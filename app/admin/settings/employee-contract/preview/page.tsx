'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

function PreviewContent() {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams()
    const name = searchParams.get('employee_name')
    const address = searchParams.get('employee_address')
    const start = searchParams.get('start_date')
    if (name) params.set('employee_name', name)
    if (address) params.set('employee_address', address)
    if (start) params.set('start_date', start)
    const qs = params.toString()

    fetch(`/api/admin/employee-contract/preview${qs ? `?${qs}` : ''}`)
      .then((res) => {
        if (!res.ok) throw new Error('Vorschau nicht verfügbar')
        return res.json()
      })
      .then((data) => setText(data.text ?? ''))
      .catch(() => setText(''))
      .finally(() => setLoading(false))
  }, [searchParams])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 print:bg-white">
      <div className="max-w-3xl mx-auto px-6 py-8 print:py-4">
        <div className="no-print mb-6 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Vorschau mit ersetzten Platzhaltern (Firmendaten). Optional: URL-Parameter employee_name, employee_address, start_date setzen.
          </p>
          <Button onClick={handlePrint} className="print:hidden">
            <Printer className="w-4 h-4 mr-2" />
            Drucken
          </Button>
        </div>
        <div
          className="whitespace-pre-wrap font-serif text-base leading-relaxed"
          style={{ whiteSpace: 'pre-wrap' }}
        >
          {text ?? ''}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}} />
    </div>
  )
}

export default function EmployeeContractPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    }>
      <PreviewContent />
    </Suspense>
  )
}
