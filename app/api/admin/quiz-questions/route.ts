/**
 * Blueprint TEIL 21.11: Quiz-Fragen anlegen
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

const UI_TYPES = ['IMAGE_CARDS', 'SLIDER', 'BUTTONS'] as const

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const quizId = body.quiz_id
  const questionText = String(body.question_text ?? '').trim()
  if (!quizId) return NextResponse.json({ error: 'quiz_id fehlt' }, { status: 400 })
  if (!questionText) return NextResponse.json({ error: 'question_text fehlt' }, { status: 400 })
  const uiType = UI_TYPES.includes(body.ui_control_type) ? body.ui_control_type : 'BUTTONS'
  const sortOrder = typeof body.sort_order === 'number' ? body.sort_order : null
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('guided_selling')
    .from('quiz_questions')
    .insert({ quiz_id: quizId, question_text: questionText, ui_control_type: uiType, sort_order: sortOrder })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
