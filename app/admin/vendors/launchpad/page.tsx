'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Rocket, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Enrollment = {
  enrollment_id: string
  product_id: string
  product_name: string
  product_slug: string | null
  program_start_date: string
  program_end_date: string
  exclusive_until: string | null
  search_boost_multiplier: number
  status: string
  created_at: string
}

export default function AdminLaunchpadPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/launchpad-enrollments')
      .then((r) => (r.ok ? r.json() : { enrollments: [] }))
      .then((d) => setEnrollments(d.enrollments ?? []))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Rocket className="w-6 h-6 text-luxe-gold" />
          Launchpad Accelerator
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Neue Marken-Boost, Exklusivität – 90 Tage Programm, Search-Boost.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : enrollments.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Enrollments. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">vendor_programs.launchpad_enrollments</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Launchpad Enrollments</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{enrollments.length} Produkte</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {enrollments.map((e) => (
                <li key={e.enrollment_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <Link href={e.product_slug ? `/admin/products/${e.product_id}/edit` : '#'} className="text-luxe-gold hover:underline font-medium">
                    {e.product_name || e.product_id}
                  </Link>
                  <span className="text-luxe-silver text-xs">
                    {e.status} · bis {new Date(e.program_end_date).toLocaleDateString('de-DE')} · Boost {e.search_boost_multiplier}x
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
