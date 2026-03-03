'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Asset = {
  id: string
  title: string
  category: string
  format_info: string | null
  width: number | null
  height: number | null
  created_at: string
  url: string
  download_url: string
}

const CATEGORIES = [
  { value: '', label: 'Alle' },
  { value: 'product_photos', label: 'Produktfotos' },
  { value: 'banner', label: 'Banner' },
  { value: 'logos', label: 'Logos' },
] as const

export default function InfluencerAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = new URLSearchParams()
    if (category) q.set('category', category)
    fetch(`/api/influencer/assets?${q.toString()}`)
      .then((r) => (r.ok ? r.json() : { assets: [] }))
      .then((d) => setAssets(d.assets ?? []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false))
  }, [category])

  const handleDownload = (asset: Asset) => {
    const a = document.createElement('a')
    a.href = asset.download_url
    a.download = asset.title.replace(/[^a-zA-Z0-9-_]/g, '_') + (asset.download_url.split('.').pop()?.slice(0, 4) || '')
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Mediathek</h1>
        <p className="text-stone-500 mt-1">Bilder und Assets für deine Kanäle herunterladen. Alle Assets werden mit Shop-Wasserzeichen bereitgestellt.</p>
      </div>

      <Card className="border-stone-200 bg-white shadow-sm">
        <CardHeader className="border-b border-stone-100">
          <CardTitle className="text-base font-semibold text-stone-900">Filter</CardTitle>
          <CardDescription className="text-stone-500">
            Nach Kategorie filtern
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  category === c.value
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-stone-300" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-stone-500">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm">Keine Assets in dieser Kategorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {assets.map((asset, i) => (
                  <motion.div
                    key={asset.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className="group relative rounded-xl overflow-hidden border border-stone-200 bg-stone-50/50"
                  >
                    <div className="aspect-square relative bg-stone-100">
                      <img
                        src={asset.url}
                        alt={asset.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/40 transition-colors flex items-center justify-center">
                        <motion.button
                          initial={{ opacity: 0 }}
                          whileHover={{ scale: 1.05 }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center w-12 h-12 rounded-full bg-white text-stone-900 shadow-lg"
                          onClick={() => handleDownload(asset)}
                          aria-label="Download"
                        >
                          <Download className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="p-3 border-t border-stone-100">
                      <p className="text-sm font-medium text-stone-900 truncate">{asset.title}</p>
                      {asset.format_info && (
                        <p className="text-xs text-stone-500 mt-0.5">{asset.format_info}</p>
                      )}
                      {asset.width != null && asset.height != null && (
                        <p className="text-xs text-stone-400 mt-0.5">
                          {asset.width} × {asset.height} px
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
