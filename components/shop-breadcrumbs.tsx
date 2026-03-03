'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export type BreadcrumbItem = { label: string; href?: string }

export function ShopBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-luxe-silver mb-6">
      <Link href="/" className="hover:text-luxe-gold transition-colors">Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-4 h-4 text-luxe-gray" aria-hidden />
          {item.href ? (
            <Link href={item.href} className="hover:text-luxe-gold transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-white font-medium" aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
