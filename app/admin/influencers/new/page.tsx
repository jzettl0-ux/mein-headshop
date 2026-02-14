'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase, uploadInfluencerImage } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import Link from 'next/link'

const PRESET_COLORS = [
  { name: 'Neon-Grün', value: '#39FF14' },
  { name: 'Gold', value: '#D4AF37' },
  { name: 'Orange', value: '#FF6B35' },
  { name: 'Pink', value: '#FF1493' },
  { name: 'Cyan', value: '#00FFFF' },
  { name: 'Lila', value: '#9D4EDD' },
]

export default function NewInfluencerPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [uploadAvatarLoading, setUploadAvatarLoading] = useState(false)
  const [uploadBannerLoading, setUploadBannerLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const uploadTempId = useMemo(() => 'new-' + crypto.randomUUID().slice(0, 8), [])

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    bio: '',
    avatar_url: '',
    banner_url: '',
    accent_color: '#39FF14',
    instagram: '',
    tiktok: '',
    youtube: '',
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const influencerData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        bio: formData.bio,
        avatar_url: formData.avatar_url,
        banner_url: formData.banner_url,
        accent_color: formData.accent_color,
        social_links: {
          instagram: formData.instagram || undefined,
          tiktok: formData.tiktok || undefined,
          youtube: formData.youtube || undefined,
        },
        is_active: formData.is_active,
      }

      const { error } = await supabase
        .from('influencers')
        .insert(influencerData)

      if (error) throw error

      toast({
        title: 'Influencer erstellt',
        description: `${formData.name} wurde erfolgreich hinzugefügt.`,
      })

      router.push('/admin/influencers')
    } catch (error: any) {
      console.error('Create influencer error:', error)
      toast({
        title: 'Fehler beim Erstellen',
        description: error.message || 'Bitte versuche es erneut.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/influencers"
          className="inline-flex items-center text-luxe-silver hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Zurück zu Influencern
        </Link>
        <h1 className="text-3xl font-bold text-white">Neuer Influencer</h1>
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
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Max Grün"
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
                    URL: /influencer/{formData.slug || generateSlug(formData.name || 'name')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-white">
                    Bio/Beschreibung *
                  </Label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Kurze Beschreibung des Influencers..."
                    className="w-full min-h-24 px-3 py-2 bg-luxe-gray border border-luxe-silver rounded-md text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Bilder</CardTitle>
                <p className="text-sm text-luxe-silver">URL eingeben oder Bilddatei vom PC hochladen.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="avatar_url" className="text-white">Avatar *</Label>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <Input
                      id="avatar_url"
                      type="url"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                      placeholder="https://… oder Datei hochladen"
                      className="bg-luxe-gray border-luxe-silver text-white flex-1 min-w-[200px]"
                      required
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadAvatarLoading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setUploadAvatarLoading(true)
                          try {
                            const url = await uploadInfluencerImage(file, uploadTempId, 'avatar')
                            setFormData((prev) => ({ ...prev, avatar_url: url }))
                            toast({ title: 'Avatar hochgeladen', description: 'Bild wurde gespeichert.' })
                          } catch (err: any) {
                            toast({ title: 'Upload fehlgeschlagen', description: (err as Error).message || 'Bitte erneut versuchen.', variant: 'destructive' })
                          } finally {
                            setUploadAvatarLoading(false)
                            e.target.value = ''
                          }
                        }}
                      />
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray border border-luxe-silver text-white hover:bg-luxe-gray/80 text-sm">
                        {uploadAvatarLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploadAvatarLoading ? 'Lädt…' : 'Datei wählen'}
                      </span>
                    </label>
                  </div>
                  {formData.avatar_url && (
                    <div className="mt-3 w-24 h-24 rounded-full overflow-hidden">
                      <img src={formData.avatar_url} alt="Avatar Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="banner_url" className="text-white">Banner *</Label>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <Input
                      id="banner_url"
                      type="url"
                      value={formData.banner_url}
                      onChange={(e) => setFormData({ ...formData, banner_url: e.target.value })}
                      placeholder="https://… oder Datei hochladen"
                      className="bg-luxe-gray border-luxe-silver text-white flex-1 min-w-[200px]"
                      required
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadBannerLoading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setUploadBannerLoading(true)
                          try {
                            const url = await uploadInfluencerImage(file, uploadTempId, 'banner')
                            setFormData((prev) => ({ ...prev, banner_url: url }))
                            toast({ title: 'Banner hochgeladen', description: 'Bild wurde gespeichert.' })
                          } catch (err: any) {
                            toast({ title: 'Upload fehlgeschlagen', description: (err as Error).message || 'Bitte erneut versuchen.', variant: 'destructive' })
                          } finally {
                            setUploadBannerLoading(false)
                            e.target.value = ''
                          }
                        }}
                      />
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-luxe-gray border border-luxe-silver text-white hover:bg-luxe-gray/80 text-sm">
                        {uploadBannerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploadBannerLoading ? 'Lädt…' : 'Datei wählen'}
                      </span>
                    </label>
                  </div>
                  {formData.banner_url && (
                    <div className="mt-3 aspect-[3/1] rounded-lg overflow-hidden">
                      <img src={formData.banner_url} alt="Banner Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Social Media</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="instagram" className="text-white">
                    Instagram
                  </Label>
                  <Input
                    id="instagram"
                    type="url"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="https://instagram.com/username"
                    className="bg-luxe-gray border-luxe-silver text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="tiktok" className="text-white">
                    TikTok
                  </Label>
                  <Input
                    id="tiktok"
                    type="url"
                    value={formData.tiktok}
                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                    placeholder="https://tiktok.com/@username"
                    className="bg-luxe-gray border-luxe-silver text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="youtube" className="text-white">
                    YouTube
                  </Label>
                  <Input
                    id="youtube"
                    type="url"
                    value={formData.youtube}
                    onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                    placeholder="https://youtube.com/@username"
                    className="bg-luxe-gray border-luxe-silver text-white"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Branding */}
            <Card className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <CardTitle className="text-white">Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white mb-3 block">
                    Accent-Color *
                  </Label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, accent_color: color.value })}
                        className={`h-12 rounded-lg border-2 transition-all ${
                          formData.accent_color === color.value
                            ? 'border-white scale-105'
                            : 'border-luxe-gray hover:border-luxe-silver'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-full h-12 bg-luxe-gray border-luxe-silver cursor-pointer"
                  />
                  <p className="text-xs text-luxe-silver mt-2">
                    Ausgewählt: {formData.accent_color}
                  </p>
                </div>

                <div className="pt-4 border-t border-luxe-gray">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <div>
                      <span className="text-white font-medium">Aktiv</span>
                      <p className="text-xs text-luxe-silver">
                        Influencer ist öffentlich sichtbar
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
              <CardContent>
                <div className="text-center space-y-4">
                  {formData.avatar_url && (
                    <div className="w-20 h-20 rounded-full mx-auto overflow-hidden">
                      <img
                        src={formData.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {formData.name && (
                    <div>
                      <p className="text-white font-bold text-lg">{formData.name}</p>
                      {formData.bio && (
                        <p className="text-luxe-silver text-sm mt-1 line-clamp-2">
                          {formData.bio}
                        </p>
                      )}
                    </div>
                  )}
                  <div
                    className="w-12 h-12 rounded-full mx-auto"
                    style={{ backgroundColor: formData.accent_color }}
                  />
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
                {isLoading ? 'Wird gespeichert...' : 'Influencer erstellen'}
              </Button>
              <Link
                href="/admin/influencers"
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
