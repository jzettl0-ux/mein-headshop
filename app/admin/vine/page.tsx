'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Gift, Plus, Mail, Package, Copy, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

const STATUS_LABELS: Record<string, string> = {
  invited: 'Eingeladen',
  accepted: 'Angenommen',
  declined: 'Abgelehnt',
  sample_shipped: 'Muster versandt',
  review_pending: 'Bewertung ausstehend',
  completed: 'Abgeschlossen',
}

export default function AdminVinePage() {
  const [products, setProducts] = useState<{ product_id: string; products: { name: string; slug: string } }[]>([])
  const [invitations, setInvitations] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingInvitations, setLoadingInvitations] = useState(true)
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; slug: string }[]>([])
  const [productToAdd, setProductToAdd] = useState('')
  const [addingProduct, setAddingProduct] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState('_all')
  const [testerEmail, setTesterEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      const [vineRes, addRes] = await Promise.all([
        fetch('/api/admin/vine/products'),
        fetch('/api/admin/vine/add-product'),
      ])
      if (vineRes.ok) setProducts(await vineRes.json())
      if (addRes.ok) setAllProducts(await addRes.json())
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleAddProduct = async () => {
    if (!productToAdd) return
    setAddingProduct(true)
    try {
      const res = await fetch('/api/admin/vine/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productToAdd }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast({ title: d.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({ title: 'Produkt hinzugefügt' })
      setProductToAdd('')
      loadProducts()
    } finally {
      setAddingProduct(false)
    }
  }

  const loadInvitations = async () => {
    setLoadingInvitations(true)
    try {
      const url = selectedProduct && selectedProduct !== '_all' ? `/api/admin/vine/invitations?product_id=${selectedProduct}` : '/api/admin/vine/invitations'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setInvitations(data)
      }
    } finally {
      setLoadingInvitations(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    loadInvitations()
  }, [selectedProduct])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !testerEmail?.trim()) {
      toast({ title: 'Produkt und E-Mail auswählen', variant: 'destructive' })
      return
    }
    setInviting(true)
    try {
      const res = await fetch('/api/admin/vine/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: selectedProduct, tester_email: testerEmail.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast({ title: data.error || 'Fehler', variant: 'destructive' })
        return
      }
      toast({
        title: 'Einladung erstellt',
        description: data.email_sent ? 'E-Mail wurde an den Tester gesendet.' : (data.accept_url ? 'Link zum Kopieren unten (E-Mail nicht versendet).' : ''),
      })
      setTesterEmail('')
      loadInvitations()
    } finally {
      setInviting(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/vine/invitations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast({ title: 'Status aktualisiert' })
      loadInvitations()
    } catch {
      toast({ title: 'Fehler', variant: 'destructive' })
    }
  }

  const copyAcceptUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast({ title: 'Link kopiert' })
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const formatDate = (s: string) => new Date(s).toLocaleString('de-DE')

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-foreground flex items-center">
        <Gift className="w-7 h-7 mr-2 text-luxe-gold" />
        Vine-Programm (Produkttester)
      </h1>

      <p className="text-luxe-silver text-sm">
        Lade Tester ein, sende kostenlose Muster und fordere verpflichtende Bewertungen (is_tester_program).
      </p>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" /> Produkt ins Vine-Programm aufnehmen
          </h2>
          <div className="flex flex-wrap gap-4 items-end max-w-2xl">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-luxe-silver">Produkt</Label>
              <Select value={productToAdd} onValueChange={setProductToAdd}>
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white mt-1">
                  <SelectValue placeholder="Produkt wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {allProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                  {allProducts.length === 0 && !loadingProducts && (
                    <SelectItem value="_" disabled>Alle Produkte sind bereits im Programm</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button variant="admin-outline" onClick={handleAddProduct} disabled={addingProduct || !productToAdd}>
              {addingProduct ? '…' : 'Hinzufügen'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2" /> Produkt auswählen & Tester einladen
          </h2>
          <form onSubmit={handleInvite} className="flex flex-wrap gap-4 items-end max-w-2xl">
            <div className="flex-1 min-w-[200px]">
              <Label className="text-luxe-silver">Produkt</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="bg-luxe-black border-luxe-gray text-white mt-1">
                  <SelectValue placeholder="Produkt wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.product_id} value={p.product_id}>
                      {p.products?.name ?? p.product_id}
                    </SelectItem>
                  ))}
                  {products.length === 0 && !loadingProducts && (
                    <SelectItem value="_" disabled>Keine Vine-Produkte. Erst Produkt hinzufügen.</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label className="text-luxe-silver">Tester E-Mail</Label>
              <Input
                type="email"
                value={testerEmail}
                onChange={(e) => setTesterEmail(e.target.value)}
                placeholder="tester@example.com"
                className="bg-luxe-black border-luxe-gray text-white mt-1"
              />
            </div>
            <Button type="submit" variant="luxe" disabled={inviting || !selectedProduct || !testerEmail?.trim()}>
              {inviting ? '…' : 'Einladen'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Mail className="w-5 h-5 mr-2" /> Einladungen
            </h2>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="w-64 bg-luxe-black border-luxe-gray text-white">
                <SelectValue placeholder="Alle Produkte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Alle Produkte</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.product_id} value={p.product_id}>
                    {p.products?.name ?? p.product_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingInvitations ? (
            <p className="text-luxe-silver">Laden...</p>
          ) : invitations.length === 0 ? (
            <p className="text-luxe-silver">Keine Einladungen.</p>
          ) : (
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div
                  key={inv.invitation_id}
                  className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-luxe-black/50"
                >
                  <div>
                    <span className="text-white font-medium">{inv.tester_email}</span>
                    <span className="text-luxe-silver text-sm ml-2">
                      {(inv.products as { name?: string })?.name ?? inv.product_id}
                    </span>
                    <span className="text-luxe-silver text-xs ml-2">
                      {formatDate(inv.invited_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {inv.token && (
                      <Button
                        variant="admin-outline"
                        size="sm"
                        onClick={() => copyAcceptUrl(`${typeof window !== 'undefined' ? window.location.origin : ''}/vine/einladung?token=${inv.token}`)}
                      >
                        {copiedUrl?.includes(inv.token) ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                    <Select
                      value={inv.status}
                      onValueChange={(v) => handleStatusChange(inv.invitation_id, v)}
                    >
                      <SelectTrigger className="w-40 bg-luxe-charcoal border-luxe-gray text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invited">Eingeladen</SelectItem>
                        <SelectItem value="accepted">Angenommen</SelectItem>
                        <SelectItem value="declined">Abgelehnt</SelectItem>
                        <SelectItem value="sample_shipped">Muster versandt</SelectItem>
                        <SelectItem value="review_pending">Review ausstehend</SelectItem>
                        <SelectItem value="completed">Abgeschlossen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
