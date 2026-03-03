export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe">
        <div className="h-8 w-64 bg-luxe-charcoal rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="h-12 w-full bg-luxe-charcoal rounded" />
            <div className="h-12 w-full bg-luxe-charcoal rounded" />
            <div className="h-32 bg-luxe-charcoal rounded" />
          </div>
          <div className="h-80 bg-luxe-charcoal rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
