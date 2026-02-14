'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import Link from 'next/link'

interface Influencer {
  id: string
  name: string
  slug: string
}

export default function NewProductPage() {
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    cost_price: '',
    image_url: '',
    category: 'bongs' as string,
    stock: '',
    is_adult_only: true,
    is_featured: false,
    influencer_id: null as string | null,
    tags: '',
    discount_percent: '0',
    discount_until: '',
  })

  useEffect(() => {
    loadInfluencers()
  }, [])

  useEffect(() => {
    // Auto-generate slug from name
    if (formData.name && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(formData.name)
      }))
    }
  }, [formData.name])

  const loadInfluencers = async () => {
    const { data } = await supabase
      .from('influencers')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name')
    
    if (data) setInfluencers(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        image_url: formData.image_url,
        images: formData.image_url ? [formData.image_url] : [],
        category: formData.category,
        stock: parseInt(formData.stock),
        is_adult_only: formData.is_adult_only,
        is_featured: formData.is_featured,
        influencer_id: formData.influencer_id || null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        discount_percent: Math.min(100, Math.max(0, parseInt(formData.discount_percent) || 0)),
        discount_until: formData.discount_until || null,
      }

      const { error } = await supabase
        .from('products')
        .insert(productData)

      if (error) throw error

      toast({
        title: 'Produkt erstellt',
        description: `${formData.name} wurde erfolgreich hinzugefügt.`,
      })

      router.push('/admin/products')
    } catch (error: any) {
      console.error('Create product error:', error)
      toast({
        title: 'Fehler beim Erstellen',
        description: error.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const categories = [
    { value: 'bongs', label: 'Bongs' },
    { value: 'grinder', label: 'Grinder' },
    { value: 'papers', label: 'Papers' },
    { value: 'vaporizer', label: 'Vaporizer' },
    { value: 'zubehoer', label: 'Zubehör' },
    { value: 'influencer-drops', label: 'Influencer Drops' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center text-luxe-silver hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu Produkten
          </Link>
          <h1 className="text-3xl font-bold text-white">Neues Produkt</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Basis-Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-white">
                    Produktname *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Premium Glasbong Crystal"
                    className="bg-luxe-gray border-luxe-silver text-white"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug" className="text-white">
                    Slug (URL)
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Wird automatisch generiert"
                    className="bg-luxe-gray border-luxe-silver text-white"
                  />
                  <p className="text-xs text-luxe-silver mt-1">
                    URL: /shop/{formData.slug || 'produkt-name'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">
                    Beschreibung *
                  </Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detaillierte Produktbeschreibung..."
                    className="w-full min-h-32 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price" className="text-white">
                      Verkaufspreis (€) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="99.99"
                      className="bg-luxe-gray border-luxe-silver text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="cost_price" className="text-white">
                      Einkaufspreis (€)
                    </Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      placeholder="Für Marge"
                      className="bg-luxe-gray border-luxe-silver text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock" className="text-white">
                      Lagerbestand *
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      placeholder="10"
                      className="bg-luxe-gray border-luxe-silver text-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-luxe-gray">
                  <div>
                    <Label htmlFor="discount_percent" className="text-white">
                      Rabatt (%)
                    </Label>
                    <Input
                      id="discount_percent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                      placeholder="0"
                      className="bg-luxe-gray border-luxe-silver text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_until" className="text-white">
                      Rabatt gültig bis (optional)
                    </Label>
                    <Input
                      id="discount_until"
                      type="date"
                      value={formData.discount_until}
                      onChange={(e) => setFormData({ ...formData, discount_until: e.target.value })}
                      className="bg-luxe-gray border-luxe-silver text-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Produktbilder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="image_url" className="text-white">
                    Bild-URL *
                  </Label>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="bg-luxe-gray border-luxe-silver text-white"
                    required
                  />
                  <p className="text-xs text-luxe-silver mt-1">
                    Tipp: Nutze hochwertige Bilder von Unsplash
                  </p>
                </div>

                {/* Image Preview */}
                {formData.image_url && (
                  <div className="relative aspect-square w-full max-w-xs rounded-lg overflow-hidden bg-luxe-gray">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%232A2A2A"/%3E%3C/svg%3E'
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Tags & Kategorisierung</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tags" className="text-white">
                    Tags (komma-getrennt)
                  </Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="premium, glas, handgefertigt"
                    className="bg-luxe-gray border-luxe-silver text-white"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.split(',').filter(Boolean).map((tag, i) => (
                      <Badge key={i} variant="secondary">
                        #{tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settings */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Einstellungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-white">
                    Kategorie *
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full h-10 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <Label className="text-white block">Produkttyp</Label>
                  <div className="flex gap-6">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        checked={!formData.influencer_id}
                        onChange={() => setFormData({ ...formData, influencer_id: null })}
                        className="w-4 h-4 text-luxe-gold"
                      />
                      <span className="text-white">Eigenes Produkt</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="productType"
                        checked={!!formData.influencer_id}
                        onChange={() => setFormData({ ...formData, influencer_id: influencers[0]?.id ?? null })}
                        className="w-4 h-4 text-luxe-gold"
                      />
                      <span className="text-white">Influencer Produkt</span>
                    </label>
                  </div>
                  {formData.influencer_id && (
                    <div>
                      <Label htmlFor="influencer" className="text-white">Welcher Influencer?</Label>
                      <select
                        id="influencer"
                        value={formData.influencer_id}
                        onChange={(e) => setFormData({ ...formData, influencer_id: e.target.value || null })}
                        className="w-full h-10 px-3 py-2 mt-2 bg-luxe-gray border border-luxe-silver rounded-md text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {influencers.map((inf) => (
                          <option key={inf.id} value={inf.id}>
                            {inf.name} Edition
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-luxe-silver mt-1">
                        Erscheint auf der Influencer-Seite und in der Influencer-Übersicht.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-luxe-gray">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_adult_only}
                      onChange={(e) => setFormData({ ...formData, is_adult_only: e.target.checked })}
                      className="w-5 h-5 rounded bg-luxe-gray border-luxe-silver"
                    />
                    <div>
                      <span className="text-white font-medium">18+ Produkt</span>
                      <p className="text-xs text-luxe-silver">
                        Altersverifizierung erforderlich
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-5 h-5 rounded bg-luxe-gray border-luxe-silver"
                    />
                    <div>
                      <span className="text-white font-medium">Featured</span>
                      <p className="text-xs text-luxe-silver">
                        Auf Homepage hervorheben
                      </p>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Vorschau</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.influencer_id && (
                    <Badge className="bg-violet-600 text-white font-bold border-none">
                      Influencer-Edition
                    </Badge>
                  )}
                  {formData.is_featured && !formData.influencer_id && (
                    <Badge variant="featured">Store-Highlight</Badge>
                  )}
                  {formData.is_adult_only && (
                    <Badge variant="adult">18+</Badge>
                  )}
                  <Badge variant="secondary">{formData.category}</Badge>
                </div>

                {formData.name && (
                  <div>
                    <p className="text-white font-semibold">{formData.name}</p>
                    {formData.price && (
                      <p className="text-luxe-gold text-xl font-bold mt-1">
                        {parseFloat(formData.price).toFixed(2)} €
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                type="submit"
                variant="luxe"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                <Save className="w-5 h-5 mr-2" />
                {isLoading ? 'Wird gespeichert...' : 'Produkt erstellen'}
              </Button>
              <Link
                href="/admin/products"
                className="w-full inline-flex items-center justify-center h-11 rounded-md px-8 border border-luxe-gray hover:bg-luxe-gray/20 text-white transition-colors"
              >
                Abbrechen
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
