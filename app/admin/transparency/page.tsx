'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, Loader2, Plus, QrCode, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const STATUS_LABELS: Record<string, string> = {
  GENERATED: 'Generiert',
  PRINTED: 'Gedruckt',
  SCANNED_AT_FC: 'Im Lager gescannt',
  DELIVERED: 'Ausgeliefert',
}

export default function AdminTransparencyPage() {
  const { toast } = useToast()
  const [codes, setCodes] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genProductId, setGenProductId] = useState('')
  const [genCount, setGenCount] = useState('10')
  const [scanInput, setScanInput] = useState('')
  const [scanning, setScanning] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/transparency/codes').then((r) => (r.ok ? r.json() : { codes: [] })),
      fetch('/api/admin/transparency/brands').then((r) => (r.ok ? r.json() : { brands: [] })),
    ])
      .then(([c, b]) => {
        setCodes(c.codes ?? [])
        setBrands(b.brands ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleGenerate = async () => {
    const cnt = parseInt(genCount, 10) || 1
    if (cnt < 1 || cnt > 100) {
      toast({ title: 'Anzahl 1–100', variant: 'destructive' })
      return
    }
    setGenerating(true)
    try {
      const res = await fetch('/api/admin/transparency/codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: genProductId || null, count: cnt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({ title: `${data.generated ?? cnt} Codes generiert` })
      setGenCount('10')
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setGenerating(false)
    }
  }

  const handleScan = async () => {
    const code = scanInput.trim().toUpperCase()
    if (!code) return
    setScanning(true)
    try {
      const res = await fetch('/api/admin/transparency/codes/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({ title: `Code ${code} → ${data.status ?? 'gescannt'}` })
      setScanInput('')
      load()
    } catch (e) {
      toast({ title: (e as Error).message, variant: 'destructive' })
    } finally {
      setScanning(false)
    }
  }

  const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify?code=` : '/verify?code='

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-emerald-500" />
          Transparency-Programm
        </h1>
        <p className="mt-1 text-luxe-silver">
          Anti-Fälschung: Eindeutige QR-Codes pro Einheit. Kunden prüfen unter <Link href="/verify" className="text-luxe-gold hover:underline">/verify</Link>.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Codes generieren</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-luxe-silver mb-1">Produkt (optional)</label>
            <select
              value={genProductId}
              onChange={(e) => setGenProductId(e.target.value)}
              className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white w-64"
            >
              <option value="">— Ohne Produkt —</option>
              {brands
                .filter((b) => b.products)
                .map((b) => (
                  <option key={b.enrollment_id} value={b.product_id}>
                    {b.products?.name} ({b.vendor_accounts?.company_name ?? 'Vendor'})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-luxe-silver mb-1">Anzahl</label>
            <input
              type="number"
              min={1}
              max={100}
              value={genCount}
              onChange={(e) => setGenCount(e.target.value)}
              className="rounded-md border border-luxe-gray bg-luxe-black px-3 py-2 text-white w-24"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
              Codes generieren
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white">Code scannen</CardTitle>
          <p className="text-sm text-luxe-silver">Status auf SCANNED_AT_FC setzen</p>
        </CardHeader>
        <CardContent className="flex gap-2">
          <input
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder="Code eingeben (z. B. ABC123…)"
            className="flex-1 rounded-md border border-luxe-gray bg-luxe-black px-4 py-2 text-white"
          />
          <Button onClick={handleScan} disabled={scanning || !scanInput.trim()}>
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Scannen'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white">Transparency-Codes</CardTitle>
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Aktualisieren
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-luxe-silver" />
            </div>
          ) : codes.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">Keine Codes. Generiere welche oben.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-auto">
              {codes.slice(0, 50).map((c: any) => (
                <div
                  key={c.code_id}
                  className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-luxe-black/50 border border-luxe-gray"
                >
                  <div className="flex items-center gap-3">
                    <code className="text-luxe-gold font-mono text-sm">{c.unique_qr_code}</code>
                    {c.products?.name && <span className="text-luxe-silver text-sm">{c.products.name}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === 'DELIVERED' ? 'default' : 'secondary'}>
                      {STATUS_LABELS[c.status] ?? c.status}
                    </Badge>
                    <a
                      href={`${verifyUrl}${c.unique_qr_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-luxe-gold hover:underline"
                    >
                      Prüfen
                    </a>
                  </div>
                </div>
              ))}
              {codes.length > 50 && (
                <p className="text-luxe-silver text-sm py-2">… und {codes.length - 50} weitere</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
