export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-luxe-black py-12 animate-pulse">
      <div className="container-luxe">
        <div className="h-4 w-64 bg-luxe-charcoal rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-luxe-charcoal rounded-2xl" />
          <div className="space-y-4">
            <div className="h-10 w-3/4 bg-luxe-charcoal rounded" />
            <div className="h-6 w-24 bg-luxe-charcoal rounded" />
            <div className="h-8 w-32 bg-luxe-charcoal rounded" />
            <div className="h-4 w-full bg-luxe-charcoal rounded" />
            <div className="h-4 w-full bg-luxe-charcoal rounded" />
            <div className="h-14 w-full bg-luxe-charcoal rounded mt-8" />
          </div>
        </div>
      </div>
    </div>
  )
}
