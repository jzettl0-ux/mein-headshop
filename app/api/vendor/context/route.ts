import { NextResponse } from 'next/server'
import { getVendorContext } from '@/lib/vendor-auth'

export const dynamic = 'force-dynamic'

/** GET – Vendor-Kontext für Client (isVendor, vendor) */
export async function GET() {
  const ctx = await getVendorContext()
  return NextResponse.json({
    isVendor: ctx.isVendor,
    vendor: ctx.vendor ?? null,
  })
}
