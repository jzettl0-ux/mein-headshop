'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Camera, Upload, Loader2, Heart, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { getCurrentUser } from '@/lib/supabase/auth'

interface Hotspot {
  hotspot_id: string
  product_id: string
  x_coordinate: number
  y_coordinate: number
  product: { name: string; slug: string; price: number } | null
}

interface UGCPost {
  post_id: string
  image_url: string
  caption: string | null
  likes_count: number
  created_at: string
  hotspots: Hotspot[]
}

export default function RateMySetupPage() {
  const [posts, setPosts] = useState<UGCPost[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/ugc/posts')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    getCurrentUser().then((u) => setUser(u ?? null))
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f && ['image/jpeg', 'image/png', 'image/webp'].includes(f.type) && f.size <= 5 * 1024 * 1024) {
      setFile(f)
      setPreview(URL.createObjectURL(f))
    } else if (f) {
      toast({ title: 'Nur JPEG, PNG oder WebP, max. 5 MB.', variant: 'destructive' })
    }
    e.target.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: 'Bitte einloggen.', variant: 'destructive' })
      return
    }
    if (!file) {
      toast({ title: 'Bild wählen.', variant: 'destructive' })
      return
    }
    setUploading(true)
    try {
      const form = new FormData()
      form.set('file', file)
      if (caption.trim()) form.set('caption', caption.trim())
      const res = await fetch('/api/ugc/upload', { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Fehler')
      toast({ title: 'Setup gesendet!', description: 'Wir prüfen es und veröffentlichen es bald.' })
      setFile(null)
      setCaption('')
      setPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      toast({
        title: 'Fehler',
        description: err instanceof Error ? err.message : 'Bitte versuche es erneut.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen bg-luxe-black py-12 sm:py-16">
      <div className="container-luxe px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-gradient-flow">Rate my Setup</span>
          </h1>
          <p className="text-luxe-silver text-lg">
            Teile dein Setup mit der Community. Zeig uns deine Lieblingskombi – Bong, Grinder, Vaporizer und mehr.
          </p>
        </motion.div>

        {user ? (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <div className="rounded-2xl border border-luxe-gray bg-luxe-charcoal/80 p-6">
              <h2 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Camera className="w-5 h-5 text-luxe-gold" />
                Dein Setup teilen
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {preview ? (
                    <div className="relative rounded-lg overflow-hidden bg-luxe-gray aspect-video max-h-64">
                      <img src={preview} alt="Vorschau" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null)
                          setPreview(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="absolute top-2 right-2 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-lg border-2 border-dashed border-luxe-gray hover:border-luxe-gold/50 py-12 flex flex-col items-center gap-2 text-luxe-silver hover:text-luxe-gold/80 transition-colors"
                    >
                      <Upload className="w-10 h-10" />
                      <span>Bild auswählen (JPEG, PNG, WebP, max. 5 MB)</span>
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor="caption" className="block text-white text-sm font-medium mb-1">
                    Beschreibung (optional)
                  </label>
                  <textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value.slice(0, 500))}
                    placeholder="z. B. Mein neues Glas-Setup mit Grinder und Papers"
                    rows={2}
                    className="w-full rounded-lg border border-luxe-gray bg-luxe-black px-4 py-3 text-white placeholder:text-luxe-silver/60 focus:border-luxe-gold focus:outline-none resize-none"
                  />
                </div>
                <Button type="submit" variant="luxe" disabled={!file || uploading} className="w-full">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? ' Wird hochgeladen…' : ' Setup einreichen'}
                </Button>
                <p className="text-xs text-luxe-silver">
                  Nach Prüfung erscheint dein Setup in der Galerie. Unangemessene Inhalte werden nicht veröffentlicht.
                </p>
              </form>
            </div>
          </motion.section>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center max-w-md mx-auto mb-12 p-6 rounded-2xl border border-luxe-gray bg-luxe-charcoal/60"
          >
            <p className="text-luxe-silver mb-4">Einloggen, um dein Setup zu teilen.</p>
            <Link href="/auth">
              <Button variant="luxe">Anmelden</Button>
            </Link>
          </motion.div>
        )}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-white mb-6">Community-Setups</h2>
          {loading ? (
            <div className="text-center py-16 text-luxe-silver">Laden…</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-luxe-gray bg-luxe-charcoal/40">
              <Camera className="w-16 h-16 text-luxe-gray mx-auto mb-4" />
              <p className="text-luxe-silver">Noch keine Setups – sei der Erste!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => (
                <motion.article
                  key={post.post_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="rounded-2xl border border-luxe-gray bg-luxe-charcoal/80 overflow-hidden"
                >
                  <div className="relative aspect-square bg-luxe-black">
                    <img src={post.image_url} alt={post.caption || 'Setup'} className="w-full h-full object-cover" />
                    {post.hotspots.length > 0 &&
                      post.hotspots.map((h) => (
                        <Link
                          key={h.hotspot_id}
                          href={h.product ? `/shop/${h.product.slug}` : '#'}
                          className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full bg-luxe-gold/90 flex items-center justify-center text-luxe-black hover:scale-110 transition-transform"
                          style={{ left: `${h.x_coordinate}%`, top: `${h.y_coordinate}%` }}
                          title={h.product?.name}
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </Link>
                      ))}
                  </div>
                  <div className="p-4">
                    {post.caption && <p className="text-white text-sm mb-2 line-clamp-2">{post.caption}</p>}
                    <div className="flex items-center justify-between text-luxe-silver text-xs">
                      <span>{formatDate(post.created_at)}</span>
                      {post.likes_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5" /> {post.likes_count}
                        </span>
                      )}
                    </div>
                    {post.hotspots.some((h) => h.product) && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {post.hotspots
                          .filter((h) => h.product)
                          .map((h) => (
                            <Link
                              key={h.hotspot_id}
                              href={`/shop/${h.product!.slug}`}
                              className="text-xs px-2 py-1 rounded bg-luxe-gold/20 text-luxe-gold hover:bg-luxe-gold/30"
                            >
                              {h.product!.name} – {h.product!.price.toFixed(2)} €
                            </Link>
                          ))}
                      </div>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}
