'use client'

import { useState, useEffect } from 'react'
import { Lock, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
export default function AdminAsinLocksPage() {
  const { toast } = useToast()
  const [locks, setLocks] = useState<{ lock_id: string; product_id: string; product_name: string; product_slug: string | null; review_count: number; is_title_locked: boolean; is_category_locked: boolean; last_checked_at: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = () => {
    setLoading(true)
    fetch('/api/admin/asin-locks')
      .then((r) => (r.ok ? r.json() : { locks: [] }))
      .then((d) => setLocks(d.locks ?? []))
      .catch(() => setLocks([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/asin-locks/refresh', { method: 'POST' })
      const data = await res.json()
      toast({ title: data.message || `${data.updated ?? 0} Produkte aktualisiert` })
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setRefreshing(false)
    }
  }

  const titleLocked = locks.filter((l) => l.is_title_locked)
  const categoryLocked = locks.filter((l) => l.is_category_locked && !l.is_title_locked)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
          <Lock className="w-6 h-6" />
          ASIN-Locks (Anti Review-Hijacking)
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Produkte mit ≥10 Reviews: Titel gesperrt. Mit ≥5 Reviews: Kategorie gesperrt. Cron aktualisiert täglich.
        </p>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Jetzt aktualisieren
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      ) : locks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            Keine ASIN-Locks. Cron <code className="text-xs bg-neutral-100 px-1 rounded">/api/cron/refresh-asin-locks</code> ausführen oder oben „Jetzt aktualisieren“ klicken.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Titel gesperrt (≥10 Reviews)</CardTitle>
              <p className="text-sm text-neutral-500 font-normal">{titleLocked.length} Produkte</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {titleLocked.map((l) => (
                  <li key={l.lock_id} className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0">
                    <Link href={`/admin/products/${l.product_id}/edit`} className="text-luxe-primary hover:underline">
                      {l.product_name || l.product_id}
                    </Link>
                    <span className="text-neutral-500">{l.review_count} Reviews</span>
                  </li>
                ))}
                {titleLocked.length === 0 && <li className="text-neutral-500">Keine</li>}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kategorie gesperrt (5–9 Reviews)</CardTitle>
              <p className="text-sm text-neutral-500 font-normal">{categoryLocked.length} Produkte</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {categoryLocked.map((l) => (
                  <li key={l.lock_id} className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0">
                    <Link href={`/admin/products/${l.product_id}/edit`} className="text-luxe-primary hover:underline">
                      {l.product_name || l.product_id}
                    </Link>
                    <span className="text-neutral-500">{l.review_count} Reviews</span>
                  </li>
                ))}
                {categoryLocked.length === 0 && <li className="text-neutral-500">Keine</li>}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
