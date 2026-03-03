'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ImageIcon, Droplets, MapPin, Loader2, Check, ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const POSITIONS = [
  { value: 'top_left', label: 'Oben links' },
  { value: 'top_right', label: 'Oben rechts' },
  { value: 'bottom_left', label: 'Unten links' },
  { value: 'bottom_right', label: 'Unten rechts' },
  { value: 'center', label: 'Mitte' },
] as const

const PREVIEW_IMAGE = 'https://images.unsplash.com/photo-1606800052052-08a2075c0d9f?w=400&h=300&fit=crop'

export default function AdminSettingsMediaPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [opacity, setOpacity] = useState(50)
  const [position, setPosition] = useState<string>('bottom_right')
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/watermark-settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setLogoUrl(d.logo_url ?? '')
          setOpacity(Number(d.opacity) ?? 50)
          setPosition(d.position ?? 'bottom_right')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) {
      toast({ title: 'Ungültige Datei', description: 'Bitte ein Bild (PNG, JPG, WebP, GIF) wählen.', variant: 'destructive' })
      e.target.value = ''
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload/site-asset', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Upload fehlgeschlagen', description: data.error || 'Bitte erneut versuchen.', variant: 'destructive' })
        return
      }
      if (data.url) {
        setLogoUrl(data.url)
        toast({ title: 'Bild hochgeladen', description: 'Die URL wurde übernommen. Mit Speichern übernehmen.' })
      }
    } catch {
      toast({ title: 'Upload fehlgeschlagen', variant: 'destructive' })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/watermark-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logo_url: logoUrl.trim() || null,
          opacity,
          position,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast({ title: 'Fehler', description: err.error || 'Speichern fehlgeschlagen', variant: 'destructive' })
        return
      }
      toast({ title: 'Gespeichert', description: 'Wasserzeichen-Einstellungen werden beim nächsten Asset-Upload angewendet.' })
    } finally {
      setSaving(false)
    }
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    top_left: { top: 12, left: 12 },
    top_right: { top: 12, right: 12 },
    bottom_left: { bottom: 12, left: 12 },
    bottom_right: { bottom: 12, right: 12 },
    center: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' },
  }
  const posStyle = positionStyles[position] ?? positionStyles.bottom_right

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] gap-2 text-luxe-silver">
        <Loader2 className="w-6 h-6 animate-spin" />
        Lade Einstellungen…
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-sm text-luxe-silver hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zu Einstellungen
        </Link>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-7 h-7 text-luxe-gold" />
          Media & Wasserzeichen
        </h1>
        <p className="text-luxe-silver mt-1">
          Einstellungen für das automatische Wasserzeichen auf Influencer-Assets
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white text-lg">Wasserzeichen</CardTitle>
            <CardDescription className="text-luxe-silver">
              Logo-URL (z. B. aus Branding oder direkte URL), Deckkraft und Position
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-white/90 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Logo-URL / Bild
              </Label>
              <p className="text-xs text-white/70 mt-0.5 mb-2">
                URL direkt eintragen oder Bild vom PC hochladen – dann wird automatisch eine Internetadresse erzeugt.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://… oder per Upload eintragen"
                  className="flex-1 bg-luxe-gray border-luxe-gray text-white placeholder:text-white/60"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-luxe-gray hover:bg-luxe-gray/50 text-white shrink-0"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? ' Lädt…' : ' Vom PC hochladen'}
                </Button>
              </div>
              {logoUrl && (
                <p className="text-xs text-white/60 mt-1 truncate" title={logoUrl}>
                  URL: {logoUrl}
                </p>
              )}
            </div>
            <div>
              <Label className="text-luxe-silver flex items-center gap-2">
                <Droplets className="w-4 h-4" /> Deckkraft
              </Label>
              <div className="mt-2 flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none bg-luxe-gray accent-luxe-gold"
                />
                <span className="text-white font-mono w-10">{opacity} %</span>
              </div>
            </div>
            <div>
              <Label className="text-luxe-silver flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Position
              </Label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="mt-2 w-full rounded-md border border-luxe-silver bg-luxe-gray px-3 py-2 text-white"
              >
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={saving} variant="luxe">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Speichern
            </Button>
          </CardContent>
        </Card>
      </form>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white text-lg">Vorschau</CardTitle>
          <CardDescription className="text-luxe-silver">
            So wirkt das Wasserzeichen auf einem Beispielbild
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative rounded-lg overflow-hidden border border-luxe-gray aspect-video bg-luxe-black"
          >
            <img
              src={PREVIEW_IMAGE}
              alt="Vorschau"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {logoUrl.trim() ? (
              <div
                className="absolute w-1/4 h-1/4 min-w-[80px] min-h-[40px] flex items-center justify-center p-2"
                style={{
                  ...posStyle,
                  opacity: opacity / 100,
                } as React.CSSProperties}
              >
                <img
                  src={logoUrl.trim()}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            ) : (
              <div
                className="absolute rounded bg-white/20 flex items-center justify-center text-white text-xs"
                style={{ ...posStyle, width: 100, height: 40 }}
              >
                Kein Logo
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
