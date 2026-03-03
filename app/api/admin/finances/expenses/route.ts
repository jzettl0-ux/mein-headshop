import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Ausgaben (mit expense_date wenn vorhanden, sonst month_key) */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const month = req.nextUrl.searchParams.get('month')
  const admin = createSupabaseAdmin()
  let query = admin.from('expenses').select('id, month_key, expense_date, amount_eur, category, description, invoice_pdf_url, created_at').order('created_at', { ascending: false })
  if (month?.match(/^\d{4}-\d{2}$/)) query = query.eq('month_key', month)
  const { data, error } = await query
  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data ?? [])
}

/** POST – Manuelle Ausgabe erfassen (BWA). expense_date (YYYY-MM-DD) für tagesgenaue Angabe, oder month_key (YYYY-MM) als Fallback. */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  let month_key: string | null = null
  let expense_date: string | null = null

  if (typeof body.expense_date === 'string' && body.expense_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const d = body.expense_date.trim()
    expense_date = d
    month_key = d.slice(0, 7)
  } else if (typeof body.month_key === 'string' && body.month_key.match(/^\d{4}-\d{2}$/)) {
    month_key = body.month_key.trim()
    expense_date = `${month_key}-15`
  }

  const amount_eur = typeof body.amount_eur === 'number' ? body.amount_eur : parseFloat(body.amount_eur)
  if (!month_key || Number.isNaN(amount_eur) || amount_eur <= 0) {
    return NextResponse.json({ error: 'expense_date (YYYY-MM-DD) oder month_key (YYYY-MM) und amount_eur (positiv) erforderlich' }, { status: 400 })
  }
  const category = typeof body.category === 'string' ? body.category.trim() || 'sonstige' : 'sonstige'
  const description = typeof body.description === 'string' ? body.description.trim() : null
  const invoice_pdf_url = typeof body.invoice_pdf_url === 'string' ? body.invoice_pdf_url.trim() || null : null

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('expenses')
    .insert({ month_key, expense_date: expense_date || undefined, amount_eur, category, description, invoice_pdf_url })
    .select('id, month_key, expense_date, amount_eur, category, description, invoice_pdf_url, created_at')
    .single()
  if (error) {
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return NextResponse.json(
        { error: 'Tabelle expenses fehlt. Bitte supabase/migration-expenses-table.sql ausführen.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
