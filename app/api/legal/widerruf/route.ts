import { NextResponse } from 'next/server'
import { generateWiderrufPdf } from '@/lib/legal-pdf'

export async function GET() {
  try {
    const pdf = await generateWiderrufPdf()
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Widerrufsbelehrung.pdf"',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (e) {
    console.error('Widerruf PDF error:', e)
    return NextResponse.json({ error: 'PDF konnte nicht erstellt werden' }, { status: 500 })
  }
}
