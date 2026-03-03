import { NextRequest, NextResponse } from 'next/server'

/**
 * CSP Report-Endpoint (PCI DSS 4.0.1 / E-Skimming-Schutz).
 * Empfängt Content-Security-Policy-Verletzungen vom Browser (report-uri).
 * Nur für Überwachung: Verstöße loggen, keine Speicherung sensibler Daten.
 * Optional: In Produktion an SIEM oder Log-Aggregator senden.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let body: { 'csp-report'?: Record<string, unknown> } = {}

    if (contentType.includes('application/json')) {
      body = await request.json().catch(() => ({}))
    } else if (contentType.includes('application/csp-report')) {
      const raw = await request.text()
      try {
        body = JSON.parse(raw)
      } catch {
        body = {}
      }
    }

    const report = body['csp-report']
    if (report && typeof report === 'object') {
      const blocked = report['blocked-uri'] ?? report['violated-directive'] ?? 'unknown'
      const msg = `[CSP] ${report['violated-directive'] ?? 'directive'} blocked: ${blocked}`
      console.warn(msg, {
        'document-uri': report['document-uri'],
        'blocked-uri': report['blocked-uri'],
        'source-file': report['source-file'],
        'line-number': report['line-number'],
      })
      // Optional: hier in DB schreiben oder an externen Service senden
    }
  } catch (e) {
    console.error('[CSP Report] Parse error:', e)
  }

  return new NextResponse(null, { status: 204 })
}
