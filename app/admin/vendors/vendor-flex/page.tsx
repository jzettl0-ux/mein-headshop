'use client'

import { useState, useEffect } from 'react'
import { Truck, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
type Node = {
  node_id: string
  vendor_id: string
  daily_processing_capacity: number
  is_active: boolean
  api_endpoint_url: string | null
  registered_at: string
}

export default function AdminVendorFlexPage() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/vendor-flex-nodes')
      .then((r) => (r.ok ? r.json() : { nodes: [] }))
      .then((d) => setNodes(d.nodes ?? []))
      .catch(() => setNodes([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-luxe-gold" />
          Vendor Flex Nodes
        </h1>
        <p className="text-sm text-luxe-silver mt-1">
          Dezentrales FBA, Lager als API – virtuelles FBA-Badge, Routing in Hersteller-Lager.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-luxe-gold" />
        </div>
      ) : nodes.length === 0 ? (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardContent className="py-12 text-center text-luxe-silver">
            Keine Nodes. Tabelle <code className="text-xs bg-luxe-black px-1 rounded">margins.vendor_flex_nodes</code> über Migration anlegen.
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-luxe-charcoal border-luxe-gray">
          <CardHeader>
            <CardTitle className="text-white">Vendor Flex Nodes</CardTitle>
            <p className="text-sm text-luxe-silver font-normal">{nodes.length} Einträge</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {nodes.map((n) => (
                <li key={n.node_id} className="flex items-center justify-between py-3 border-b border-luxe-gray/50 last:border-0">
                  <div className="flex items-center gap-2">
                    {n.is_active ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-luxe-silver" />}
                    <span className="font-medium text-white">{n.node_id}</span>
                    <span className="text-luxe-silver">· {n.daily_processing_capacity} Kapazität/Tag</span>
                  </div>
                  {n.api_endpoint_url && <span className="text-luxe-silver text-xs truncate max-w-xs">{n.api_endpoint_url}</span>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
