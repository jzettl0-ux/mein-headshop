'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, XCircle, Loader2, ScanLine } from 'lucide-react'
import Link from 'next/link'

function VerifyContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')?.trim().toUpperCase()
  const [result, setResult] = useState<{
    valid: boolean
    authenticated?: boolean
    message?: string
    status?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [noCodeProvided, setNoCodeProvided] = useState(false)

  useEffect(() => {
    if (!code) {
      setNoCodeProvided(true)
      setLoading(false)
      return
    }
    setNoCodeProvided(false)
    fetch(`/api/transparency/verify?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then(setResult)
      .catch(() => setResult({ valid: false, message: 'Prüfung fehlgeschlagen.' }))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
        <p className="text-neutral-500">Prüfe Authentizität…</p>
      </div>
    )
  }

  // Landing: Kein Code – Info-Seite statt „Nicht verifiziert“
  if (noCodeProvided) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 px-4">
        <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4">
          <ScanLine className="w-16 h-16 text-amber-600 dark:text-amber-500" />
        </div>
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">Originalität prüfen</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Scanne den QR-Code auf der Produktverpackung. Du wirst automatisch hierher weitergeleitet und siehst sofort, ob dein Produkt original ist.
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Hast du den Code manuell? Füge <code className="bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">?code=DEIN_CODE</code> an die URL an.
          </p>
        </div>
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6 px-4">
      {result.valid && result.authenticated ? (
        <>
          <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4">
            <ShieldCheck className="w-16 h-16 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-emerald-800 dark:text-emerald-400">Original bestätigt</h1>
            <p className="mt-2 text-neutral-600 dark:text-neutral-400">{result.message}</p>
          </div>
        </>
      ) : (
        <>
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
            <XCircle className="w-16 h-16 text-red-600 dark:text-red-500" />
          </div>
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-red-800 dark:text-red-400">Nicht verifiziert</h1>
            <p className="text-neutral-600 dark:text-neutral-400">{result.message}</p>
            <Link
              href="/verify"
              className="inline-block text-sm text-amber-600 dark:text-amber-500 hover:underline"
            >
              ← Zur Originalitäts-Prüfung
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div className="container mx-auto py-12">
      <Suspense fallback={
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  )
}
