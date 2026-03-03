'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Plus, Pencil, Trash2, Target, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { formatPrice } from '@/lib/utils'

const TARGET_TYPE_LABELS: Record<string, string> = {
  KEYWORD: 'Keyword',
  ASIN: 'ASIN',
  PRODUCT: 'Produkt',
}

const MATCH_LABELS: Record<string, string> = {
  EXACT: 'Exakt',
  PHRASE: 'Phrase',
  BROAD: 'Broad',
  AUTO: 'Auto',
}

interface Target {
  target_id: string
  target_type: string
  target_value: string
  max_bid_amount: number
  match_type: string
  quality_score: number
  product_id: string | null
  products: { id: string; name: string; slug: string } | null
}

interface Campaign {
  campaign_id: string
  campaign_name: string
  daily_budget: number
  bidding_strategy: string
  status: string
  vendor_id: string | null
  vendor_accounts: { company_name: string } | null
  targets?: Target[]
}

export default function AdminAdvertisingCampaignPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { toast } = useToast()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<{ id: string; name: string; slug: string }[]>([])
  const [addTargetOpen, setAddTargetOpen] = useState(false)
  const [newTargetType, setNewTargetType] = useState('KEYWORD')
  const [newTargetValue, setNewTargetValue] = useState('')
  const [newMaxBid, setNewMaxBid] = useState('0.50')
  const [newMatchType, setNewMatchType] = useState('BROAD')
  const [newProductId, setNewProductId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [campRes, prodRes] = await Promise.all([
        fetch(`/api/admin/advertising/campaigns/${id}`),
        fetch('/api/admin/products/list').catch(() => null),
      ])
      if (campRes.ok) {
        const data = await campRes.json()
        setCampaign(data)
      } else {
        setCampaign(null)
      }
      if (prodRes?.ok) {
        const prodData = await prodRes.json()
        setProducts(Array.isArray(prodData) ? prodData : [])
      }
    } catch {
      setCampaign(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = newTargetValue.trim()
    const bid = parseFloat(newMaxBid)
    if (!value) {
      toast({ title: 'Target-Wert erforderlich', variant: 'destructive' })
      return
    }
    if (isNaN(bid) || bid < 0) {
      toast({ title: 'Max Bid muss >= 0 sein', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/advertising/campaigns/${id}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: newTargetType,
          target_value: value,
          max_bid_amount: bid,
          match_type: newMatchType,
          product_id: newProductId || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      setAddTargetOpen(false)
      setNewTargetValue('')
      setNewMaxBid('0.50')
      toast({ title: 'Target hinzugefügt' })
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTarget = async (targetId: string) => {
    if (!confirm('Target wirklich löschen?')) return
    try {
      const res = await fetch(`/api/admin/advertising/targets/${targetId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Target gelöscht' })
      load()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  if (loading || !campaign) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
      </div>
    )
  }

  const targets = campaign.targets ?? []

  return (
    <div className="space-y-8">
      <Link href="/admin/advertising" className="inline-flex items-center text-luxe-silver hover:text-white">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Zurück zu Kampagnen
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-luxe-gold" />
            {campaign.campaign_name}
          </h1>
          <p className="text-luxe-silver text-sm mt-1">
            {formatPrice(campaign.daily_budget)}/Tag · {campaign.vendor_accounts?.company_name ?? 'Platform'}
          </p>
          <Badge className="mt-2">
            {campaign.status === 'ACTIVE' ? 'Aktiv' : campaign.status === 'PAUSED' ? 'Pausiert' : 'Archiviert'}
          </Badge>
        </div>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5" />
            Targets ({targets.length})
          </CardTitle>
          <Button
            variant="luxe"
            size="sm"
            onClick={() => setAddTargetOpen(!addTargetOpen)}
            disabled={campaign.status === 'ARCHIVED'}
          >
            <Plus className="w-4 h-4 mr-2" /> Ziel hinzufügen
          </Button>
        </CardHeader>
        <CardContent>
          {addTargetOpen && (
            <form onSubmit={handleAddTarget} className="mb-6 p-4 rounded-lg bg-luxe-black/50 space-y-4">
              <h4 className="text-white font-medium">Neues Ziel</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-luxe-silver">Typ</Label>
                  <Select value={newTargetType} onValueChange={setNewTargetType}>
                    <SelectTrigger className="bg-luxe-charcoal border-luxe-gray text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KEYWORD">Keyword</SelectItem>
                      <SelectItem value="ASIN">ASIN</SelectItem>
                      <SelectItem value="PRODUCT">Produkt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-luxe-silver">Wert *</Label>
                  {newTargetType === 'PRODUCT' ? (
                    <Select value={newProductId} onValueChange={(v) => { setNewProductId(v); setNewTargetValue(v) }}>
                      <SelectTrigger className="bg-luxe-charcoal border-luxe-gray text-white mt-1">
                        <SelectValue placeholder="Produkt wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                        {products.length === 0 && (
                          <SelectItem value="_" disabled>Keine Produkte</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={newTargetValue}
                      onChange={(e) => setNewTargetValue(e.target.value)}
                      placeholder={newTargetType === 'KEYWORD' ? 'z. B. grinder' : 'ASIN oder ID'}
                      className="bg-luxe-charcoal border-luxe-gray text-white mt-1"
                    />
                  )}
                </div>
                <div>
                  <Label className="text-luxe-silver">Max Bid (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={newMaxBid}
                    onChange={(e) => setNewMaxBid(e.target.value)}
                    className="bg-luxe-charcoal border-luxe-gray text-white mt-1"
                  />
                </div>
                <div>
                  <Label className="text-luxe-silver">Match Type</Label>
                  <Select value={newMatchType} onValueChange={setNewMatchType}>
                    <SelectTrigger className="bg-luxe-charcoal border-luxe-gray text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXACT">Exakt</SelectItem>
                      <SelectItem value="PHRASE">Phrase</SelectItem>
                      <SelectItem value="BROAD">Broad</SelectItem>
                      <SelectItem value="AUTO">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="luxe" disabled={submitting}>
                  {submitting ? '…' : 'Hinzufügen'}
                </Button>
                <Button type="button" variant="admin-outline" onClick={() => setAddTargetOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </form>
          )}

          {targets.length === 0 ? (
            <p className="text-luxe-silver text-center py-8">Keine Targets. Füge Keywords, ASINs oder Produkte hinzu.</p>
          ) : (
            <div className="space-y-2">
              {targets.map((t) => (
                <div
                  key={t.target_id}
                  className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-luxe-black/50"
                >
                  <div>
                    <span className="text-white font-medium">{t.target_value}</span>
                    {t.products && (
                      <span className="text-luxe-silver text-sm ml-2">({t.products.name})</span>
                    )}
                    <div className="text-xs text-luxe-silver mt-0.5">
                      {TARGET_TYPE_LABELS[t.target_type]} · {MATCH_LABELS[t.match_type]} · {formatPrice(t.max_bid_amount)} Max Bid
                    </div>
                  </div>
                  <Button
                    variant="admin-outline"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => handleDeleteTarget(t.target_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
