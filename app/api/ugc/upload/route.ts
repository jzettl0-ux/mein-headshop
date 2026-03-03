/**
 * POST – UGC Post erstellen (Rate my Setup)
 * Auth erforderlich. Bild wird in ugc-images Bucket gespeichert.
 * Body: FormData { file: File, caption?: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const BUCKET = 'ugc-images'
const MAX_SIZE_MB = 5
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Bitte einloggen, um ein Setup zu teilen.' }, { status: 401 })

    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Upload derzeit nicht verfügbar.' }, { status: 503 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const caption = typeof formData.get('caption') === 'string' ? formData.get('caption') as string : ''
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Kein Bild angehängt.' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Max. ${MAX_SIZE_MB} MB.` }, { status: 400 })
    }

    const type = file.type?.toLowerCase()
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Nur JPEG, PNG oder WebP erlaubt.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const safeExt = ['jpeg', 'jpg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
    const storagePath = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`

    const admin = createSupabaseAdmin()
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Storage-Bucket "ugc-images" fehlt. Bitte im Supabase Dashboard anlegen.' },
          { status: 503 }
        )
      }
      console.error('UGC upload error:', uploadError)
      return NextResponse.json({ error: 'Upload fehlgeschlagen.' }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(storagePath)
    const imageUrl = publicUrl

    const { data: post, error: insertErr } = await admin
      .schema('community')
      .from('ugc_posts')
      .insert({
        customer_id: user.id,
        image_url: imageUrl,
        caption: caption?.trim().slice(0, 500) || null,
        status: 'PENDING_MODERATION',
      })
      .select('post_id, status, created_at')
      .single()

    if (insertErr || !post) {
      console.error('UGC post insert error:', insertErr)
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, post_id: post.post_id, status: post.status })
  } catch (e) {
    console.error('UGC upload error:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
