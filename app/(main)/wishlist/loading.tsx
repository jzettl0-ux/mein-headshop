import { ProductCardSkeleton } from '@/components/shop/product-card-skeleton'

export default function WishlistLoading() {
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe">
        <div className="h-8 w-48 bg-luxe-charcoal rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
