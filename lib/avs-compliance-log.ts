/**
 * Schreibt AVS-Events in compliance.age_verification_logs (Phase 4.2).
 * Für KJM-Audits: Pseudonymisierter Hash, keine sensiblen Daten.
 */

import { createHmac } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

type VerificationMethod = 'SCHUFA_QBIT' | 'EID_WALLET' | 'POSTIDENT' | 'AGE_GATE_TOKEN'

const PROVIDER_TO_METHOD: Record<string, VerificationMethod> = {
  simulation: 'AGE_GATE_TOKEN',
  qbit: 'SCHUFA_QBIT',
  postident: 'POSTIDENT',
  idnow: 'EID_WALLET',
}

function hashForAudit(
  provider: string,
  result: string,
  timestamp: string,
  sessionId?: string
): string {
  const payload = `${provider}|${result}|${timestamp}|${sessionId ?? ''}`
  return createHmac('sha256', process.env.AVS_AUDIT_SECRET || 'avs-audit-fallback')
    .update(payload)
    .digest('hex')
}

/**
 * Schreibt einen AVS-Compliance-Log-Eintrag.
 * Wird bei jeder erfolgreichen Altersverifizierung aufgerufen.
 */
export async function logAvsCompliance(
  admin: SupabaseClient,
  params: {
    customerId: string | null
    provider: string
    result: 'APPROVED' | 'REJECTED'
    sessionId?: string
    sessionValidUntil: Date
  }
): Promise<void> {
  const timestamp = new Date().toISOString()
  const providerResponseHash = hashForAudit(
    params.provider,
    params.result,
    timestamp,
    params.sessionId
  )
  const verificationMethod = PROVIDER_TO_METHOD[params.provider.toLowerCase()] ?? 'AGE_GATE_TOKEN'

  await admin
    .schema('compliance')
    .from('age_verification_logs')
    .insert({
      customer_id: params.customerId,
      verification_method: verificationMethod,
      is_verified: params.result === 'APPROVED',
      verified_at: params.result === 'APPROVED' ? timestamp : null,
      provider_response_hash: providerResponseHash,
      session_valid_until: params.sessionValidUntil.toISOString(),
    })
    .then(({ error }) => {
      if (error) console.error('[avs-compliance-log]', error)
    })
}
