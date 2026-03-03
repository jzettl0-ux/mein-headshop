'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Trash2,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

type DeletionRequest = {
  id: string
  user_id: string
  expires_at: string
  created_at: string
  confirmed_at: string | null
  email: string
}

type LookupResult = {
  email: string
  userId: string | null
  orderCount: number
  inquiryCount: number
  hasAccount: boolean
}

export default function AdminDatenschutzPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<DeletionRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [lookup, setLookup] = useState<LookupResult | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const loadRequests = () => {
    setLoadingRequests(true)
    fetch('/api/admin/gdpr/deletion-requests')
      .then((r) => (r.ok ? r.json() : { requests: [] }))
      .then((data) => setRequests(data.requests ?? []))
      .finally(() => setLoadingRequests(false))
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleLookup = async (emailOverride?: string) => {
    const email = String(emailOverride ?? searchEmail ?? '').trim().toLowerCase()
    if (!email) {
      toast({ title: 'E-Mail eingeben', variant: 'destructive' })
      return
    }
    setLookingUp(true)
    setLookup(null)
    try {
      const res = await fetch(`/api/admin/gdpr/lookup?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Suche fehlgeschlagen')
      setLookup(data)
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message, variant: 'destructive' })
    } finally {
      setLookingUp(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== 'LÖSCHEN BESTÄTIGEN') {
      toast({
        title: 'Bitte exakt eingeben: LÖSCHEN BESTÄTIGEN',
        variant: 'destructive',
      })
      return
    }
    const email = String(searchEmail ?? '').trim().toLowerCase()
    if (!email) return
    setDeleting(true)
    try {
      const res = await fetch('/api/admin/gdpr/delete-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userId: lookup?.userId ?? undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Löschung fehlgeschlagen')
      toast({
        title: 'Erfolgreich gelöscht',
        description: `${data.anonymizedOrders} Bestellungen, ${data.anonymizedInquiries} Anfragen anonymisiert.`,
      })
      setLookup(null)
      setSearchEmail('')
      setConfirmDelete(false)
      setDeleteConfirmText('')
      loadRequests()
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message, variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-luxe-gold" />
          DSGVO – Kundendaten löschen
        </h1>
        <p className="mt-1 text-luxe-silver">
          Art. 17 DSGVO: Löschanträge verwalten und Kundendaten DSGVO-konform anonymisieren. Finanzamt-Daten (Bestellsummen, Artikel) werden 10 Jahre aufbewahrt.
        </p>
      </div>

      {/* Ausstehende Löschanträge */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white text-lg">Ausstehende Löschanträge</CardTitle>
          <p className="text-sm text-luxe-silver">
            Kunden haben die Löschung angefragt und warten auf den Bestätigungslink per E-Mail.
          </p>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="flex items-center gap-2 text-luxe-silver">
              <Loader2 className="h-4 w-4 animate-spin" />
              Lade…
            </div>
          ) : requests.length === 0 ? (
            <p className="text-luxe-silver">Keine ausstehenden Anträge.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-luxe-gray bg-luxe-black/50 p-3"
                >
                  <div>
                    <p className="font-medium text-white">{r.email}</p>
                    <p className="text-xs text-luxe-silver">
                      Antrag: {new Date(r.created_at).toLocaleString('de-DE')} · Link läuft ab:{' '}
                      {new Date(r.expires_at).toLocaleString('de-DE')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-luxe-gray"
                    onClick={() => {
                      setSearchEmail(r.email)
                      handleLookup(r.email)
                    }}
                  >
                    Suchen & manuell löschen
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manuelle Löschung */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Kunde suchen und löschen
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Per E-Mail suchen, Treffer prüfen und bei Bedarf die Löschung ausführen (z. B. bei schriftlicher Anfrage).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="gdpr-email" className="text-luxe-silver text-sm">
                E-Mail-Adresse
              </Label>
              <Input
                id="gdpr-email"
                type="email"
                placeholder="kunde@beispiel.de"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                className="mt-1 bg-luxe-black border-luxe-gray text-white"
              />
            </div>
            <div className="pt-6">
              <Button
                onClick={() => handleLookup()}
                disabled={lookingUp}
                variant="luxe"
                className="gap-2"
              >
                {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Suchen
              </Button>
            </div>
          </div>

          {lookup && (
            <div className="rounded-lg border border-luxe-gray bg-luxe-black/50 p-4 space-y-3">
              <p className="font-medium text-white">{lookup.email}</p>
              <ul className="text-sm text-luxe-silver space-y-1">
                <li>• Konto: {lookup.hasAccount ? 'Ja' : 'Nein (nur Gast-Bestellungen/Anfragen)'}</li>
                <li>• Bestellungen: {lookup.orderCount}</li>
                <li>• Kontaktanfragen: {lookup.inquiryCount}</li>
              </ul>
              {!confirmDelete ? (
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Löschung durchführen
                </Button>
              ) : (
                <div className="space-y-3 p-3 rounded-lg border border-red-500/50 bg-red-500/10">
                  <div className="flex items-start gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold">Unwiderruflich</p>
                      <p>
                        Bestellungen werden anonymisiert (Finanzamt-Daten bleiben), Konto, Adressen und personenbezogene Daten werden gelöscht.
                      </p>
                    </div>
                  </div>
                  <Label className="text-luxe-silver text-sm">
                    Zur Bestätigung tippe: <strong className="text-white">LÖSCHEN BESTÄTIGEN</strong>
                  </Label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="LÖSCHEN BESTÄTIGEN"
                    className="bg-luxe-black border-red-500/50 text-white"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting || deleteConfirmText !== 'LÖSCHEN BESTÄTIGEN'}
                      className="gap-2"
                    >
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Endgültig löschen
                    </Button>
                    <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                      Abbrechen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Infobox */}
      <Card className="bg-luxe-gold/5 border-luxe-gold/30">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-luxe-gold" />
            Ablauf DSGVO-Löschung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-luxe-silver">
          <p>
            <strong className="text-white">1. Selbst-Service (Kunde):</strong> Nutzer fordert unter{' '}
            <Link href="/profile/privacy" className="text-luxe-gold hover:underline" target="_blank">
              Datenschutz & Transparenz
            </Link>{' '}
            die Löschung an und erhält einen Bestätigungslink per E-Mail. Erst nach Klick wird gelöscht.
          </p>
          <p>
            <strong className="text-white">2. Anonymisierung (nicht Löschung):</strong> Bestellungen, Rechnungen und Artikelpositionen
            werden für die gesetzliche Aufbewahrungspflicht (§ 147 AO, § 257 HGB) 10 Jahre behalten – aber <strong className="text-white">anonymisiert</strong>:
            Name, E-Mail, Adresse werden entfernt.
          </p>
          <p>
            <strong className="text-white">3. Vollständig gelöscht:</strong> Konto, gespeicherte Adressen, Treuepunkte,
            Bewertungsnamen und Kontaktanfragen.
          </p>
          <div className="flex items-start gap-2 pt-2">
            <FileText className="h-4 w-4 text-luxe-gold shrink-0 mt-0.5" />
            <p>
              Dokumentation: <code className="text-luxe-gold">docs/DSGVO-DDG-CHECKLISTE.md</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
