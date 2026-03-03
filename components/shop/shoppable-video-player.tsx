'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface ShoppableVideo {
  id: string
  title: string
  description?: string | null
  url: string | null
  duration_seconds?: number | null
}

interface ShoppableVideoPlayerProps {
  productId: string
}

export function ShoppableVideoPlayer({ productId }: ShoppableVideoPlayerProps) {
  const [videos, setVideos] = useState<ShoppableVideo[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [markers, setMarkers] = useState<{ timestamp_seconds: number; product_id: string; label?: string; products: { name: string; slug: string } }[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    fetch(`/api/shoppable-videos?product_id=${encodeURIComponent(productId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch(() => setVideos([]))
  }, [productId])

  const current = videos[currentIndex]
  const videoId = current?.id

  useEffect(() => {
    if (!videoId) {
      setMarkers([])
      return
    }
    fetch(`/api/shoppable-videos/${videoId}/markers`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMarkers(Array.isArray(data) ? data : []))
      .catch(() => setMarkers([]))
  }, [videoId])

  const handleTimeUpdate = () => {
    const t = videoRef.current?.currentTime ?? 0
  }

  if (videos.length === 0) return null

  return (
    <div className="rounded-xl overflow-hidden bg-luxe-charcoal border border-luxe-gray">
      <div className="relative aspect-video bg-black">
        {current?.url && (
          <video
            ref={videoRef}
            src={current.url}
            className="w-full h-full object-contain"
            controls
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
          />
        )}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-2">
          {markers.map((m) => (
            <Link
              key={m.product_id}
              href={`/shop/${m.products?.slug}`}
              className="px-3 py-1.5 rounded-lg bg-luxe-gold/90 text-luxe-black text-sm font-medium hover:bg-luxe-gold transition-colors"
            >
              {m.label || m.products?.name || 'Produkt'}
            </Link>
          ))}
        </div>
      </div>
      <div className="p-4">
        <p className="font-medium text-white">{current?.title}</p>
        {current?.description && (
          <p className="text-sm text-luxe-silver mt-1">{current.description}</p>
        )}
        {videos.length > 1 && (
          <div className="flex gap-2 mt-3">
            {videos.map((v, i) => (
              <button
                key={v.id}
                onClick={() => { setCurrentIndex(i); setPlaying(false) }}
                className={`px-3 py-1 rounded text-sm ${i === currentIndex ? 'bg-luxe-gold text-luxe-black' : 'bg-luxe-gray text-luxe-silver hover:bg-luxe-gray/80'}`}
              >
                {v.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
