import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Admin: PDF aus Storage (invoices) herunterladen. Query: filename=...
 */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const filename = req.nextUrl.searchParams.get('filename')
  if (!filename || filename.includes('..')) return NextResponse.json({ error: 'filename erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin.storage.from('invoices').download(filename)
  if (error || !data) return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 })

  const bytes = await data.arrayBuffer()
  const safeName = filename.replace(/^.*[/\\]/, '')
  const isXml = safeName.toLowerCase().endsWith('.xml')
  return new NextResponse(bytes, {
    headers: {
      'Content-Type': isXml ? 'application/xml' : 'application/pdf',
      'Content-Disposition': `attachment; filename="${safeName}"`,
    },
  })
}
