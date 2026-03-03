'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User, Mail, Shield, HeadphonesIcon, HelpCircle, ArrowRight, Network, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ContactPerson = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  label: string
  role_hint?: string
}

type StaffNode = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  label: string
  role_hint: string
  reports_to_id: string | null
}

type ProfileData = {
  staff: {
    id: string
    email: string
    roles: string[]
    role_labels: string[]
    reports_to_id: string | null
    lead_for_area_id: string | null
  } | null
  contact: ContactPerson | null
  fallback_contact: ContactPerson | null
  org_tree: {
    above: StaffNode[]
    me: StaffNode
    below: StaffNode[]
  } | null
  message?: string
}

export default function AdminMeProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/me/profile')
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? 'Nicht angemeldet' : 'Profil konnte nicht geladen werden')
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Mein Profil</h1>
        <p className="text-luxe-silver">Lade Profil …</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Mein Profil</h1>
        <p className="text-luxe-silver">{error ?? 'Profil nicht verfügbar.'}</p>
      </div>
    )
  }

  const contact = data.contact ?? data.fallback_contact

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Mein Profil</h1>
        <p className="text-luxe-silver mt-1">Deine Rollen und dein Ansprechpartner bei Fragen oder Problemen</p>
      </div>

      {/* Deine Rolle(n) */}
      {data.staff && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Deine Rollen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-luxe-silver text-sm">
              Du bist eingeloggt als <span className="text-white font-medium">{data.staff.email}</span>.
            </p>
            <div className="flex flex-wrap gap-2">
              {data.staff.role_labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-md bg-luxe-gold/20 px-2.5 py-1 text-sm font-medium text-luxe-gold border border-luxe-gold/40"
                >
                  {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ansprechpartner / Bei Problemen */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5" />
            Ansprechpartner & bei Problemen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.message && (
            <p className="text-luxe-silver text-sm">{data.message}</p>
          )}

          {contact ? (
            <>
              <p className="text-luxe-silver text-sm">
                Bei Fragen zu deiner Arbeit, zu Berechtigungen oder bei Problemen wende dich an deinen Ansprechpartner. Diese Person ist für dich zuständig und kann dir weiterhelfen.
              </p>
              <div className="rounded-lg border border-luxe-gray bg-luxe-black/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-luxe-gold/20 text-luxe-gold">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{contact.label}</p>
                    {contact.role_hint && (
                      <p className="text-sm text-luxe-silver">{contact.role_hint}</p>
                    )}
                    <a
                      href={`mailto:${contact.email}`}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm text-luxe-gold hover:underline"
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      {contact.email}
                    </a>
                  </div>
                  <ArrowRight className="w-5 h-5 shrink-0 text-luxe-silver" aria-hidden />
                </div>
              </div>
              {!data.contact && data.fallback_contact && (
                <p className="text-xs text-luxe-silver">
                  Dir ist noch kein fester Vorgesetzter zugewiesen. Bis dahin ist die Geschäftsführung (siehe oben) dein Ansprechpartner. Der Inhaber oder Chef kann in der Mitarbeiterverwaltung einen Ansprechpartner für dich hinterlegen.
                </p>
              )}
              <Link href="/admin/messages" className="mt-3 inline-flex items-center gap-2 rounded-md bg-luxe-gold/20 px-3 py-2 text-sm font-medium text-luxe-gold border border-luxe-gold/40 hover:bg-luxe-gold/30">
                <MessageSquare className="w-4 h-4" /> Internen Chat mit Ansprechpartner öffnen
              </Link>
            </>
          ) : (
            <>
              <p className="text-luxe-silver text-sm">
                Dir ist aktuell kein Ansprechpartner zugewiesen. Bei Fragen oder Problemen wende dich an die Geschäftsführung (Inhaber oder Chef).
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                <HelpCircle className="w-5 h-5 shrink-0 text-amber-500" />
                <p className="text-sm text-white">
                  Die Geschäftsführung kann unter „Team & Finanzen → Mitarbeiter“ bei deinem Profil einen Vorgesetzten bzw. Ansprechpartner hinterlegen. Bis dahin bei betrieblichen Fragen den Inhaber oder Chef ansprechen.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stammbaum: Deine Stelle im Team */}
      {data.org_tree && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Network className="w-5 h-5" />
              Deine Stelle im Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-luxe-silver text-sm mb-4">
              So ist die Hierarchie um dich herum: Wer steht über dir, und wer berichtet direkt an dich?
            </p>
            <div className="space-y-0">
              {/* Über mir (von oben nach unten: Spitze → direkt über mir) */}
              {[...data.org_tree.above].reverse().map((node, i) => (
                <div key={node.id} className="flex items-center gap-3 py-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-luxe-gray/50 text-luxe-silver text-xs">
                    {data.org_tree!.above.length - i}
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-luxe-gray bg-luxe-black/40 px-3 py-2">
                    <p className="font-medium text-white">{node.label}</p>
                    <p className="text-xs text-luxe-silver">{node.role_hint} · {node.email}</p>
                  </div>
                </div>
              ))}
              {/* Ich */}
              <div className="flex items-center gap-3 py-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-luxe-gold/30 text-luxe-gold font-semibold text-sm">
                  Du
                </div>
                <div className="min-w-0 flex-1 rounded-lg border-2 border-luxe-gold bg-luxe-gold/10 px-3 py-2">
                  <p className="font-medium text-white">{data.org_tree.me.label}</p>
                  <p className="text-xs text-luxe-silver">{data.org_tree.me.role_hint} · {data.org_tree.me.email}</p>
                </div>
              </div>
              {/* Unter mir */}
              {data.org_tree.below.map((node) => (
                <div key={node.id} className="flex items-center gap-3 py-2 pl-12">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-luxe-gray/50 text-luxe-silver text-xs">
                    ↓
                  </div>
                  <div className="min-w-0 flex-1 rounded-lg border border-luxe-gray bg-luxe-black/40 px-3 py-2">
                    <p className="font-medium text-white">{node.label}</p>
                    <p className="text-xs text-luxe-silver">{node.role_hint} · {node.email}</p>
                  </div>
                  <Link
                    href={`/admin/messages?with=${node.id}`}
                    className="shrink-0 rounded p-1.5 text-luxe-silver hover:bg-luxe-gold/20 hover:text-luxe-gold"
                    title="Nachricht senden"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                </div>
              ))}
              {data.org_tree.below.length === 0 && (
                <p className="text-xs text-luxe-silver pl-12 pt-1">Dir ist niemand direkt zugeordnet.</p>
              )}
            </div>
            <Link
              href="/admin/messages"
              className="mt-4 inline-flex items-center gap-2 text-sm text-luxe-gold hover:underline"
            >
              <MessageSquare className="w-4 h-4" />
              Internen Chat mit allen Mitarbeitern
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
