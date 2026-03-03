'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Trash2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import Link from 'next/link'
import { SubcategorySelect } from '@/components/admin/subcategory-select'
import { BrandSelect } from '@/components/admin/brand-select'

export default function EditProductPage({ params }: { params: { id: string } }) {
  const [influencers, setInfluencers] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [canSeePurchasePrices, setCanSeePurchasePrices] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setIsUploadingImage(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/admin/upload/product-image', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: 'Upload fehlgeschlagen', description: data.error || 'Bitte erneut versuchen.', variant: 'destructive' })
        return
      }
      if (data.url) {
        const next = formData.images.filter(Boolean).length ? [...formData.images] : ['']
        const firstEmpty = next.findIndex((u) => !u.trim())
        if (firstEmpty >= 0) next[firstEmpty] = data.url
        else next.push(data.url)
        setFormData({ ...formData, images: next })
        toast({ title: 'Bild hochgeladen', description: 'URL wurde eingetragen.' })
      }
    } finally {
      setIsUploadingImage(false)
    }
  }

  const [categories, setCategories] = useState<{ value: string; label: string }[]>([
    { value: 'bongs', label: 'Bongs' },
    { value: 'grinder', label: 'Grinder' },
    { value: 'papers', label: 'Papers' },
    { value: 'vaporizer', label: 'Vaporizer' },
    { value: 'zubehoer', label: 'Zubehör' },
    { value: 'influencer-drops', label: 'Influencer Drops' },
  ])

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    cost_price: '',
    images: [''] as string[],
    category: 'bongs',
    subcategory_slug: null as string | null,
    brand: '',
    asin: '',
    parent_asin: '',
    variation_theme: '',
    stock: '',
    is_adult_only: true,
    exempt_from_adult_fee: false,
    is_featured: false,
    is_active: true,
    influencer_id: null as string | null,
    supplier_id: null as string | null,
    supplier_sku: '',
    supplier_product_name: '',
    tags: '',
    discount_percent: '0',
    discount_until: '',
    reference_price_30d: '',
    is_new_override: false,
    on_sale: false,
    discount_text: '',
  })

  useEffect(() => {
    loadProduct()
    loadInfluencers()
    fetch('/api/admin/suppliers').then((res) => (res.ok ? res.json() : [])).then((data) => setSuppliers(Array.isArray(data) ? data : []))
    fetch('/api/admin/me').then((res) => (res.ok ? res.json() : { permissions: {} })).then((data: { permissions?: { canSeePurchasePrices?: boolean } }) => setCanSeePurchasePrices(data?.permissions?.canSeePurchasePrices !== false))
  }, [])
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data.map((c: { slug: string; name: string }) => ({ value: c.slug, label: c.name })))
        }
      })
      .catch(() => {})
  }, [])

  const loadProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      toast({
        title: 'Produkt nicht gefunden',
        variant: 'destructive',
      })
      router.push('/admin/products')
      return
    }

    setProduct(data)
    setFormData({
      name: data.name || '',
      slug: data.slug || '',
      description: data.description || '',
      price: data.price?.toString() || '0',
      cost_price: data.cost_price != null ? data.cost_price.toString() : '',
      images: Array.isArray(data.images) && data.images.length > 0
        ? data.images
        : data.image_url
          ? [data.image_url]
          : [''],
      category: data.category || 'bongs',
      subcategory_slug: data.subcategory_slug ?? null,
      brand: data.brand ?? '',
      asin: data.asin ?? '',
      parent_asin: data.parent_asin ?? '',
      variation_theme: data.variation_theme ?? '',
      stock: data.stock?.toString() || '0',
      is_adult_only: data.is_adult_only || false,
      exempt_from_adult_fee: data.exempt_from_adult_fee || false,
      is_featured: data.is_featured || false,
      is_active: data.is_active !== false,
      influencer_id: data.influencer_id || null,
      supplier_id: data.supplier_id || null,
      supplier_sku: data.supplier_sku ?? '',
      supplier_product_name: data.supplier_product_name ?? '',
      tags: data.tags?.join(', ') || '',
      discount_percent: data.discount_percent?.toString() || '0',
      discount_until: data.discount_until ? data.discount_until.slice(0, 10) : '',
      reference_price_30d: data.reference_price_30d != null ? data.reference_price_30d.toString() : '',
      is_new_override: Boolean(data.is_new_override),
      on_sale: Boolean(data.on_sale),
      discount_text: data.discount_text ?? '',
    })
  }

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
    const validImages = formData.images.filter(Boolean)
    if (validImages.length === 0) {
      toast({ title: 'Mindestens ein Produktbild angeben', variant: 'destructive' })
      return
    }
    setIsLoading(true)

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: parseFloat(formData.price),
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        image_url: validImages[0],
        images: validImages,
        category: formData.category,
        subcategory_slug: formData.subcategory_slug?.trim() || null,
        brand: formData.brand.trim() || null,
        asin: formData.asin.trim() ? formData.asin.trim().toUpperCase() : null,
        parent_asin: formData.parent_asin.trim() ? formData.parent_asin.trim().toUpperCase() : null,
        variation_theme: formData.variation_theme.trim() || null,
        stock: parseInt(formData.stock),
        supplier_sku: formData.supplier_sku?.trim() || null,
        supplier_product_name: formData.supplier_product_name?.trim() || null,
        is_adult_only: formData.is_adult_only,
        exempt_from_adult_fee: formData.exempt_from_adult_fee,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        influencer_id: formData.influencer_id || null,
        supplier_id: formData.supplier_id || null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        discount_percent: Math.min(100, Math.max(0, parseInt(formData.discount_percent) || 0)),
        discount_until: formData.discount_until || null,
        reference_price_30d: formData.reference_price_30d ? parseFloat(formData.reference_price_30d) : null,
        is_new_override: formData.is_new_override,
        on_sale: formData.on_sale,
        discount_text: formData.discount_text?.trim() || null,
      }

      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })
      const errData = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(errData.error || res.statusText)

      toast({
        title: 'Produkt aktualisiert',
        description: 'Die Änderungen wurden gespeichert (Audit-Log erstellt).',
      })

      router.push('/admin/products')
    } catch (error: any) {
      console.error('Update product error:', error)
      toast({
        title: 'Fehler beim Speichern',
        description: error.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bist du sicher, dass du dieses Produkt löschen möchtest?')) {
      return
    }

    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      toast({
        title: 'Produkt gelöscht',
        description: 'Das Produkt wurde entfernt.',
      })

      router.push('/admin/products')
    } catch (error: any) {
      console.error('Delete product error:', error)
      toast({
        title: 'Fehler beim Löschen',
        description: error.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-white">Laden...</p>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold text-white">Produkt bearbeiten</h1>
        </div>
        <Button
          onClick={handleDelete}
          variant="outline"
          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
        </Button>
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
                    className="bg-luxe-gray border-luxe-silver text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">
                    Beschreibung *
                  </Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full min-h-32 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="bg-luxe-gray border-luxe-silver text-white"
                      required
                    />
                  </div>
                  {canSeePurchasePrices && (
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
                      <p className="text-xs text-luxe-silver mt-1">
                        <Link href="/admin/margin" className="text-luxe-gold hover:underline">Kostenrechner</Link>
                      </p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock" className="text-white">
                      Lagerbestand *
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="bg-luxe-gray border-luxe-silver text-white"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier_id" className="text-white">
                      Lieferant (Dropshipping)
                    </Label>
                    <select
                      id="supplier_id"
                      value={formData.supplier_id ?? ''}
                      onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value || null })}
                      className="w-full px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white text-sm"
                    >
                      <option value="">— Keiner —</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {formData.supplier_id && (
                    <>
                      <div>
                        <Label htmlFor="supplier_sku" className="text-white">Supplier SKU</Label>
                        <Input
                          id="supplier_sku"
                          value={formData.supplier_sku ?? ''}
                          onChange={(e) => setFormData({ ...formData, supplier_sku: e.target.value })}
                          placeholder="Artikelnummer beim Lieferanten"
                          className="bg-luxe-gray border-luxe-silver text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="supplier_product_name" className="text-white">Supplier Produktname</Label>
                        <Input
                          id="supplier_product_name"
                          value={formData.supplier_product_name ?? ''}
                          onChange={(e) => setFormData({ ...formData, supplier_product_name: e.target.value })}
                          placeholder="Bezeichnung beim Lieferanten"
                          className="bg-luxe-gray border-luxe-silver text-white"
                        />
                      </div>
                    </>
                  )}
                  {formData.supplier_id && (formData.supplier_sku || formData.supplier_product_name) && (
                    <p className="text-xs text-luxe-silver col-span-2">
                      Beim Lieferanten: {formData.supplier_product_name || '—'} {formData.supplier_sku ? `· SKU: ${formData.supplier_sku}` : ''}
                      {canSeePurchasePrices && formData.cost_price ? ` · Einkaufspreis: ${parseFloat(formData.cost_price).toFixed(2)} €` : ''}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-luxe-gray mt-4">
                  <div>
                    <Label htmlFor="discount_percent" className="text-white">Rabatt (%)</Label>
                    <Input
                      id="discount_percent"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                      className="bg-luxe-gray border-luxe-silver text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount_until" className="text-white">Rabatt gültig bis</Label>
                    <Input
                      id="discount_until"
                      type="date"
                      value={formData.discount_until}
                      onChange={(e) => setFormData({ ...formData, discount_until: e.target.value })}
                      className="bg-luxe-gray border-luxe-silver text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="reference_price_30d" className="text-white">PAngV Referenzpreis (niedrigster Preis letzte 30 Tage) €</Label>
                    <Input
                      id="reference_price_30d"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Leer = kein Streichpreis"
                      value={formData.reference_price_30d}
                      onChange={(e) => setFormData({ ...formData, reference_price_30d: e.target.value })}
                      className="bg-luxe-gray border-luxe-silver text-white"
                    />
                    <p className="text-xs text-luxe-silver mt-1">Nur wenn gesetzt und ≥ Verkaufspreis wird ein Streichpreis angezeigt (PAngV).</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Produktbilder</CardTitle>
                <p className="text-sm text-luxe-silver">Mehrere Bild-URLs möglich. Das erste Bild ist das Hauptbild. URL eintragen oder Datei vom PC hochladen.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.images.map((url, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 space-y-1">
                      <Label className="text-white text-sm">
                        Bild {index + 1} {index === 0 && '(Hauptbild)'}
                      </Label>
                      <Input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          const next = [...formData.images]
                          next[index] = e.target.value
                          setFormData({ ...formData, images: next })
                        }}
                        placeholder="https://..."
                        className="bg-luxe-gray border-luxe-silver text-white"
                      />
                    </div>
                    <div className="pt-7">
                      <button
                        type="button"
                        onClick={() => {
                          const next = formData.images.filter((_, i) => i !== index)
                          if (next.length === 0) next.push('')
                          setFormData({ ...formData, images: next })
                        }}
                        className="p-2 rounded-md text-luxe-silver hover:text-red-400 hover:bg-luxe-gray transition-colors"
                        aria-label="Bild entfernen"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}
                    className="border-luxe-gray text-luxe-silver hover:bg-luxe-gray"
                  >
                    Weiteres Bild hinzufügen
                  </Button>
                  <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10 cursor-pointer disabled:opacity-50">
                    <Upload className="w-4 h-4" />
                    {isUploadingImage ? 'Wird hochgeladen…' : 'Vom PC hochladen'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="sr-only"
                      disabled={isUploadingImage}
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  {formData.images.filter(Boolean).map((url, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden bg-luxe-gray flex-shrink-0">
                      <img
                        src={url}
                        alt={`Vorschau ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96"%3E%3Crect fill="%232A2A2A"/%3E%3Ctext x="50%25" y="50%25" fill="%23888" font-size="10" text-anchor="middle" dy=".3em"%3E?%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
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
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Kategorie & Einordnung</CardTitle>
                <p className="text-sm text-luxe-silver mt-1">Wähle die passende Hauptkategorie und optional eine Unterkategorie. So finden Kunden das Produkt im Shop schneller.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-white">
                    Hauptkategorie *
                  </Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory_slug: null })}
                    className="w-full h-10 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <SubcategorySelect
                  parentCategory={formData.category}
                  value={formData.subcategory_slug}
                  onChange={(v) => setFormData({ ...formData, subcategory_slug: v })}
                  useAdminApi
                />

                <BrandSelect
                  value={formData.brand}
                  onChange={(v) => setFormData({ ...formData, brand: v })}
                />

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="asin" className="text-white">ASIN</Label>
                    <Input
                      id="asin"
                      value={formData.asin}
                      onChange={(e) => setFormData({ ...formData, asin: e.target.value.toUpperCase() })}
                      placeholder="z. B. B0XXXXXXXX"
                      maxLength={15}
                      className="bg-luxe-gray border-luxe-silver text-white font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="parent_asin" className="text-white">Parent-ASIN</Label>
                    <Input
                      id="parent_asin"
                      value={formData.parent_asin}
                      onChange={(e) => setFormData({ ...formData, parent_asin: e.target.value.toUpperCase() })}
                      placeholder="Nur bei Variationen (z. B. Farbe, Größe)"
                      maxLength={15}
                      className="bg-luxe-gray border-luxe-silver text-white font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="variation_theme" className="text-white">Variation Theme</Label>
                    <select
                      id="variation_theme"
                      value={formData.variation_theme}
                      onChange={(e) => setFormData({ ...formData, variation_theme: e.target.value })}
                      className="w-full h-10 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white"
                    >
                      <option value="">— Keine Variation —</option>
                      <option value="Color">Color (Farbe)</option>
                      <option value="Size">Size (Größe)</option>
                      <option value="SizeColor">SizeColor</option>
                      <option value="PackQuantity">PackQuantity (Packungsgröße)</option>
                    </select>
                  </div>
                  <p className="text-xs text-luxe-silver">Parent/Child-ASIN für Marktplatz: Parent gruppiert Varianten.</p>
                </div>

                <div>
                  <Label htmlFor="productType" className="text-white block mb-2">Produkttyp</Label>
                  <select
                    id="productType"
                    value={formData.influencer_id ?? '__eigenes__'}
                    onChange={(e) => setFormData({ ...formData, influencer_id: e.target.value === '__eigenes__' ? null : e.target.value })}
                    className="w-full h-10 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white"
                  >
                    <option value="__eigenes__">Eigenes Produkt</option>
                    <optgroup label="Influencer Produkte">
                      {influencers.map((inf) => (
                        <option key={inf.id} value={inf.id}>Influencer: {inf.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-xs text-luxe-silver mt-1">Wähle „Influencer Produkt“ für Kooperationen. Kategorie oben gilt für beide Typen.</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-luxe-gray">
                  <Label className="text-white block mb-2">Shop-Badges (manuell)</Label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_new_override}
                      onChange={(e) => setFormData({ ...formData, is_new_override: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-white">Als <strong>NEU</strong> anzeigen</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.on_sale}
                      onChange={(e) => setFormData({ ...formData, on_sale: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-white">Als <strong>SALE</strong> anzeigen</span>
                  </label>
                  {formData.on_sale && (
                    <div className="pl-8">
                      <Label htmlFor="discount_text_badge" className="text-luxe-silver text-xs">Sale-Badge-Text</Label>
                      <Input
                        id="discount_text_badge"
                        value={formData.discount_text}
                        onChange={(e) => setFormData({ ...formData, discount_text: e.target.value })}
                        placeholder="z. B. −20 % oder Oster-Angebot"
                        className="mt-1 bg-luxe-gray border-luxe-silver text-white text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-luxe-gray">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_adult_only}
                      onChange={(e) => setFormData({ ...formData, is_adult_only: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-white">18+ Produkt</span>
                  </label>

                  {formData.is_adult_only && (
                    <label className="flex items-center space-x-3 cursor-pointer pl-1">
                      <input
                        type="checkbox"
                        checked={formData.exempt_from_adult_fee}
                        onChange={(e) => setFormData({ ...formData, exempt_from_adult_fee: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-white">Von Altersprüfung ausgenommen</span>
                    </label>
                  )}
                  {formData.is_adult_only && formData.exempt_from_adult_fee && (
                    <p className="text-xs text-luxe-silver pl-7">
                      Keine DHL-Ident-Gebühr, kein has_adult_items – z.B. für Grinder oder Zubehör.
                    </p>
                  )}

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-white">Featured</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="text-white">Im Shop anzeigen</span>
                  </label>
                </div>
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
                {isLoading ? 'Wird gespeichert...' : 'Änderungen speichern'}
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
