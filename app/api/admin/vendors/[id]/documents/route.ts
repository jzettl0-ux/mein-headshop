import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const DOC_TYPES = ['handelsregister', 'ust_bescheinigung', 'id_pass', 'id_id_card', 'company_extract', 'other'] as const

/** POST – Dokument-Eintrag anlegen (Datei-Upload separat via Storage) */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id: vendorId } = await params
  if (!vendorId) return NextResponse.json({ error: 'Vendor-ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const documentType = body.document_type
  const filePath = typeof body.file_path === 'string' ? body.file_path.trim() : ''
  if (!documentType || !DOC_TYPES.includes(documentType) || !filePath) {
    return NextResponse.json({
      error: 'document_type (handelsregister|ust_bescheinigung|id_pass|id_id_card|company_extract|other) und file_path erforderlich',
    }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('vendor_kyb_documents')
    .insert({
      vendor_id: vendorId,
      document_type: documentType,
      file_path: filePath,
      file_name: body.file_name?.trim() || null,
      file_size: body.file_size ?? null,
      mime_type: body.mime_type?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
