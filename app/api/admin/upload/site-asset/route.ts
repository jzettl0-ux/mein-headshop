import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const BUCKET = 'site-assets'
const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const dynamic = 'force-dynamic'

/**
 * POST – Admin: Bild vom PC hochladen (z. B. Wasserzeichen, Media).
 * Speichert in Supabase Storage (Bucket "site-assets") und gibt die öffentliche URL zurück.
 */
export async function POST(req: NextRequest) {
  try {
    const { isAdmin } = await getAdminContext()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json(
        { error: 'Upload erfordert SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 503 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Keine Datei gesendet' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Datei zu groß. Max. ${MAX_SIZE_MB} MB.` },
        { status: 400 }
      )
    }

    const type = file.type?.toLowerCase()
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Nur Bilder erlaubt (JPEG, PNG, WebP, GIF).' },
        { status: 400 }
      )
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const safeExt = ['jpeg', 'jpg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'png'
    const fileName = `media/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`

    const admin = createSupabaseAdmin()
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: `Storage-Bucket "${BUCKET}" fehlt. Bitte supabase/migration-site-assets-logo.sql ausführen.` },
          { status: 503 }
        )
      }
      console.error('Site asset upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message || 'Upload fehlgeschlagen' }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(fileName)
    return NextResponse.json({ url: publicUrl })
  } catch (e: unknown) {
    console.error('Upload site asset error', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler' },
      { status: 500 }
    )
  }
}
