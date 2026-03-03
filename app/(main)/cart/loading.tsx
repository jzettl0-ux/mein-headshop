export default function CartLoading() {
  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-luxe-charcoal" />
        <div className="h-6 w-48 bg-luxe-charcoal rounded" />
        <div className="h-4 w-64 bg-luxe-charcoal rounded" />
      </div>
    </div>
  )
}
