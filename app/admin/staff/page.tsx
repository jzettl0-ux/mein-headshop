'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserCog, Mail, UserPlus, Shield, ShieldCheck, HeadphonesIcon, Package, User, KeyRound, Send, Pencil, Ban, RotateCcw, FileText, Upload, Download, Trash2, TicketPercent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface StaffRow {
  id: string
  email: string
  role?: string
  roles: string[]
  is_active: boolean
  user_id: string | null
  created_at: string
  terminated_at?: string | null
  first_name?: string | null
  last_name?: string | null
  date_of_birth?: string | null
  place_of_birth?: string | null
  country_of_birth?: string | null
  nationality?: string | null
  address_street?: string | null
  address_postal_code?: string | null
  address_city?: string | null
  tax_id?: string | null
  social_insurance_number?: string | null
  health_insurance?: string | null
  phone?: string | null
  notes?: string | null
  contract_ends_at?: string | null
  is_owner_account?: boolean
  reports_to_id?: string | null
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Inhaber',
  chef: 'Chef / Geschäftsführung',
  admin: 'Shop-Administrator',
  product_care: 'Produktpflege',
  support: 'Kundenservice',
  employee: 'Lager / Versand',
  hr: 'Personal / Einstellung',
  team_leader: 'Teamleiter',
  warehouse_lead: 'Lagerleitung',
  marketing: 'Marketing',
}

const ROLE_ICONS: Record<string, typeof Shield> = {
  owner: ShieldCheck,
  chef: ShieldCheck,
  admin: Shield,
  product_care: Package,
  support: HeadphonesIcon,
  employee: User,
  hr: UserPlus,
  team_leader: ShieldCheck,
  warehouse_lead: Package,
  marketing: TicketPercent,
}

const ROLE_OPTIONS = [
  { value: 'employee', label: 'Lager / Versand' },
  { value: 'support', label: 'Kundenservice' },
  { value: 'product_care', label: 'Produktpflege' },
  { value: 'admin', label: 'Shop-Administrator' },
  { value: 'hr', label: 'Personal / Einstellung' },
  { value: 'team_leader', label: 'Teamleiter' },
  { value: 'warehouse_lead', label: 'Lagerleitung' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'chef', label: 'Chef / Geschäftsführung' },
  { value: 'owner', label: 'Inhaber' },
] as const

export default function AdminStaffPage() {
  const [list, setList] = useState<StaffRow[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRoles, setInviteRoles] = useState<string[]>(['support'])
  const [inviting, setInviting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [resettingEmail, setResettingEmail] = useState<string | null>(null)
  const [welcomeEmailSending, setWelcomeEmailSending] = useState<string | null>(null)
  const [profileModalStaff, setProfileModalStaff] = useState<StaffRow | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const [staffDocuments, setStaffDocuments] = useState<{ id: string; document_type: string; file_name: string | null; file_size: number | null; created_at: string }[]>([])
  const [staffDocumentsLoading, setStaffDocumentsLoading] = useState(false)
  const [documentUploadType, setDocumentUploadType] = useState<string>('signed_contract')
  const [documentUploadFile, setDocumentUploadFile] = useState<File | null>(null)
  const [documentUploading, setDocumentUploading] = useState(false)
  const [documentDeletingId, setDocumentDeletingId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const DOC_TYPE_LABELS: Record<string, string> = {
    signed_contract: 'Unterschriebener Vertrag',
    id_document: 'Ausweisdokument',
    other: 'Sonstiges',
  }

  const loadStaffDocuments = async (staffId: string) => {
    setStaffDocumentsLoading(true)
    try {
      const res = await fetch(`/api/admin/staff/${staffId}/documents`)
      if (!res.ok) return setStaffDocuments([])
      const data = await res.json()
      setStaffDocuments(Array.isArray(data) ? data : [])
    } catch {
      setStaffDocuments([])
    } finally {
      setStaffDocumentsLoading(false)
    }
  }

  const profileFormDefaults = (s: StaffRow | null) => ({
    first_name: s?.first_name ?? '',
    last_name: s?.last_name ?? '',
    date_of_birth: s?.date_of_birth ?? '',
    place_of_birth: s?.place_of_birth ?? '',
    country_of_birth: s?.country_of_birth ?? '',
    nationality: s?.nationality ?? '',
    address_street: s?.address_street ?? '',
    address_postal_code: s?.address_postal_code ?? '',
    address_city: s?.address_city ?? '',
    tax_id: s?.tax_id ?? '',
    social_insurance_number: s?.social_insurance_number ?? '',
    health_insurance: s?.health_insurance ?? '',
    phone: s?.phone ?? '',
    notes: s?.notes ?? '',
    contract_ends_at: s?.contract_ends_at ?? '',
    reports_to_id: s?.reports_to_id ?? '',
  })
  const [profileForm, setProfileForm] = useState(profileFormDefaults(null))

  const load = async () => {
    setLoading(true)
    try {
      const [staffRes, meRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/admin/me'),
      ])
      if (meRes.ok) {
        const meData = await meRes.json()
        setIsOwner(!!meData.isOwner)
      }
      if (!staffRes.ok) {
        if (staffRes.status === 403) {
          toast({ title: 'Keine Berechtigung', description: 'Nur Inhaber oder Chef können Mitarbeiter verwalten.', variant: 'destructive' })
          setLoading(false)
          router.push('/admin')
          return
        }
        return
      }
      const data = await staffRes.json()
      setList(
        data.map((s: StaffRow) => ({
          ...s,
          roles: Array.isArray(s.roles) ? s.roles : s.role ? [s.role] : ['support'],
        }))
      )
    } catch {
      toast({ title: 'Fehler', description: 'Mitarbeiter konnten nicht geladen werden.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (profileModalStaff) {
      setProfileForm(profileFormDefaults(profileModalStaff))
      loadStaffDocuments(profileModalStaff.id)
    } else {
      setStaffDocuments([])
    }
  }, [profileModalStaff])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = inviteEmail.trim().toLowerCase()
    if (!email) {
      toast({ title: 'E-Mail eintragen', variant: 'destructive' })
      return
    }
    setInviting(true)
    try {
      if (!inviteRoles.length) {
        toast({ title: 'Mindestens eine Rolle wählen', variant: 'destructive' })
        return
      }
      const res = await fetch('/api/admin/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, roles: inviteRoles }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Einladung fehlgeschlagen', variant: 'destructive' })
        if (data.code === 'TERMINATED') toast({ title: 'Hinweis', description: 'Zum Wiedereinstellen in der Liste die Person suchen und „Wiedereinstellen“ wählen.', variant: 'default' })
        return
      }
      toast({ title: 'Mitarbeiter angelegt', description: data.message || 'Einladung wurde gesendet.' })
      setInviteEmail('')
      setInviteRoles(['support'])
      load()
    } catch {
      toast({ title: 'Fehler', description: 'Einladung fehlgeschlagen', variant: 'destructive' })
    } finally {
      setInviting(false)
    }
  }

  const handleUpdate = async (id: string, patch: { roles?: string[]; is_active?: boolean; terminated_at?: string | null; contract_ends_at?: string | null; first_name?: string | null; last_name?: string | null; date_of_birth?: string | null; place_of_birth?: string | null; country_of_birth?: string | null; nationality?: string | null; address_street?: string | null; address_postal_code?: string | null; address_city?: string | null; tax_id?: string | null; social_insurance_number?: string | null; health_insurance?: string | null; phone?: string | null; notes?: string | null }) => {
    setUpdatingId(id)
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Änderung fehlgeschlagen')
      }
      toast({ title: 'Aktualisiert' })
      load()
      if (profileModalStaff?.id === id) setProfileModalStaff((prev) => (prev ? { ...prev, ...patch } : null))
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message, variant: 'destructive' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDocumentUpload = async () => {
    if (!profileModalStaff || !documentUploadFile) {
      toast({ title: 'Datei wählen', variant: 'destructive' })
      return
    }
    setDocumentUploading(true)
    try {
      const form = new FormData()
      form.append('document_type', documentUploadType)
      form.append('file', documentUploadFile)
      const res = await fetch(`/api/admin/staff/${profileModalStaff.id}/documents`, {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Upload fehlgeschlagen')
      }
      toast({ title: 'Dokument hinzugefügt' })
      setDocumentUploadFile(null)
      loadStaffDocuments(profileModalStaff.id)
    } catch (e: unknown) {
      toast({ title: 'Fehler', description: e instanceof Error ? e.message : 'Upload fehlgeschlagen', variant: 'destructive' })
    } finally {
      setDocumentUploading(false)
    }
  }

  const handleDocumentDownload = async (docId: string) => {
    if (!profileModalStaff) return
    try {
      const res = await fetch(`/api/admin/staff/${profileModalStaff.id}/documents/${docId}/download`)
      if (!res.ok) throw new Error('Download fehlgeschlagen')
      const data = await res.json()
      if (data?.url) window.open(data.url, '_blank')
    } catch {
      toast({ title: 'Fehler', description: 'Download-Link konnte nicht erstellt werden.', variant: 'destructive' })
    }
  }

  const handleDocumentDelete = async (docId: string) => {
    if (!profileModalStaff || !confirm('Dokument wirklich löschen?')) return
    setDocumentDeletingId(docId)
    try {
      const res = await fetch(`/api/admin/staff/${profileModalStaff.id}/documents/${docId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Löschen fehlgeschlagen')
      toast({ title: 'Dokument gelöscht' })
      loadStaffDocuments(profileModalStaff.id)
    } catch {
      toast({ title: 'Fehler', description: 'Dokument konnte nicht gelöscht werden.', variant: 'destructive' })
    } finally {
      setDocumentDeletingId(null)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileModalStaff) return
    setProfileSaving(true)
    try {
      const patch = {
        first_name: profileForm.first_name || null,
        last_name: profileForm.last_name || null,
        date_of_birth: profileForm.date_of_birth || null,
        place_of_birth: profileForm.place_of_birth || null,
        country_of_birth: profileForm.country_of_birth || null,
        nationality: profileForm.nationality || null,
        address_street: profileForm.address_street || null,
        address_postal_code: profileForm.address_postal_code || null,
        address_city: profileForm.address_city || null,
        tax_id: profileForm.tax_id || null,
        social_insurance_number: profileForm.social_insurance_number || null,
        health_insurance: profileForm.health_insurance || null,
        phone: profileForm.phone || null,
        notes: profileForm.notes || null,
        contract_ends_at: profileForm.contract_ends_at || null,
        reports_to_id: profileForm.reports_to_id || null,
      }
      await handleUpdate(profileModalStaff.id, patch)
      setProfileModalStaff(null)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleTerminate = async (s: StaffRow) => {
    if (!confirm(`${s.email} wirklich kündigen? Der Zugang wird deaktiviert; du kannst später „Wiedereinstellen“ wählen.`)) return
    await handleUpdate(s.id, { terminated_at: new Date().toISOString() })
  }

  const handleReinstate = async (s: StaffRow) => {
    await handleUpdate(s.id, { terminated_at: null })
    toast({ title: 'Wiedereingestellt', description: 'Account ist wieder aktiv. Du kannst ggf. erneut eine Willkommens-Mail senden.' })
  }

  const handleSendPasswordReset = async (email: string) => {
    setResettingEmail(email)
    try {
      const res = await fetch('/api/admin/staff/send-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Reset-Link konnte nicht gesendet werden.', variant: 'destructive' })
        return
      }
      toast({ title: 'E-Mail gesendet', description: data.message || `An ${email} wurde der Passwort-Reset-Link gesendet.` })
    } catch {
      toast({ title: 'Fehler', description: 'Reset-Link konnte nicht gesendet werden.', variant: 'destructive' })
    } finally {
      setResettingEmail(null)
    }
  }

  const handleSendWelcomeEmail = async (staffId: string, email: string, asReinvite: boolean) => {
    setWelcomeEmailSending(email)
    try {
      const res = await fetch('/api/admin/staff/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: staffId, isReinvite: asReinvite }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Fehler', description: data.error || 'Willkommens-Mail konnte nicht gesendet werden.', variant: 'destructive' })
        return
      }
      toast({ title: 'E-Mail gesendet', description: data.message })
    } catch {
      toast({ title: 'Fehler', description: 'Willkommens-Mail konnte nicht gesendet werden.', variant: 'destructive' })
    } finally {
      setWelcomeEmailSending(null)
    }
  }

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Account von ${email} wirklich endgültig löschen? Der Nutzer verliert den Zugang und der Auth-Account wird entfernt.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Löschen fehlgeschlagen')
      }
      toast({ title: 'Account gelöscht', description: 'Zugang wurde entzogen.' })
      load()
    } catch (e: any) {
      toast({ title: 'Fehler', description: e?.message, variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (s: string) => new Date(s).toLocaleDateString('de-DE')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center">
          <UserCog className="w-7 h-7 mr-2 text-luxe-gold" />
          Mitarbeiter & Berechtigungen
        </h1>
        <p className="text-luxe-silver text-sm mt-1">
          Inhaber, Chef und Personal (HR) können hier Mitarbeiter einstellen, einladen und verwalten. Das <strong>Inhaber-Konto</strong> darf nur vom Inhaber selbst geändert oder gelöscht werden. HR darf keine Rollen Inhaber oder Chef vergeben. Accounts per E-Mail einladen – die Person setzt <strong>selbst ihr Passwort</strong>. Rollen zuweisen, Accounts pausieren oder löschen.
        </p>
        <div className="mt-3 p-3 bg-luxe-gold/10 border border-luxe-gold/30 rounded-lg text-sm text-luxe-silver">
          <strong className="text-luxe-gold">Rollen (mehrere möglich, jederzeit änderbar):</strong> Inhaber = einziger voller Admin. Chef = Stellvertreter, alles außer Einstellungen/Finanzen. Personal (HR) = Mitarbeiter einstellen und anlegen, keine Vergabe von Inhaber/Chef. Admin = Bestellungen, Produkte, Einkauf. Produktpflege = Produkte, Influencer, Startseite. Kundenservice/Lager = Bestellungen + Anfragen. Rollen in der Liste unten anpassen.
        </div>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-luxe-gold" />
            Mitarbeiter einladen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="staff-email" className="text-white">E-Mail</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="mitarbeiter@beispiel.de"
                  className="bg-luxe-gray border-luxe-gray text-white mt-1"
                  disabled={inviting}
                />
              </div>
              <Button type="submit" variant="luxe" disabled={inviting || !inviteRoles.length}>
                {inviting ? '…' : 'Einladen'}
              </Button>
            </div>
            <div>
              <Label className="text-white">Rollen (mind. eine)</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {ROLE_OPTIONS.map((o) => (
                  <label key={o.value} className="flex items-center gap-2 cursor-pointer text-luxe-silver hover:text-white">
                    <input
                      type="checkbox"
                      checked={inviteRoles.includes(o.value)}
                      onChange={(e) => {
                        if (e.target.checked) setInviteRoles((prev) => [...prev, o.value])
                        else setInviteRoles((prev) => prev.filter((r) => r !== o.value))
                      }}
                      className="rounded border-luxe-gray bg-luxe-charcoal text-luxe-gold"
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Mitarbeiter</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-luxe-silver">Laden...</p>
          ) : list.length === 0 ? (
            <p className="text-luxe-silver">Noch keine Mitarbeiter eingetragen.</p>
          ) : (
            <div className="space-y-3">
              {list.map((s) => {
                const rolesList = s.roles?.length ? s.roles : (s.role ? [s.role] : ['support'])
                const isOwnerRowProtected = s.is_owner_account && !isOwner
                return (
                  <div
                    key={s.id}
                    className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg ${s.is_active ? 'bg-luxe-gray/50' : 'bg-luxe-gray/20 opacity-70'}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Mail className="w-4 h-4 text-luxe-gold shrink-0" />
                      <span className="text-white font-medium">{s.email}</span>
                      {(s.first_name || s.last_name) && (
                        <span className="text-luxe-silver text-sm">({[s.first_name, s.last_name].filter(Boolean).join(' ')})</span>
                      )}
                      {rolesList.map((r) => (
                        <Badge key={r} className="bg-luxe-gold/20 text-luxe-gold border-luxe-gold/50">
                          {ROLE_LABELS[r] || r}
                        </Badge>
                      ))}
                      {isOwnerRowProtected && (
                        <Badge variant="outline" className="border-luxe-gold/50 text-luxe-gold bg-luxe-gold/10">
                          Inhaber – keine Änderungen möglich
                        </Badge>
                      )}
                      {!s.is_active && <Badge variant="outline" className="border-red-500/50 text-red-400">Deaktiviert</Badge>}
                      {s.terminated_at && (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                          Gekündigt am {formatDate(s.terminated_at)}
                        </Badge>
                      )}
                      {s.contract_ends_at && !s.terminated_at && (
                        <Badge variant="outline" className="border-luxe-neon/50 text-luxe-neon">
                          Befristet bis {formatDate(s.contract_ends_at)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-luxe-silver">
                      <span>seit {formatDate(s.created_at)}</span>
                      {isOwnerRowProtected ? (
                        <span className="text-luxe-silver italic">Nur der Inhaber kann dieses Konto bearbeiten.</span>
                      ) : s.is_active ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-white/80 shrink-0 font-medium">Rollen:</span>
                            {ROLE_OPTIONS.map((o) => (
                              <label key={o.value} className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rolesList.includes(o.value)}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...rolesList.filter((r) => r !== o.value), o.value]
                                      : rolesList.filter((r) => r !== o.value)
                                    if (next.length < 1) return
                                    handleUpdate(s.id, { roles: next })
                                  }}
                                  disabled={updatingId === s.id}
                                  className="rounded border-luxe-gray bg-luxe-charcoal text-luxe-gold w-3 h-3"
                                />
                                <span className="text-xs text-white/90">{o.label}</span>
                              </label>
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-luxe-silver hover:text-luxe-gold"
                            onClick={() => handleSendPasswordReset(s.email)}
                            disabled={resettingEmail !== null}
                            title="Passwort-Reset-Link an diese E-Mail senden (z. B. wenn Passwort vergessen)"
                          >
                            <KeyRound className="w-4 h-4 mr-1" />
                            {resettingEmail === s.email ? '…' : 'Passwort-Reset senden'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-luxe-silver hover:text-luxe-neon"
                            onClick={() => handleSendWelcomeEmail(s.id, s.email, true)}
                            disabled={welcomeEmailSending !== null}
                            title="Willkommens-Mail mit Kurzanleitung senden (z. B. „Schön, dich wiederzusehen“ oder Anleitung erneut)"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            {welcomeEmailSending === s.email ? '…' : 'Willkommens-Mail senden'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-luxe-silver hover:text-luxe-gold"
                            onClick={() => setProfileModalStaff(s)}
                            disabled={updatingId === s.id}
                            title="Mitarbeiterprofil (Name, Geburtsdatum, Adresse, Steuer, Versicherung)"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Profil
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-luxe-silver hover:text-amber-400"
                            onClick={() => handleUpdate(s.id, { is_active: false })}
                            disabled={updatingId === s.id}
                          >
                            Pausieren
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-luxe-silver hover:text-red-400"
                            onClick={() => handleTerminate(s)}
                            disabled={updatingId === s.id}
                            title="Kündigung erfassen (verhindert versehentliche Wiedereinstellung)"
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Kündigen
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-luxe-silver hover:text-red-400"
                            onClick={() => handleDelete(s.id, s.email)}
                            disabled={updatingId === s.id || deletingId === s.id}
                          >
                            {deletingId === s.id ? '…' : 'Löschen'}
                          </Button>
                        </>
                      ) : null}
                      {!s.is_active && !isOwnerRowProtected && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-luxe-silver hover:text-luxe-gold"
                            onClick={() => setProfileModalStaff(s)}
                            disabled={updatingId === s.id}
                            title="Mitarbeiterprofil bearbeiten"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Profil
                          </Button>
                          {s.terminated_at ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-luxe-gold"
                              onClick={() => handleReinstate(s)}
                              disabled={updatingId === s.id}
                              title="Wiedereinstellen (terminated_at zurücksetzen)"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Wiedereinstellen
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-luxe-gold"
                              onClick={() => handleUpdate(s.id, { is_active: true })}
                              disabled={updatingId === s.id}
                            >
                              Reaktivieren
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-luxe-silver hover:text-red-400"
                            onClick={() => handleDelete(s.id, s.email)}
                            disabled={deletingId === s.id}
                          >
                            {deletingId === s.id ? '…' : 'Löschen'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!profileModalStaff} onOpenChange={(open) => !open && setProfileModalStaff(null)}>
        <DialogContent className="bg-luxe-charcoal border-luxe-gray text-white max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-luxe-gold">
              Mitarbeiterprofil – {profileModalStaff?.email}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div>
              <Label className="text-luxe-silver">Vorname</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.first_name} onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">Nachname</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.last_name} onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">Geburtsdatum</Label>
              <Input type="date" className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.date_of_birth} onChange={(e) => setProfileForm((p) => ({ ...p, date_of_birth: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">Geburtsort</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.place_of_birth} onChange={(e) => setProfileForm((p) => ({ ...p, place_of_birth: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">Geburtsland (z. B. DEU)</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.country_of_birth} onChange={(e) => setProfileForm((p) => ({ ...p, country_of_birth: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">Staatsangehörigkeit</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.nationality} onChange={(e) => setProfileForm((p) => ({ ...p, nationality: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-luxe-silver">Straße und Hausnummer</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.address_street} onChange={(e) => setProfileForm((p) => ({ ...p, address_street: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">PLZ</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.address_postal_code} onChange={(e) => setProfileForm((p) => ({ ...p, address_postal_code: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">Ort</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.address_city} onChange={(e) => setProfileForm((p) => ({ ...p, address_city: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">Steuer-ID (11 Ziffern)</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.tax_id} onChange={(e) => setProfileForm((p) => ({ ...p, tax_id: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">Versicherungsnummer</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.social_insurance_number} onChange={(e) => setProfileForm((p) => ({ ...p, social_insurance_number: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-luxe-silver">Krankenkasse</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.health_insurance} onChange={(e) => setProfileForm((p) => ({ ...p, health_insurance: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">Telefon</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-luxe-silver">Interne Notizen (nur Admin)</Label>
              <Input className="bg-luxe-gray border-luxe-gray mt-1" value={profileForm.notes} onChange={(e) => setProfileForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
            <div>
              <Label className="text-luxe-silver">Befristeter Vertrag – Enddatum</Label>
              <Input
                type="date"
                className="bg-luxe-gray border-luxe-gray mt-1"
                value={profileForm.contract_ends_at}
                onChange={(e) => setProfileForm((p) => ({ ...p, contract_ends_at: e.target.value }))}
              />
              <p className="text-xs text-luxe-silver/80 mt-1">Leer = unbefristet. Gesetzt = befristet bis zu diesem Datum (wie bei Vendoren/Lieferanten).</p>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-luxe-silver">Ansprechpartner / Vorgesetzte/r (Teamleiter)</Label>
              <select
                className="mt-1 w-full rounded-md bg-luxe-gray border border-luxe-gray px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-luxe-gold/50"
                value={profileForm.reports_to_id || ''}
                onChange={(e) => setProfileForm((p) => ({ ...p, reports_to_id: e.target.value || null }))}
              >
                <option value="">— Kein fester Ansprechpartner —</option>
                {list
                  .filter((s) => s.id !== profileModalStaff?.id && s.is_active)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {[s.first_name, s.last_name].filter(Boolean).join(' ') || s.email} ({s.email})
                    </option>
                  ))}
              </select>
              <p className="text-xs text-luxe-silver/80 mt-1">Erscheint beim Mitarbeiter unter „Mein Profil“ als Ansprechpartner bei Fragen oder Problemen.</p>
            </div>
          </div>

          <div className="border-t border-luxe-gray pt-4 mt-4">
            <h4 className="text-luxe-gold font-medium flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4" />
              Dokumente / Verträge
            </h4>
            <p className="text-luxe-silver text-sm mb-3">
              Eingescannte unterschriebene Verträge oder andere Dokumente hier hochladen und dem Mitarbeiter zuordnen.
            </p>
            {staffDocumentsLoading ? (
              <p className="text-luxe-silver text-sm">Laden...</p>
            ) : staffDocuments.length === 0 ? (
              <p className="text-luxe-silver text-sm">Noch keine Dokumente.</p>
            ) : (
              <ul className="space-y-2 mb-4">
                {staffDocuments.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-2 py-2 border-b border-luxe-gray/50">
                    <div className="min-w-0">
                      <span className="text-white text-sm truncate block">{doc.file_name || 'Dokument'}</span>
                      <span className="text-luxe-silver text-xs">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type} · {new Date(doc.created_at).toLocaleDateString('de-DE')}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button type="button" variant="ghost" size="sm" className="text-luxe-silver hover:text-luxe-gold" onClick={() => handleDocumentDownload(doc.id)} title="Öffnen / Herunterladen">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="text-luxe-silver hover:text-red-400" onClick={() => handleDocumentDelete(doc.id)} disabled={documentDeletingId === doc.id} title="Löschen">
                        {documentDeletingId === doc.id ? <span className="animate-pulse">…</span> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-end gap-2">
              <select
                value={documentUploadType}
                onChange={(e) => setDocumentUploadType(e.target.value)}
                className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white text-sm"
              >
                {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <label className="cursor-pointer">
                <span className="sr-only">Datei wählen</span>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => setDocumentUploadFile(e.target.files?.[0] ?? null)}
                />
                <span className="inline-flex items-center gap-2 rounded-md border border-luxe-gray bg-luxe-gray/50 px-3 py-2 text-sm text-luxe-silver hover:bg-luxe-gray">
                  <Upload className="w-4 h-4" />
                  {documentUploadFile ? documentUploadFile.name : 'Scan/Datei wählen…'}
                </span>
              </label>
              <Button type="button" variant="luxe" size="sm" onClick={handleDocumentUpload} disabled={!documentUploadFile || documentUploading}>
                {documentUploading ? '…' : 'Hinzufügen'}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setProfileModalStaff(null)}>Abbrechen</Button>
            <Button variant="luxe" onClick={handleSaveProfile} disabled={profileSaving}>{profileSaving ? '…' : 'Speichern'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
