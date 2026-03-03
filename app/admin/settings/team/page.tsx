'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { UserCog, Users, ArrowLeft, Loader2, Save, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface StaffRow {
  id: string
  email: string
  roles: string[]
  is_active: boolean
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Inhaber',
  chef: 'Chef / Geschäftsführung',
  admin: 'Shop-Administrator',
  hr: 'Personal / Einstellung',
  product_care: 'Produktpflege',
  team_leader: 'Teamleiter',
  support: 'Kundenservice',
  warehouse_lead: 'Lagerleitung',
  employee: 'Lager / Versand',
  marketing: 'Marketing',
}

const ROLE_ORDER = ['owner', 'chef', 'admin', 'hr', 'product_care', 'team_leader', 'support', 'warehouse_lead', 'employee', 'marketing'] as const

export default function AdminSettingsTeamPage() {
  const [list, setList] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [roleEdits, setRoleEdits] = useState<Record<string, string[]>>({})
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/staff')
      if (!res.ok) {
        if (res.status === 403) {
          toast({ title: 'Keine Berechtigung', description: 'Nur Inhaber können das Team verwalten.', variant: 'destructive' })
          return
        }
        return
      }
      const data = await res.json()
      const staffList = (Array.isArray(data) ? data : []).map((s: StaffRow) => ({
        ...s,
        roles: Array.isArray(s.roles) ? s.roles : (s as any).role ? [(s as any).role] : ['support'],
      }))
      setList(staffList)
      const edits: Record<string, string[]> = {}
      staffList.forEach((s: StaffRow) => { edits[s.id] = [...(s.roles || [])] })
      setRoleEdits(edits)
    } catch {
      toast({ title: 'Fehler', description: 'Team konnte nicht geladen werden.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const toggleRole = (staffId: string, role: string) => {
    setRoleEdits((prev) => {
      const current = prev[staffId] ?? []
      const next = current.includes(role) ? current.filter((r) => r !== role) : [...current, role]
      if (next.length === 0) return prev
      return { ...prev, [staffId]: next }
    })
  }

  const saveRoles = async (staffId: string) => {
    const roles = roleEdits[staffId]
    if (!roles || roles.length === 0) {
      toast({ title: 'Mindestens eine Rolle', variant: 'destructive' })
      return
    }
    setSavingId(staffId)
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Speichern fehlgeschlagen', variant: 'destructive' })
        return
      }
      setList((prev) => prev.map((s) => (s.id === staffId ? { ...s, roles } : s)))
      toast({ title: 'Rollen gespeichert' })
    } catch {
      toast({ title: 'Fehler', description: 'Speichern fehlgeschlagen', variant: 'destructive' })
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="admin-area min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/80" />
      </div>
    )
  }

  return (
    <div className="admin-area max-w-4xl">
      <Link
        href="/admin/settings"
        className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Einstellungen
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Users className="w-7 h-7 text-luxe-gold" />
          Team & Rollen
        </h1>
        <p className="text-sm text-white/80 mt-1">
          Alle Mitarbeiter-Accounts und deren Rollen. Rollen bestimmen den Zugriff auf Finanzen, Einstellungen, Lager und Bestellungen. Änderungen sofort speichern.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray shadow-sm">
        <CardHeader className="border-b border-luxe-gray">
          <CardTitle className="text-white text-lg flex items-center">
            <UserCog className="w-5 h-5 mr-2 text-luxe-gold" />
            Mitarbeiter & Rollen
          </CardTitle>
          <p className="text-sm text-white/80 font-normal">
            Nur Inhaber können diese Seite sehen. Ausführliche Verwaltung (Einladen, Pausieren, Löschen) unter{' '}
            <Link href="/admin/staff" className="text-luxe-gold underline hover:no-underline">Mitarbeiter (Stammdaten)</Link>.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {list.length === 0 ? (
            <div className="py-12 text-center text-white/80">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine Mitarbeiter angelegt.</p>
              <Link href="/admin/staff" className="text-luxe-gold underline mt-2 inline-block">Mitarbeiter einladen</Link>
            </div>
          ) : (
            <ul className="divide-y divide-luxe-gray">
              {list.map((s) => (
                <li key={s.id} className="p-4 flex flex-wrap items-center gap-4 hover:bg-luxe-gray/20">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-luxe-gray flex items-center justify-center text-luxe-gold">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{s.email}</p>
                      <p className="text-xs text-white/70">
                        {s.is_active ? 'Aktiv' : 'Inaktiv'} · angelegt {new Date(s.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {ROLE_ORDER.map((role) => (
                      <label
                        key={role}
                        className="inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={(roleEdits[s.id] ?? s.roles).includes(role)}
                          onChange={() => toggleRole(s.id, role)}
                          className="rounded border-luxe-gray text-luxe-gold focus:ring-luxe-gold bg-luxe-charcoal"
                        />
                        <span className="text-sm text-white font-medium">{ROLE_LABELS[role]}</span>
                      </label>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="bg-[var(--luxe-primary)] text-white hover:opacity-90 border-0"
                    disabled={savingId === s.id}
                    onClick={() => saveRoles(s.id)}
                  >
                    {savingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Speichern
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 space-y-4">
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white text-lg">Rollen & Bereiche im Überblick</CardTitle>
            <p className="text-sm text-white/80 font-normal">
              Welche Rolle darf was? Bereiche (Bestellungen, Produkte, Team, Lager, Marketing) werden den Rollen zugeordnet. Vorgesetzte und Teamleiter werden unter „Mitarbeiter (Stammdaten)“ pro Person hinterlegt.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-3 text-sm">
              <li><strong className="text-white">Inhaber</strong> · Vollzugriff: Finanzen, Einstellungen, Team, Verträge. Einziger Zugriff auf Finanz-Parameter und Einstellungen.</li>
              <li><strong className="text-white">Chef / Geschäftsführung</strong> · Wie Admin, zusätzlich Mitarbeiter einladen und verwalten (Inhaber-Konto nicht änderbar). Lager, Bestellungen, Produkte, Marketing.</li>
              <li><strong className="text-white">Shop-Administrator</strong> · Bestellungen, Produkte, Einkauf, Rabattcodes, Kundenservice. Kein Zugriff auf Mitarbeiter-Verwaltung und Finanzen.</li>
              <li><strong className="text-white">Personal / Einstellung (HR)</strong> · Mitarbeiter einladen, anlegen und Rollen zuweisen. Darf keine Rollen Inhaber oder Chef vergeben; Inhaber-Konto nicht änderbar. Bereich: Team.</li>
              <li><strong className="text-white">Produktpflege</strong> · Produkte, Kategorien, Influencer, Startseite, Bewertungen. Bereich: Produkte.</li>
              <li><strong className="text-white">Teamleiter</strong> · Für einen Bereich zuständig (z. B. Bestellungen oder Support). Bestellungen und Kundenservice. Vorgesetzte/r wird unter „Mitarbeiter“ bei der Person hinterlegt. Bereich: z. B. Bestellungen.</li>
              <li><strong className="text-white">Kundenservice</strong> · Kundenanfragen, Bestellungen einsehen und bearbeiten. Bereich: Bestellungen/Support.</li>
              <li><strong className="text-white">Lagerleitung</strong> · Lager, Bestände, Wareneingang, Bestellungen, Versand. Bereich: Lager.</li>
              <li><strong className="text-white">Lager / Versand (Mitarbeiter)</strong> · Bestellungen bearbeiten, Versand. Unterstellt typischerweise Kundenservice oder Teamleiter.</li>
              <li><strong className="text-white">Marketing</strong> · Nur Marketing: Rabattcodes, Newsletter, Werbung, A+ Inhalt. Bereich: Marketing.</li>
            </ul>
          </CardContent>
        </Card>
        <p className="text-xs text-white/70">
          Ausführliche Verwaltung (Einladen, Pausieren, Vorgesetzte/r, Teamleiter für Bereich, Verträge) unter{' '}
          <Link href="/admin/staff" className="text-luxe-gold underline hover:no-underline">Team & Finanzen → Mitarbeiter</Link>.
        </p>
      </div>
    </div>
  )
}
