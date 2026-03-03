'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image as ImageIcon,
  LayoutGrid,
  Square,
  Smartphone,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Loader2,
  GripVertical,
} from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Asset = {
  id: string
  title: string
  category: string
  visibility: string
  storage_path: string
  format_info: string | null
  width: number | null
  height: number | null
  created_at: string
  updated_at: string
  url: string
}

type ViewMode = 'feed' | 'story' | 'grid'

export default function AdminAssetsPreviewPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('feed')
  const [gridPosition, setGridPosition] = useState<number | null>(0)
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/assets')
      .then((r) => (r.ok ? r.json() : { assets: [] }))
      .then((d) => setAssets(d.assets ?? []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false))
  }, [])

  const handleDragOver = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSlot(slotIndex)
  }

  const handleDragLeave = () => setDragOverSlot(null)

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    setDragOverSlot(null)
    setGridPosition(slotIndex)
  }

  const handleSlotClick = (slotIndex: number) => {
    if (selectedAsset) setGridPosition(slotIndex)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Social Media Mockup Center</h1>
          <p className="text-luxe-silver mt-1">
            Assets in Instagram-Feed, Story und Raster-Vorschau anzeigen
          </p>
        </div>
        <Link href="/admin/assets">
          <Button variant="admin-outline">
            <ImageIcon className="w-4 h-4 mr-2" />
            Zur Mediathek
          </Button>
        </Link>
      </div>

      {/* Asset-Auswahl */}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-luxe-gold" />
            Asset auswählen
          </CardTitle>
          <CardDescription className="text-luxe-silver">
            Wähle ein Bild aus der Mediathek (wassergezeichnete Version) für die Mockups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-luxe-gold animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <p className="text-luxe-silver py-8 text-center">
              Noch keine Assets. Bitte zuerst in der{' '}
              <Link href="/admin/assets" className="text-luxe-gold hover:underline">Mediathek</Link> hochladen.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAsset(asset)}
                  className={cn(
                    'rounded-xl border-2 overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-luxe-gold focus:ring-offset-2 focus:ring-offset-luxe-charcoal',
                    selectedAsset?.id === asset.id
                      ? 'border-luxe-gold ring-2 ring-luxe-gold/50'
                      : 'border-luxe-gray hover:border-luxe-silver'
                  )}
                >
                  <div className="aspect-square bg-luxe-black">
                    <img
                      src={asset.url}
                      alt={asset.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-luxe-silver truncate px-1 py-1 bg-luxe-charcoal">{asset.title}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAsset && (
        <>
          {/* Ansicht umschalten */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'feed' as const, label: 'Instagram Feed', icon: Square },
              { id: 'story' as const, label: 'Instagram Story', icon: Smartphone },
              { id: 'grid' as const, label: 'Feed-Raster (3×3)', icon: LayoutGrid },
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={viewMode === id ? 'luxe' : 'outline'}
                className={viewMode === id ? '' : 'border-luxe-gray text-luxe-silver hover:text-white'}
                onClick={() => setViewMode(id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'feed' && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-luxe-charcoal border-luxe-gray">
                  <CardHeader>
                    <CardTitle className="text-white">Feed-Mockup</CardTitle>
                    <CardDescription className="text-luxe-silver">
                      So wirkt das Asset als quadratischer Feed-Post
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <FeedMockup asset={selectedAsset} />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {viewMode === 'story' && (
              <motion.div
                key="story"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-luxe-charcoal border-luxe-gray">
                  <CardHeader>
                    <CardTitle className="text-white">Story-Mockup</CardTitle>
                    <CardDescription className="text-luxe-silver">
                      So wirkt das Asset im 9:16 Story-Format
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <StoryMockup asset={selectedAsset} />
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {viewMode === 'grid' && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-luxe-charcoal border-luxe-gray">
                  <CardHeader>
                    <CardTitle className="text-white">Feed-Raster (3×3)</CardTitle>
                    <CardDescription className="text-luxe-silver">
                      Ziehe das ausgewählte Asset in eine Position, um es im Gesamtbild des Feeds zu prüfen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <GridSimulator
                      selectedAsset={selectedAsset}
                      gridPosition={gridPosition}
                      dragOverSlot={dragOverSlot}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onSlotClick={handleSlotClick}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {!selectedAsset && assets.length > 0 && (
        <p className="text-luxe-silver text-center py-8">Wähle oben ein Asset für die Mockups.</p>
      )}
    </div>
  )
}

function FeedMockup({ asset }: { asset: Asset }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full max-w-[320px] border border-stone-200">
      {/* Header wie Instagram */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 via-pink-500 to-purple-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-stone-900">dein_shop</span>
        </div>
        <button type="button" className="p-1.5 rounded-full hover:bg-stone-100 text-stone-600" aria-label="Mehr">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      {/* Quadratisches Bild */}
      <div className="aspect-square bg-stone-100">
        <img
          src={asset.url}
          alt={asset.title}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Aktionen */}
      <div className="px-3 py-2.5 space-y-2">
        <div className="flex items-center gap-4">
          <button type="button" className="flex items-center gap-1.5 text-stone-900" aria-label="Gefällt mir">
            <Heart className="w-6 h-6 fill-red-500 text-red-500" />
          </button>
          <button type="button" className="text-stone-900" aria-label="Kommentieren">
            <MessageCircle className="w-6 h-6" />
          </button>
        </div>
        <p className="text-sm text-stone-600">
          <span className="font-semibold text-stone-900">dein_shop</span>{' '}
          <span className="text-stone-500">Produktshooting für euch ✨</span>
        </p>
      </div>
    </div>
  )
}

function StoryMockup({ asset }: { asset: Asset }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200">
      <div
        className="relative overflow-hidden"
        style={{ width: 180, aspectRatio: '9/16' }}
      >
        <img
          src={asset.url}
          alt={asset.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Story-UI: Profil oben links */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full border-2 border-white bg-gradient-to-br from-amber-400 to-pink-500 flex-shrink-0" />
            <span className="text-white text-xs font-semibold drop-shadow-md">dein_shop</span>
          </div>
          <span className="text-white/90 text-xs">•••</span>
        </div>
        {/* Nachricht senden unten */}
        <div className="absolute bottom-6 left-4 right-4">
          <div className="flex items-center gap-2 rounded-full bg-white/20 backdrop-blur px-3 py-2 border border-white/30">
            <span className="text-white text-xs flex-1">Nachricht senden</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function GridSimulator({
  selectedAsset,
  gridPosition,
  dragOverSlot,
  onDragOver,
  onDragLeave,
  onDrop,
  onSlotClick,
}: {
  selectedAsset: Asset
  gridPosition: number | null
  dragOverSlot: number | null
  onDragOver: (e: React.DragEvent, slot: number) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, slot: number) => void
  onSlotClick: (slot: number) => void
}) {
  const size = 3
  const slots = size * size

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Drag-Source: ausgewähltes Asset zum Ziehen */}
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/asset-id', selectedAsset.id)
          e.dataTransfer.effectAllowed = 'move'
        }}
        className="flex items-center gap-2 rounded-xl border-2 border-dashed border-luxe-gold bg-luxe-charcoal p-3 cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5 text-luxe-gold shrink-0" />
        <img
          src={selectedAsset.url}
          alt={selectedAsset.title}
          className="w-14 h-14 rounded-lg object-cover"
        />
        <span className="text-luxe-silver text-sm">Ziehen und auf ein Kästchen ablegen</span>
      </div>

      <div
        className="inline-grid gap-0.5 bg-stone-800 p-0.5 rounded-xl overflow-hidden shadow-lg"
        style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
      >
        {Array.from({ length: slots }, (_, i) => {
          const isSelectedSlot = gridPosition === i
          const showAsset = isSelectedSlot
          const isDropTarget = dragOverSlot === i
          return (
            <div
              key={i}
              onDragOver={(e) => onDragOver(e, i)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, i)}
              onClick={() => onSlotClick(i)}
              className={cn(
                'w-28 h-28 sm:w-32 sm:h-32 bg-stone-700 rounded-sm cursor-pointer transition-all flex items-center justify-center overflow-hidden',
                isDropTarget && 'ring-2 ring-luxe-gold bg-stone-600',
                showAsset && 'ring-2 ring-luxe-gold ring-offset-2 ring-offset-stone-800'
              )}
            >
              {showAsset ? (
                <img
                  src={selectedAsset.url}
                  alt={selectedAsset.title}
                  className="w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <span className="text-stone-500 text-xs flex items-center gap-1 text-center px-1">
                  <GripVertical className="w-4 h-4 shrink-0" />
                  Hier ablegen
                </span>
              )}
            </div>
          )
        })}
      </div>
      <p className="text-luxe-silver text-sm text-center max-w-md">
        Klicke auf ein Kästchen oder ziehe das Asset oben in eine Position, um es im Feed-Raster zu sehen.
      </p>
    </div>
  )
}
