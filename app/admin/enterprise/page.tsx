'use client'

import Link from 'next/link'
import { ExternalLink, AlertTriangle, Package, Store, ShieldCheck, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const LINKS = [
  { href: '/admin/enterprise/punchout', label: 'PunchOut (SAP Ariba, Coupa)', icon: ExternalLink, desc: 'cXML/OData, Warenkorb-Rückflug' },
  { href: '/admin/enterprise/crap', label: 'CRAP-Algorithmus', icon: AlertTriangle, desc: 'Net PPM, Add-on, Suppression' },
  { href: '/admin/enterprise/inventory-lots', label: 'FEFO Lot-Tracking', icon: Package, desc: 'Chargen, MHD, First Expire First Out' },
  { href: '/admin/enterprise/creator', label: 'Creator Storefronts', icon: Store, desc: 'Vanity-URL, Ideenlisten, Ledger Split' },
  { href: '/admin/enterprise/velocity-anomalies', label: 'Anti-Hijacking', icon: ShieldCheck, desc: 'Preis-Drop, Velocity-Spike, 2FA' },
  { href: '/admin/enterprise/oss-threshold', label: 'OSS Threshold Monitor', icon: Globe, desc: 'EU 10k€ Cross-Border Tax' },
]

export default function AdminEnterprisePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Enterprise (Teil 19)</h1>
        <p className="text-sm text-luxe-silver mt-1">
          B2B PunchOut, Profit-Wächter, FEFO, Creator Economy, Anti-Hijacking, OSS.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="bg-luxe-charcoal border-luxe-gray hover:border-luxe-gold/50 transition-colors h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-base">
                    <Icon className="w-5 h-5 text-luxe-gold" />
                    {item.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-luxe-silver">{item.desc}</p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
