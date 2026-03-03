'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRecentlyViewed, type RecentlyViewedItem } from '@/lib/recently-viewed'

export function RecentlyViewed() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])

  useEffect(() => {
    setItems(getRecentlyViewed())
  }, [])

  if (items.length === 0) return null

  return (
    <section className="py-8 border-t border-luxe-gray">
      <h2 className="text-lg font-semibold text-white mb-4">Kürzlich angesehen</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/shop/${item.slug}`}
            className="flex-shrink-0 w-28 group"
          >
            <div className="aspect-square rounded-xl bg-luxe-charcoal border border-luxe-gray overflow-hidden mb-2">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-luxe-silver/50 text-xs">
                  Kein Bild
                </div>
              )}
            </div>
            <p className="text-xs text-luxe-silver line-clamp-2 group-hover:text-luxe-gold transition-colors">
              {item.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
