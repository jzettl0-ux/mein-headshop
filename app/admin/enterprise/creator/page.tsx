'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Profile = {
  creator_id: string
  influencer_name: string
  vanity_url_slug: string
  custom_commission_rate: number
  status: string
}

type List = {
  list_id: string
  list_title: string
  is_published: boolean
}

export default function AdminCreatorPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/creator-storefronts')
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => {
        setProfiles(d.profiles ?? [])
        setLists(d.lists ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Store className="w-6 h-6 text-luxe-gold" />
          Creator Storefronts
        </h1>
        <p className="text-sm text-luxe-silver mt-1">Vanity-URL, Ideenlisten, Ledger Split.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : profiles.length === 0 && lists.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Creator. creator_economy.influencer_profiles über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Creator-Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {profiles.map((p) => (
                  <li key={p.creator_id} className="flex justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                    <Link href={`/shop/${p.vanity_url_slug}`} className="text-luxe-gold hover:underline" target="_blank" rel="noreferrer">
                      /shop/{p.vanity_url_slug}
                    </Link>
                    <span className="text-luxe-silver">{p.influencer_name} · {p.custom_commission_rate}%</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-luxe-charcoal border-luxe-gray">
            <CardHeader>
              <CardTitle className="text-white">Ideenlisten</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {lists.map((l) => (
                  <li key={l.list_id} className="flex justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                    <span className="text-white">{l.list_title}</span>
                    <span className="text-luxe-silver">{l.is_published ? 'Veröffentlicht' : 'Entwurf'}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
