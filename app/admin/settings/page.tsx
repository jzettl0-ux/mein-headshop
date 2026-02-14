'use client'

import { useState, useEffect } from 'react'
import { Palette, Loader2, Check, Plus, Trash2, ImageIcon, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { uploadSiteLogo } from '@/lib/supabase'

const DEFAULT_LABELS: Record<string, string> = {
  primary: 'Hauptfarbe (Gold/Akzent)',
  accent: 'Neon/Akzent',
  charcoal: 'Charcoal (Hintergründe)',
  black: 'Schwarz (Hintergrund)',
  gray: 'Grau (Borders)',
  silver: 'Silber (Text sekundär)',
}

const DEFAULT_COLORS: Record<string, string> = {
  primary: '#D4AF37',
  accent: '#39FF14',
  charcoal: '#1A1A1A',
  black: '#0A0A0A',
  gray: '#2A2A2A',
  silver: '#8A8A8A',
}

export default function AdminSettingsPage() {
  const [colors, setColors] = useState<Record<string, string>>({ ...DEFAULT_COLORS })
  const [customKeys, setCustomKeys] = useState<string[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data: Record<string, string>) => {
        const { logo_url, ...rest } = data
        if (logo_url) setLogoUrl(logo_url)
        setColors({ ...DEFAULT_COLORS, ...rest })
        const known = new Set([...Object.keys(DEFAULT_COLORS), 'logo_url'])
        setCustomKeys(Object.keys(rest).filter((k) => !known.has(k)))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key: string, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }))
  }

  const addColor = () => {
    const key = newKeyName.trim().toLowerCase().replace(/\s+/g, '_') || 'custom'
    if (!key) return
    const unique = key + (customKeys.includes(key) ? '_' + Date.now() : '')
    setCustomKeys((prev) => [...prev, unique])
    setColors((prev) => ({ ...prev, [unique]: '#888888' }))
    setNewKeyName('')
  }

  const removeColor = (key: string) => {
    setCustomKeys((prev) => prev.filter((k) => k !== key))
    setColors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colors),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      toast({
        title: 'Branding gespeichert',
        description: 'Die Farben wurden aktualisiert.',
      })
      const root = document.documentElement
      for (const [key, value] of Object.entries(colors)) {
        if (value) root.style.setProperty('--luxe-' + key, value)
      }
    } catch {
      toast({
        title: 'Fehler',
        description: 'Branding konnte nicht gespeichert werden.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const labelFor = (key: string) => DEFAULT_LABELS[key] ?? key

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      toast({ title: 'Ungültige Datei', description: 'Bitte ein Bild (PNG, JPG, …) wählen.', variant: 'destructive' })
      return
    }
    setLogoUploading(true)
    try {
      const url = await uploadSiteLogo(file)
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: url, ...colors }),
      })
      if (!res.ok) throw new Error('Speichern fehlgeschlagen')
      setLogoUrl(url)
      toast({ title: 'Logo hochgeladen', description: 'Das neue Logo wird im Header angezeigt.' })
    } catch (err: any) {
      toast({ title: 'Upload fehlgeschlagen', description: err.message || 'Bitte erneut versuchen.', variant: 'destructive' })
    } finally {
      setLogoUploading(false)
      e.target.value = ''
    }
  }

  const removeLogo = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: '' }),
      })
      setLogoUrl(null)
      toast({ title: 'Logo entfernt', description: 'Es wird wieder das Standard-Logo angezeigt.' })
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Palette className="w-8 h-8 text-luxe-gold" />
          Branding & Farben
        </h1>
        <p className="text-luxe-silver mt-1">
          Passe die Markenfarben und das Logo für den gesamten Shop an. Änderungen wirken sofort.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-luxe-gold" />
            Logo
          </CardTitle>
          <p className="text-sm text-luxe-silver">
            Lade ein Bild vom PC hoch – es ersetzt das Logo im Header. Empfohlen: quadratisch oder Querformat, z. B. 200×200 px (PNG oder JPG).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoUrl && (
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-luxe-gray border border-luxe-silver flex-shrink-0">
                <img src={logoUrl} alt="Aktuelles Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-white text-sm">Aktuelles Logo</p>
                <Button type="button" variant="outline" size="sm" onClick={removeLogo} className="mt-2 border-red-500/50 text-red-400 hover:bg-red-500/10">
                  Logo entfernen (Standard anzeigen)
                </Button>
              </div>
            </div>
          )}
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray border border-luxe-silver text-white hover:bg-luxe-gray/80 text-sm">
            <input type="file" accept="image/*" className="hidden" disabled={logoUploading} onChange={handleLogoUpload} />
            {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {logoUploading ? 'Wird hochgeladen…' : (logoUrl ? 'Neues Logo wählen' : 'Logo vom PC hochladen')}
          </label>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Farbpalette</CardTitle>
          <p className="text-sm text-luxe-silver">
            Hauptfarbe und Neon werden für Buttons, Badges und Akzente genutzt. Dunkeltöne für Hintergründe.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.keys(colors).map((key) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Label className="text-white sm:w-48">{labelFor(key)}</Label>
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="color"
                  value={colors[key] ?? '#000'}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-12 h-12 rounded border border-luxe-gray cursor-pointer bg-transparent"
                />
                <Input
                  value={colors[key] ?? ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="bg-luxe-gray border-luxe-gray text-white font-mono max-w-[140px]"
                  placeholder="#hex"
                />
                {customKeys.includes(key) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => removeColor(key)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-luxe-gray">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Neue Farbe (z. B. secondary)"
              className="bg-luxe-gray border-luxe-gray text-white max-w-[200px]"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
            />
            <Button type="button" variant="outline" size="sm" onClick={addColor} className="border-luxe-gray text-white">
              <Plus className="w-4 h-4 mr-1" />
              Farbe hinzufügen
            </Button>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="luxe"
            className="mt-4"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Farben speichern
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
