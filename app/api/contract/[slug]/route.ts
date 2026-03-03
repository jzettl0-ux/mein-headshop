import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { replaceContractPlaceholders } from '@/lib/legal-pdf'
import { getDefaultContractPlaceholdersAsync } from '@/lib/contract-placeholders'

export const dynamic = 'force-dynamic'

/** GET – Vertragstext lesen (öffentlich, für Bestätigungsseite) */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('contract_templates')
    .select('slug, label, template_text')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Vertrag nicht gefunden' }, { status: 404 })
  const placeholders = await getDefaultContractPlaceholdersAsync()
  const text = replaceContractPlaceholders(data.template_text || '', placeholders)
  return NextResponse.json({ slug: data.slug, label: data.label, text })
}
