import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'influencer-assets'
const MAX_SIZE_MB = 10
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** GET – Alle Assets für Admin-Mediathek */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: rows, error } = await admin
    .from('influencer_assets')
    .select('id, title, category, visibility, storage_path, format_info, width, height, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const bucketPath = baseUrl ? `${baseUrl}/storage/v1/object/public/${BUCKET}/` : ''

  const assets = (rows ?? []).map((r) => ({
    ...r,
    url: bucketPath + (r.storage_path || ''),
  }))

  return NextResponse.json({ assets })
}

/** POST – Neues Asset: Upload (file) + title, category, visibility, format_info */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const title = (formData.get('title') as string)?.trim() || ''
  const category = (formData.get('category') as string)?.trim() || 'product_photos'
  const visibility = (formData.get('visibility') as string)?.trim() || 'partner_only'
  const formatInfo = (formData.get('format_info') as string)?.trim() || null

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei gesendet' }, { status: 400 })
  }
  if (!title) {
    return NextResponse.json({ error: 'Titel erforderlich' }, { status: 400 })
  }
  if (!['product_photos', 'banner', 'logos'].includes(category)) {
    return NextResponse.json({ error: 'Ungültige Kategorie' }, { status: 400 })
  }
  if (!['public', 'partner_only'].includes(visibility)) {
    return NextResponse.json({ error: 'Ungültige Sichtbarkeit' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json({ error: `Max. ${MAX_SIZE_MB} MB` }, { status: 400 })
  }
  const type = file.type?.toLowerCase()
  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Nur JPEG, PNG, WebP, GIF' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const safeExt = ['jpeg', 'jpg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg'
  const storagePath = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`

  const admin = createSupabaseAdmin()
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  })

  if (uploadError) {
    console.error('Asset upload error:', uploadError)
    return NextResponse.json({ error: uploadError.message || 'Upload fehlgeschlagen' }, { status: 500 })
  }

  const { data: row, error: insertError } = await admin
    .from('influencer_assets')
    .insert({
      title,
      category,
      visibility,
      storage_path: storagePath,
      format_info: formatInfo,
    })
    .select('id, title, category, visibility, storage_path, format_info, created_at')
    .single()

  if (insertError) {
    await admin.storage.from(BUCKET).remove([storagePath]).catch(() => {})
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const url = baseUrl ? `${baseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}` : ''

  return NextResponse.json({ asset: { ...row, url } })
}
