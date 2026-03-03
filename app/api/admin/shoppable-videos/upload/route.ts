import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { checkKcanAdvertising } from '@/lib/kcan-advertising-check'

const BUCKET = 'shoppable-videos'
const MAX_SIZE_GB = 5
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime']

export const dynamic = 'force-dynamic'

/**
 * POST – Shoppable Video hochladen.
 * Body: FormData mit file, product_id, title, description?
 * KCanG: title+description werden geprüft.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const productId = formData.get('product_id') as string | null
  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() ?? ''

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei gesendet' }, { status: 400 })
  }
  if (!productId || !title) {
    return NextResponse.json({ error: 'product_id und title erforderlich' }, { status: 400 })
  }

  if (file.size > MAX_SIZE_GB * 1024 * 1024 * 1024) {
    return NextResponse.json({ error: `Datei zu groß. Max. ${MAX_SIZE_GB} GB.` }, { status: 400 })
  }

  const type = file.type?.toLowerCase()
  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Nur MP4 und MOV erlaubt.' }, { status: 400 })
  }

  const kcanTitle = checkKcanAdvertising(title)
  const kcanDesc = description ? checkKcanAdvertising(description) : { blocked: false }
  if (kcanTitle.blocked || kcanDesc.blocked) {
    return NextResponse.json({
      error: 'KCanG §6: Titel oder Beschreibung enthält verherrlichende Begriffe.',
      kcan_blocked: true,
      matched: kcanTitle.matchedTerm || kcanDesc.matchedTerm,
    }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
  const safeExt = ['mp4', 'mov'].includes(ext) ? ext : 'mp4'
  const storagePath = `videos/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`

  const admin = createSupabaseAdmin()
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    if (uploadError.message?.includes('Bucket not found')) {
      return NextResponse.json({ error: `Bucket "${BUCKET}" fehlt. Migration migration-shoppable-videos.sql ausführen.` }, { status: 503 })
    }
    return NextResponse.json({ error: uploadError.message || 'Upload fehlgeschlagen' }, { status: 500 })
  }

  const { data: inserted, error: insertError } = await admin
    .schema('catalog')
    .from('shoppable_videos')
    .insert({
      product_id: productId,
      title,
      description: description || null,
      storage_path: storagePath,
      file_size_bytes: file.size,
      status: 'pending',
      kcan_checked_at: new Date().toISOString(),
      kcan_approved: true,
    })
    .select('*')
    .single()

  if (insertError) {
    await admin.storage.from(BUCKET).remove([storagePath]).catch(() => {})
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json(inserted)
}
