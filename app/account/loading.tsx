export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <div className="h-10 w-56 bg-luxe-charcoal rounded animate-pulse mb-8" />
        <div className="flex gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-28 bg-luxe-charcoal rounded animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-luxe-charcoal rounded animate-pulse" />
      </div>
    </div>
  )
}
