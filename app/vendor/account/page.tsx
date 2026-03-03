'use client'

import { useState, useEffect } from 'react'
import { Store, Mail, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function VendorAccountPage() {
  const [account, setAccount] = useState<any>(null)

  useEffect(() => {
    fetch('/api/vendor/account')
      .then((r) => (r.ok ? r.json() : null))
      .then(setAccount)
      .catch(() => setAccount(null))
  }, [])

  if (!account) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">Konto</h1>
        <p className="text-luxe-silver">Lade Stammdaten…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Konto</h1>
        <p className="text-luxe-silver mt-1">Firmenstammdaten (nur Lesen)</p>
      </div>

      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Store className="w-5 h-5" />
            {account.company_name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-luxe-silver">
          {account.contact_email && (
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 shrink-0" />
              {account.contact_email}
            </p>
          )}
          {(account.address_street || account.address_city) && (
            <p className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0" />
              {[account.address_street, account.address_zip, account.address_city].filter(Boolean).join(', ')}
            </p>
          )}
          {account.contact_person && <p>Ansprechpartner: {account.contact_person}</p>}
          {account.vat_id && <p>USt-IdNr.: {account.vat_id}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
