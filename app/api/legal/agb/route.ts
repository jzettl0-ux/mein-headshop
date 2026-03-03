import { NextResponse } from 'next/server'
import { generateAgbPdf } from '@/lib/legal-pdf'

export async function GET() {
  try {
    const pdf = await generateAgbPdf()
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="AGB.pdf"',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    console.error('AGB PDF error:', e)
    return NextResponse.json({ error: 'PDF konnte nicht erstellt werden' }, { status: 500 })
  }
}
