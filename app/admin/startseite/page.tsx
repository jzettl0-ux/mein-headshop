'use client'

import { useState, useEffect } from 'react'
import { Home, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Influencer } from '@/lib/types'

export default function AdminStartseitePage() {
  const [influencers, setInfluencers] = useState<(Influencer & { product_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadInfluencers()
  }, [])

  const loadInfluencers = async () => {
    const { data, error } = await supabase
      .from('influencers')
      .select('*')
      .order('name')

    if (!error && data) {
      const withCount = await Promise.all(
        (data as Influencer[]).map(async (inf) => {
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('influencer_id', inf.id)
          return { ...inf, product_count: count || 0 }
        })
      )
      setInfluencers(withCount)
    }
    setLoading(false)
  }

  const updateInfluencer = (id: string, updates: Partial<Influencer>) => {
    setInfluencers((prev) =>
      prev.map((inf) => (inf.id === id ? { ...inf, ...updates } : inf))
    )
  }

  const saveAll = async () => {
    setSaving(true)
    try {
      for (const inf of influencers) {
        await supabase
          .from('influencers')
          .update({
            show_on_homepage: inf.show_on_homepage ?? false,
            homepage_order: inf.homepage_order ?? 0,
            homepage_title: inf.homepage_title?.trim() || null,
            homepage_bio: inf.homepage_bio?.trim() || null,
          })
          .eq('id', inf.id)
      }
      toast({
        title: 'Gespeichert',
        description: 'Startseiten-Influencer wurden aktualisiert.',
      })
    } catch (e: any) {
      toast({
        title: 'Fehler',
        description: e.message || 'Speichern fehlgeschlagen.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-foreground">Laden...</p>
      </div>
    )
  }

  const onHomepage = influencers.filter((i) => i.show_on_homepage).sort((a, b) => (a.homepage_order ?? 0) - (b.homepage_order ?? 0))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Home className="w-8 h-8 text-luxe-gold" />
            Startseite
          </h1>
          <p className="text-luxe-silver mt-1">
            Lege fest, welche Influencer auf der Startseite erscheinen und individualisiere Titel & Bio nur dort.
          </p>
        </div>
        <Button
          onClick={saveAll}
          disabled={saving}
          className="bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Speichern...' : 'Änderungen speichern'}
        </Button>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-foreground">Influencer für die Startseite</CardTitle>
          <p className="text-sm text-luxe-silver">
            Aktiviere „Auf Startseite“ und setze die Reihenfolge (0 = zuerst). Optionale Felder überschreiben nur die Anzeige auf der Startseite.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {influencers.map((inf) => (
            <div
              key={inf.id}
              className="p-4 rounded-xl border border-luxe-gray bg-luxe-black/50 space-y-4"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`show-${inf.id}`}
                    checked={!!inf.show_on_homepage}
                    onChange={(e) => updateInfluencer(inf.id, { show_on_homepage: e.target.checked })}
                    className="w-4 h-4 rounded border-luxe-gray text-luxe-gold focus:ring-luxe-gold"
                  />
                  <Label htmlFor={`show-${inf.id}`} className="text-foreground font-medium cursor-pointer">
                    Auf Startseite anzeigen
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-luxe-silver text-sm">Reihenfolge</Label>
                  <Input
                    type="number"
                    min={0}
                    value={inf.homepage_order ?? 0}
                    onChange={(e) => updateInfluencer(inf.id, { homepage_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-20 bg-luxe-gray border-luxe-silver text-foreground"
                  />
                </div>
                <span className="text-luxe-silver text-sm">
                  {inf.name} · {inf.product_count ?? 0} Produkte
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-luxe-gray">
                <div>
                  <Label className="text-luxe-silver text-sm">Titel auf Startseite (optional)</Label>
                  <Input
                    placeholder={inf.name}
                    value={inf.homepage_title ?? ''}
                    onChange={(e) => updateInfluencer(inf.id, { homepage_title: e.target.value })}
                    className="mt-1 bg-luxe-gray border-luxe-silver text-foreground"
                  />
                  <p className="text-xs text-luxe-silver mt-1">Leer = normaler Name</p>
                </div>
                <div>
                  <Label className="text-luxe-silver text-sm">Bio auf Startseite (optional)</Label>
                  <Input
                    placeholder={inf.bio ?? 'Kurzbeschreibung'}
                    value={inf.homepage_bio ?? ''}
                    onChange={(e) => updateInfluencer(inf.id, { homepage_bio: e.target.value })}
                    className="mt-1 bg-luxe-gray border-luxe-silver text-foreground"
                  />
                  <p className="text-xs text-luxe-silver mt-1">Leer = normale Bio</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {onHomepage.length > 0 && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-foreground">Vorschau: So erscheinen sie auf der Startseite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {onHomepage.map((inf, i) => (
                <span
                  key={inf.id}
                  className="px-3 py-1.5 rounded-lg bg-luxe-gray text-foreground text-sm"
                >
                  {i + 1}. {inf.homepage_title || inf.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {influencers.length === 0 && (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Noch keine Influencer angelegt. Erstelle zuerst <Link href="/admin/influencers" className="text-luxe-gold hover:underline">Influencer</Link>.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
