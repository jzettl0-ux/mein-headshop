'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, ArrowLeft } from 'lucide-react'
import { useWishlistStore } from '@/store/wishlist'
import { ProductCard } from '@/components/shop/product-card'
import { Product } from '@/lib/types'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function WishlistPage() {
  const productIds = useWishlistStore((s) => s.productIds)
  const remove = useWishlistStore((s) => s.remove)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (productIds.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_active', true)
      if (cancelled) return
      if (error) {
        setProducts([])
        setLoading(false)
        return
      }
      setProducts((data as Product[]) || [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [productIds.length, productIds.join(',')])

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-luxe-silver hover:text-luxe-gold transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Shop
        </Link>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Heart className="w-9 h-9 text-red-500 fill-red-500" />
          Wunschliste
        </h1>
        <p className="text-luxe-silver mb-8">
          {productIds.length === 0
            ? 'Du hast noch keine Artikel auf der Wunschliste.'
            : `${productIds.length} ${productIds.length === 1 ? 'Artikel' : 'Artikel'} auf deiner Wunschliste.`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-luxe-charcoal rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-luxe-gray bg-luxe-charcoal/50 p-12 text-center">
            <Heart className="w-16 h-16 text-luxe-gray mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Wunschliste leer</p>
            <p className="text-luxe-silver text-sm mb-6 max-w-md mx-auto">
              Füge Produkte über das Herz-Symbol auf der Produktkarte oder auf der Produktseite hinzu.
            </p>
            <Button asChild variant="outline" className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10">
              <Link href="/shop">Zum Shop</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
