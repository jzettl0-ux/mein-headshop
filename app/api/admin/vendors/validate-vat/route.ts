import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { validateVatId } from '@/lib/vies'

export const dynamic = 'force-dynamic'

/** POST – USt-IdNr. über VIES validieren. Body: { vat_id: string } */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const vatId = typeof body.vat_id === 'string' ? body.vat_id.trim() : ''
  if (!vatId) {
    return NextResponse.json({ error: 'vat_id erforderlich' }, { status: 400 })
  }

  const result = await validateVatId(vatId)
  return NextResponse.json(result)
}
