'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import type { CheckItem } from '@/app/api/admin/compliance/check/route'

const STATIC_CHECKLIST: { id: string; label: string; category: string }[] = [
  { id: 'alt', label: 'Alle Bilder haben Alt-Texte', category: 'Barrierefreiheit' },
  { id: 'ssl', label: 'SSL/TLS ist aktiv (HTTPS)', category: 'Sicherheit' },
  { id: 'prices', label: 'Preise werden serverseitig validiert', category: 'Recht' },
  { id: 'audit', label: 'Audit-Log (GoBD) aktiv', category: 'Recht' },
  { id: 'rbac', label: 'RBAC / Rollen getrennt', category: 'Sicherheit' },
  { id: 'ddg', label: 'Impressum & Datenschutz DDG-konform', category: 'Recht' },
  { id: 'widerruf', label: 'Widerrufsbutton im UI (Pflicht ab 19.06.2026)', category: 'Recht' },
  { id: 'pangv', label: 'PAngV Referenzpreis (30 Tage)', category: 'Recht' },
  { id: 'focus', label: 'Fokus-Reihenfolge & Tastaturbedienung', category: 'Barrierefreiheit' },
]

export default function AdminCompliancePage() {
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [checkResults, setCheckResults] = useState<CheckItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingReport, setLoadingReport] = useState(true)

  useEffect(() => {
    fetch('/api/admin/compliance/check')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.lastChecked) setLastChecked(data.lastChecked)
      })
      .finally(() => setLoadingReport(false))
  }, [])

  const runCheck = async () => {
    setLoading(true)
    setCheckResults(null)
    try {
      const res = await fetch('/api/admin/compliance/check', { method: 'POST' })
      const data = await res.json()
      if (data?.lastChecked) setLastChecked(data.lastChecked)
      if (Array.isArray(data?.checks)) setCheckResults(data.checks)
    } finally {
      setLoading(false)
    }
  }

  const lastCheckedLabel = lastChecked
    ? new Date(lastChecked).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Noch nicht durchgeführt'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Compliance-Zentrum</h1>
        <p className="mt-1 text-luxe-silver">Schaltzentrale für Transparenz & Integrität (nur Inhaber).</p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-luxe-primary" />
            Integritäts-Check
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Prüft Datenbank und Einstellungen und aktualisiert das Datum der letzten Prüfung auf der öffentlichen Zertifikats-Seite.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-luxe-silver">
            <strong className="text-white">Letzte Prüfung:</strong> {lastCheckedLabel}
          </p>
          <Button
            onClick={runCheck}
            disabled={loading}
            variant="luxe"
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Integritäts-Check ausführen
          </Button>
          {checkResults && (
            <ul className="mt-4 space-y-2 border-t border-luxe-gray pt-4">
              {checkResults.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-sm">
                  {item.ok ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                  )}
                  <span className={item.ok ? 'text-luxe-silver' : 'text-red-300'}>{item.label}</span>
                  {item.hint && <span className="text-luxe-silver/70">({item.hint})</span>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Technische Anforderungen (Checkliste)</CardTitle>
          <p className="text-sm text-luxe-silver">
            Diese Punkte sollten erfüllt sein; der Integritäts-Check prüft einen Teil automatisch.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {STATIC_CHECKLIST.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm text-luxe-silver">
                <span className="h-px w-4 shrink-0 bg-luxe-primary/50" />
                <span className="text-white/90">{item.label}</span>
                <span className="text-luxe-silver/60 text-xs">({item.category})</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="pt-6">
          <Link
            href="/compliance"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-luxe-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Öffentliche Zertifikats-Seite ansehen
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
