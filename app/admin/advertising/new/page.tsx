'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Vendor {
  id: string
  company_name: string
}

export default function AdminAdvertisingNewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [campaignName, setCampaignName] = useState('')
  const [dailyBudget, setDailyBudget] = useState('10')
  const [vendorId, setVendorId] = useState<string>('')
  const [biddingStrategy, setBiddingStrategy] = useState('FIXED_BIDS')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/admin/vendors')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setVendors(Array.isArray(data) ? data : []))
      .catch(() => setVendors([]))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = campaignName.trim()
    const budget = parseFloat(dailyBudget)
    if (!name || name.length < 2) {
      toast({ title: 'Kampagnenname (min. 2 Zeichen) erforderlich', variant: 'destructive' })
      return
    }
    if (isNaN(budget) || budget < 0) {
      toast({ title: 'Tagesbudget muss >= 0 sein', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/advertising/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_name: name,
          daily_budget: budget,
          vendor_id: vendorId || null,
          bidding_strategy: biddingStrategy,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'Kampagne angelegt' })
      router.push(`/admin/advertising/${data.campaign_id}`)
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <Link href="/admin/advertising" className="inline-flex items-center text-luxe-silver hover:text-white">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück zu Kampagnen
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-luxe-gold" />
          Neue Kampagne
        </h1>
        <p className="text-luxe-silver text-sm mt-1">PPC-Kampagne anlegen</p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray max-w-lg">
        <CardHeader>
          <CardTitle className="text-white">Kampagnendaten</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-luxe-silver">Kampagnenname *</Label>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="z. B. Sommer-Sale 2025"
                className="bg-luxe-black border-luxe-gray text-white mt-1"
                required
                minLength={2}
              />
            </div>
            <div>
              <Label className="text-luxe-silver">Tagesbudget (€) *</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={dailyBudget}
                onChange={(e) => setDailyBudget(e.target.value)}
                className="bg-luxe-black border-luxe-gray text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-luxe-silver">Vendor (optional)</Label>
              <Select value={vendorId || 'platform'} onValueChange={(v) => setVendorId(v === 'platform' ? '' : v)}>
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white mt-1">
                  <SelectValue placeholder="Platform (eigener Shop)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform">Platform (eigener Shop)</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-luxe-silver mt-1">Leer = Kampagne für den eigenen Shop</p>
            </div>
            <div>
              <Label className="text-luxe-silver">Bidding-Strategie</Label>
              <Select value={biddingStrategy} onValueChange={setBiddingStrategy}>
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIXED_BIDS">Feste Gebote</SelectItem>
                  <SelectItem value="DYNAMIC_DOWN_ONLY">Dynamic Down Only</SelectItem>
                  <SelectItem value="DYNAMIC_UP_AND_DOWN">Dynamic Up & Down</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4 pt-2">
              <Button type="submit" variant="luxe" disabled={submitting}>
                {submitting ? '…' : 'Kampagne anlegen'}
              </Button>
              <Link href="/admin/advertising">
                <Button type="button" variant="admin-outline">Abbrechen</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
