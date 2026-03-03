export function ProductCardSkeleton() {
  return (
    <div className="h-full flex flex-col rounded-2xl overflow-hidden bg-luxe-charcoal border border-luxe-gray animate-pulse">
      <div className="aspect-square bg-luxe-gray" />
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="h-3 w-1/3 bg-luxe-gray rounded" />
        <div className="h-5 w-full bg-luxe-gray rounded" />
        <div className="h-4 w-full bg-luxe-gray rounded" />
        <div className="h-4 w-2/3 bg-luxe-gray rounded mt-2" />
        <div className="flex justify-between items-center mt-4">
          <div className="h-8 w-20 bg-luxe-gray rounded" />
          <div className="h-4 w-16 bg-luxe-gray rounded" />
        </div>
      </div>
    </div>
  )
}
