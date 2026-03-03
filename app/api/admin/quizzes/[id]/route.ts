/**
 * Blueprint TEIL 21.11: Einzelnes Quiz PATCH/DELETE
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data: quiz, error: eQuiz } = await admin.schema('guided_selling').from('quizzes').select('*').eq('quiz_id', id).single()
  if (eQuiz || !quiz) return NextResponse.json({ error: 'Quiz nicht gefunden' }, { status: 404 })
  const { data: questions } = await admin.schema('guided_selling').from('quiz_questions').select('*').eq('quiz_id', id).order('sort_order')
  const qList = (questions ?? []) as Array<{ question_id: string }>
  let answers: Array<Record<string, unknown>> = []
  if (qList.length > 0) {
    const { data: ans } = await admin.schema('guided_selling').from('quiz_answers').select('*').in('question_id', qList.map((q) => q.question_id)).order('question_id')
    answers = (ans ?? []) as Array<Record<string, unknown>>
  }
  const answersByQuestion = qList.reduce((acc, q) => ({ ...acc, [q.question_id]: answers.filter((a) => a.question_id === q.question_id) }), {} as Record<string, unknown[]>)
  const questionsWithAnswers = qList.map((q) => ({ ...q, answers: answersByQuestion[q.question_id] ?? [] }))
  return NextResponse.json({ ...quiz, questions: questionsWithAnswers })
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
  if (body.target_audience !== undefined) updates.target_audience = body.target_audience?.trim() || null
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin.schema('guided_selling').from('quizzes').update(updates).eq('quiz_id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('guided_selling').from('quizzes').delete().eq('quiz_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
