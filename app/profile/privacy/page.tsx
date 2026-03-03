'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Download, Trash2, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/supabase/auth'

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: 'Der Bestätigungslink ist ungültig.',
  invalid_token: 'Der Bestätigungslink ist ungültig oder wurde bereits verwendet.',
  already_confirmed: 'Die Löschung wurde bereits bestätigt.',
  token_expired: 'Der Link ist abgelaufen. Bitte fordern Sie die Konto-Löschung erneut an.',
  delete_failed: 'Die Löschung konnte technisch nicht durchgeführt werden. Bitte kontaktieren Sie den Support.',
  service_unavailable: 'Der Dienst ist derzeit nicht verfügbar.',
}

export default function ProfilePrivacyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const urlError = searchParams.get('error')
  const deleted = searchParams.get('deleted')

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u ?? null)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (deleted === '1') {
      router.replace('/auth')
    }
  }, [deleted, router])

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await fetch('/api/user/gdpr-export')
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Export fehlgeschlagen')
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition')
      const match = disposition?.match(/filename="([^"]+)"/)
      const filename = match ? match[1] : `meine-daten-${new Date().toISOString().slice(0, 10)}.json`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Export fehlgeschlagen')
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteRequest = async () => {
    if (!confirm('Möchten Sie Ihr Konto wirklich löschen? Sie erhalten eine E-Mail mit einem Bestätigungslink. Erst nach Klick auf diesen Link wird das Konto endgültig gelöscht.')) return
    setDeleteLoading(true)
    setDeleteError(null)
    setDeleteMessage(null)
    try {
      const res = await fetch('/api/user/gdpr-delete-request', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteError(data.error || 'Anfrage fehlgeschlagen')
        return
      }
      setDeleteMessage(data.message || 'Eine E-Mail mit dem Bestätigungslink wurde an Sie gesendet.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#2D5A2D]" />
      </div>
    )
  }

  if (!user) {
    router.replace(`/auth?redirect=${encodeURIComponent('/profile/privacy')}`)
    return null
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#1A1A1A] sm:text-4xl">
          Datenschutz & Transparenz
        </h1>
        <p className="mt-4 text-[#6B6B6B] leading-relaxed">
          Sie haben das Recht zu wissen, welche Daten wir über Sie speichern, und Ihr Konto auf Wunsch löschen zu lassen.
          Hier können Sie Ihre Daten anfordern oder eine Löschung einleiten.
        </p>

        {urlError && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm">{ERROR_MESSAGES[urlError] ?? 'Ein Fehler ist aufgetreten.'}</p>
          </div>
        )}

        {/* Daten anfordern */}
        <section className="mt-12 border border-[#E5E5E5] bg-white p-8 sm:p-10">
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A]">Meine Daten anfordern</h2>
          <p className="mt-2 text-sm text-[#6B6B6B] leading-relaxed">
            Gemäß Art. 15 DSGVO können Sie eine Kopie Ihrer bei uns gespeicherten Daten erhalten: Profil, Adressen,
            Treuepunkte, Bestellungen und Bewertungen. Die Daten werden als JSON-Datei heruntergeladen und jeder
            Export wird aus Sicherheitsgründen protokolliert.
          </p>
          <Button
            onClick={handleExport}
            disabled={exportLoading}
            className="mt-6 gap-2 bg-[#2D5A2D] text-white hover:bg-[#2D5A2D]/90"
          >
            {exportLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Meine Daten anfordern
          </Button>
          <p className="mt-3 text-xs text-[#8A8A8A]">
            Format: JSON (strukturierte Datei, z. B. mit Editor öffenbar)
          </p>
        </section>

        {/* Konto löschen */}
        <section className="mt-8 border border-[#E5E5E5] bg-white p-8 sm:p-10">
          <h2 className="font-serif text-xl font-semibold text-[#1A1A1A]">Konto löschen</h2>
          <p className="mt-2 text-sm text-[#6B6B6B] leading-relaxed">
            Sie haben das Recht auf Löschung Ihrer personenbezogenen Daten (Art. 17 DSGVO – Recht auf Vergessenwerden).
            Wenn Sie Ihr Konto löschen möchten, senden wir Ihnen eine Bestätigungs-E-Mail. Erst nach Klick auf den
            Link in dieser E-Mail wird Ihr Konto endgültig gelöscht. Bestellhistorie wird aus gesetzlichen Gründen
            anonymisiert aufbewahrt.
          </p>
          {deleteMessage && (
            <p className="mt-4 text-sm text-[#2D5A2D]">{deleteMessage}</p>
          )}
          {deleteError && (
            <p className="mt-4 text-sm text-red-600">{deleteError}</p>
          )}
          <Button
            variant="outline"
            onClick={handleDeleteRequest}
            disabled={deleteLoading}
            className="mt-6 gap-2 border-[#E5E5E5] text-[#6B6B6B] hover:bg-red-50 hover:border-red-200 hover:text-red-700"
          >
            {deleteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Konto löschen
          </Button>
        </section>

        <p className="mt-12 text-center text-sm text-[#8A8A8A]">
          <Link href="/account" className="text-[#2D5A2D] hover:underline">
            Zurück zum Konto
          </Link>
        </p>
      </div>
    </div>
  )
}
