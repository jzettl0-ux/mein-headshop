import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * POST /api/admin/hazmat/sds-upload
 * SDS-Dokument (PDF/Bild) hochladen und safety_data_sheet_url in product_safety_data setzen.
 * FormData: product_id (string), file (File), vendor_id (optional)
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const formData = await request.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'FormData erforderlich' }, { status: 400 })
  const product_id = formData.get('product_id') as string | null
  const file = formData.get('file') as File | null
  const vendor_id = (formData.get('vendor_id') as string)?.trim() || null

  if (!product_id || !file?.size) {
    return NextResponse.json({ error: 'product_id und file erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const bucket = 'product-images'
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
  const path = `sds/${product_id}/${Date.now()}.${ext}`

  const { data: upload, error: uploadError } = await admin.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type || 'application/pdf' })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload fehlgeschlagen: ' + uploadError.message }, { status: 500 })
  }

  const { data: urlData } = await admin.storage.from(bucket).getPublicUrl(path)
  const safety_data_sheet_url = urlData?.publicUrl ?? null
  if (!safety_data_sheet_url) {
    return NextResponse.json({ error: 'Public URL konnte nicht erzeugt werden' }, { status: 500 })
  }

  const { data: existing } = await admin
    .schema('compliance_hazmat')
    .from('product_safety_data')
    .select('hazmat_id')
    .eq('product_id', product_id)
    .maybeSingle()

  if (existing) {
    const { error: updErr } = await admin
      .schema('compliance_hazmat')
      .from('product_safety_data')
      .update({ safety_data_sheet_url, updated_at: new Date().toISOString() })
      .eq('hazmat_id', (existing as { hazmat_id: string }).hazmat_id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  } else {
    const { error: insErr } = await admin
      .schema('compliance_hazmat')
      .from('product_safety_data')
      .insert({
        product_id,
        vendor_id: vendor_id || null,
        safety_data_sheet_url,
        approval_status: 'PENDING',
      })
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    product_id,
    safety_data_sheet_url,
    path: upload?.path ?? path,
  })
}
