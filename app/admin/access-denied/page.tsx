'use client'

import Link from 'next/link'
import { ShieldX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminAccessDeniedPage() {
  return (
    <div className="admin-area min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--luxe-gray)] text-[var(--luxe-silver)] mb-6">
          <ShieldX className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--luxe-charcoal)] mb-2">
          Zugriff verweigert
        </h1>
        <p className="text-[var(--luxe-silver)] text-sm leading-relaxed mb-8">
          Du hast keine Berechtigung für diesen Bereich. Bei Fragen wende dich an den Inhaber oder einen Administrator.
        </p>
        <Link href="/admin">
          <Button className="bg-[var(--luxe-primary)] text-white hover:opacity-90 border-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zum Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
