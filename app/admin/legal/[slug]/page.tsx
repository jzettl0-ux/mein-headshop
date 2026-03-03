'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { FileText, Loader2, Save, ArrowLeft, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const SLUG_LABELS: Record<string, string> = {
  impressum: 'Impressum',
  privacy: 'Datenschutzerklärung',
  terms: 'AGB',
  returns: 'Widerrufsbelehrung',
}

const SLUG_LINKS: Record<string, string> = {
  impressum: '/impressum',
  privacy: '/privacy',
  terms: '/terms',
  returns: '/returns',
}

export default function AdminLegalEditPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!slug) return
    fetch(`/api/admin/legal/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Laden fehlgeschlagen')
        return res.json()
      })
      .then((data) => {
        setTitle(data.title ?? SLUG_LABELS[slug] ?? slug)
        setContent(data.content ?? '')
      })
      .catch(() => toast({ title: 'Fehler', description: 'Rechtstext konnte nicht geladen werden.', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [slug, toast])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/legal/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({ title: 'Gespeichert', description: 'Rechtstext wurde aktualisiert.' })
    } catch {
      toast({ title: 'Fehler', description: 'Rechtstext konnte nicht gespeichert werden.', variant: 'destructive' })
    } finally {
      setSaving(false)
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="text-luxe-silver" asChild>
          <Link href="/admin/legal">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Zurück
          </Link>
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-7 h-7 text-luxe-gold" />
          {SLUG_LABELS[slug] ?? title}
        </h1>
        <Button variant="outline" size="sm" className="border-luxe-gray text-luxe-silver" asChild>
          <a href={SLUG_LINKS[slug]} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 mr-1" />
            Im Shop ansehen
          </a>
        </Button>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Inhalt bearbeiten</CardTitle>
          <p className="text-sm text-luxe-silver font-normal">
            HTML ist erlaubt (z. B. &lt;p&gt;, &lt;a href=&quot;...&quot;&gt;, &lt;br&gt;, &lt;strong&gt;). Platzhalter werden beim Anzeigen ersetzt.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-luxe-silver">Seitentitel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 bg-luxe-black border-luxe-gray text-white"
            />
          </div>
          <div>
            <Label htmlFor="content" className="text-luxe-silver">Inhalt (HTML)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 min-h-[320px] font-mono text-sm bg-luxe-black border-luxe-gray text-white"
              placeholder="<p>...</p> oder Fließtext mit {{company_name}}, {{company_email}} usw."
              spellCheck={false}
            />
          </div>
          <Button variant="luxe" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Speichern
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
