/**
 * Blueprint TEIL 21.11: Quiz-Antworten anlegen
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const questionId = body.question_id
  const answerLabel = String(body.answer_label ?? '').trim()
  if (!questionId) return NextResponse.json({ error: 'question_id fehlt' }, { status: 400 })
  if (!answerLabel) return NextResponse.json({ error: 'answer_label fehlt' }, { status: 400 })
  const filter = body.associated_jsonb_filter != null ? body.associated_jsonb_filter : {}
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('guided_selling')
    .from('quiz_answers')
    .insert({
      question_id: questionId,
      answer_label: answerLabel,
      associated_jsonb_filter: filter,
      icon_url: body.icon_url?.trim() || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
