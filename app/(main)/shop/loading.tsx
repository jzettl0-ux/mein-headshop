import { ProductCardSkeleton } from '@/components/shop/product-card-skeleton'

export default function ShopLoading() {
  return (
    <div className="min-h-screen bg-luxe-black">
      <div className="container-luxe py-6 sm:py-12">
        <div className="h-8 w-48 bg-luxe-charcoal rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
