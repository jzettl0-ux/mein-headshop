'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FileText, Loader2, Pencil, ExternalLink, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const SLUG_LABELS: Record<string, string> = {
  impressum: 'Impressum',
  privacy: 'Datenschutzerklärung',
  terms: 'AGB',
  returns: 'Widerrufsbelehrung',
}

const SLUG_LINKS: Record<string, string> = {
  impressum: '/impressum',
  privacy: '/privacy',
  terms: '/terms',
  returns: '/returns',
}

type LegalItem = {
  slug: string
  title: string
  has_content: boolean
  updated_at: string | null
}

export default function AdminLegalPage() {
  const [list, setList] = useState<LegalItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/legal')
      .then((res) => (res.ok ? res.json() : []))
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="w-7 h-7 text-luxe-gold" />
          Rechtstexte
        </h1>
        <p className="text-luxe-silver mt-1">
          Impressum, Datenschutz, AGB und Widerrufsbelehrung im Shop anpassen. Wenn ein Text leer ist, wird die eingebaute Muster-Version angezeigt.
        </p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Seiten</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-luxe-gray">
            {(list.length ? list : Object.entries(SLUG_LABELS).map(([slug, title]) => ({ slug, title, has_content: false, updated_at: null }))).map(
              (item) => (
                <li key={item.slug} className="py-4 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{SLUG_LABELS[item.slug] ?? item.title}</span>
                    {item.has_content && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Eigenes
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="border-luxe-gold text-luxe-gold hover:bg-luxe-gold/10" asChild>
                      <Link href={`/admin/legal/${item.slug}`}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Bearbeiten
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-luxe-silver" asChild>
                      <a href={SLUG_LINKS[item.slug]} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Ansehen
                      </a>
                    </Button>
                  </div>
                </li>
              )
            )}
          </ul>
        </CardContent>
      </Card>

      <p className="text-sm text-luxe-silver/80">
        Platzhalter im Inhalt: <code className="bg-luxe-black px-1 rounded">{'{{company_name}}'}</code>,{' '}
        <code className="bg-luxe-black px-1 rounded">{'{{company_address}}'}</code>,{' '}
        <code className="bg-luxe-black px-1 rounded">{'{{company_postal_code}}'}</code>,{' '}
        <code className="bg-luxe-black px-1 rounded">{'{{company_city}}'}</code>,{' '}
        <code className="bg-luxe-black px-1 rounded">{'{{company_email}}'}</code>,{' '}
        <code className="bg-luxe-black px-1 rounded">{'{{represented_by}}'}</code>,{' '}
        <code className="bg-luxe-black px-1 rounded">{'{{company_address_full}}'}</code>
      </p>
    </div>
  )
}
