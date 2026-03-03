'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Loader2,
  Plus,
  Pencil,
  FileDown,
  Printer,
  Link2,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

type Contract = {
  id: string
  slug: string
  label: string
  template_text: string
  contract_type?: string | null
  created_at: string
  updated_at: string
}

export default function AdminContractsPage() {
  const [list, setList] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null)
  const { toast } = useToast()

  const load = () => {
    fetch('/api/admin/contracts')
      .then((res) => {
        if (!res.ok) throw new Error('Laden fehlgeschlagen')
        return res.json()
      })
      .then(setList)
      .catch(() => toast({ title: 'Fehler', description: 'Verträge konnten nicht geladen werden.', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const copyAcceptLink = (slug: string) => {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/vertrag/${slug}/bestaetigen`
    navigator.clipboard.writeText(url)
    toast({ title: 'Link kopiert', description: 'Der Link zur elektronischen Bestätigung wurde in die Zwischenablage kopiert.' })
  }

  const deleteContract = async (slug: string, label: string) => {
    if (!confirm(`Vertrag „${label}“ wirklich löschen? Bestätigungen bleiben gespeichert.`)) return
    setDeletingSlug(slug)
    try {
      const res = await fetch(`/api/admin/contracts/${slug}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Löschen fehlgeschlagen')
      toast({ title: 'Gelöscht', description: `Vertrag „${label}“ wurde entfernt.` })
      load()
    } catch {
      toast({ title: 'Fehler', description: 'Vertrag konnte nicht gelöscht werden.', variant: 'destructive' })
    } finally {
      setDeletingSlug(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-luxe-gold" />
            Verträge
          </h1>
          <p className="text-luxe-silver mt-1">
            Vorlagen verwalten (Mitarbeiter, Verkäufer, Lieferant …), anpassen, drucken oder nur elektronisch bestätigen lassen. Nicht benötigte Vorlagen kannst du jederzeit über den Button „Löschen“ entfernen.
          </p>
        </div>
        <Button variant="luxe" asChild>
          <Link href="/admin/contracts/new">
            <Plus className="w-4 h-4 mr-2" />
            Neuer Vertrag
          </Link>
        </Button>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Vertragsvorlagen</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-luxe-silver py-6">Noch keine Verträge angelegt. Lege eine neue Vorlage an oder führe die Migration aus.</p>
          ) : (
            <ul className="divide-y divide-luxe-gray">
              {list.map((c) => (
                <li key={c.id} className="py-4 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{c.label}</span>
                    <span className="text-luxe-silver text-sm">({c.slug})</span>
                    {c.contract_type === 'employee' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-luxe-gold/20 text-luxe-gold border border-luxe-gold/40">Mitarbeiter</span>
                    )}
                    {c.contract_type === 'vendor' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-luxe-neon/20 text-luxe-neon border border-luxe-neon/40">Verkäufer/Lieferant</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" className="border-luxe-gray text-luxe-silver" asChild>
                      <Link href={`/admin/contracts/${c.slug}`}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Bearbeiten
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10"
                      onClick={() => window.open(`/api/admin/contracts/${c.slug}/pdf`, '_blank')}
                    >
                      <FileDown className="w-4 h-4 mr-1" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10"
                      asChild
                    >
                      <Link href={`/admin/contracts/${c.slug}/preview`} target="_blank" rel="noopener noreferrer">
                        <Printer className="w-4 h-4 mr-1" />
                        Vorschau
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10"
                      onClick={() => copyAcceptLink(c.slug)}
                    >
                      <Link2 className="w-4 h-4 mr-1" />
                      Link kopieren
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-luxe-gray text-luxe-silver"
                      asChild
                    >
                      <Link href={`/admin/contracts/${c.slug}#acceptances`}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Bestätigungen
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteContract(c.slug, c.label)}
                      disabled={deletingSlug === c.slug}
                    >
                      {deletingSlug === c.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
