/**
 * Abstraktion für Altersverifizierungs-Provider (Phase 4.1)
 * Unterstützt: IDnow VideoIdent, Schufa QBIT, PostIdent, Simulation
 *
 * Konfiguration: AGE_VERIFICATION_PROVIDER=idnow|postident|qbit|simulation
 */

export type AgeVerificationProvider = 'idnow' | 'postident' | 'qbit' | 'simulation'

export interface InitResult {
  success: boolean
  redirectUrl?: string
  sessionId?: string
  error?: string
}

export interface StatusResult {
  status: 'pending' | 'approved' | 'rejected'
  error?: string
}

export interface InitParams {
  userId?: string
  email?: string
  returnUrl: string
  callbackUrl: string
}

export interface AgeVerificationProviderInterface {
  init(params: InitParams): Promise<InitResult>
  checkStatus(sessionId: string): Promise<StatusResult>
}

const simulationProvider: AgeVerificationProviderInterface = {
  async init(_params) {
    return { success: true, sessionId: `sim_${Date.now()}_${Math.random().toString(36).slice(2)}` }
  },
  async checkStatus(sessionId: string): Promise<StatusResult> {
    if (sessionId?.startsWith('sim_')) return { status: 'approved' }
    return { status: 'rejected', error: 'Unbekannte Session' }
  },
}

const idnowProvider: AgeVerificationProviderInterface = {
  async init(_params) {
    if (!process.env.IDNOW_API_KEY) {
      return { success: false, error: 'IDnow nicht konfiguriert (IDNOW_API_KEY)' }
    }
    // IDnow: POST /identifications → Redirect-URL für Nutzer, successUrl = params.callbackUrl
    // Platzhalter – bei Integration: IDnow API aufrufen, successUrl/errorUrl = params.callbackUrl
    return {
      success: false,
      error: 'IDnow: API-Integration erforderlich. Docs: https://docs-videoident.idnow.io/',
    }
  },
  async checkStatus(_sessionId) {
    return { status: 'rejected', error: 'IDnow checkStatus nicht implementiert.' }
  },
}

const postidentProvider: AgeVerificationProviderInterface = {
  async init(_params) {
    if (!process.env.POSTIDENT_API_KEY) {
      return { success: false, error: 'PostIdent nicht konfiguriert (POSTIDENT_API_KEY)' }
    }
    // PostIdent: Case erstellen, callbackUrl an Provider übergeben
    return {
      success: false,
      error: 'PostIdent: API-Integration erforderlich. Deutsche Post Geschäftskunden-Portal.',
    }
  },
  async checkStatus(_sessionId) {
    return { status: 'rejected', error: 'PostIdent checkStatus nicht implementiert.' }
  },
}

const qbitProvider: AgeVerificationProviderInterface = {
  async init(_params) {
    if (!process.env.SCHUFA_QBIT_API_KEY) {
      return { success: false, error: 'Schufa QBIT nicht konfiguriert (SCHUFA_QBIT_API_KEY)' }
    }
    // Schufa Q-Bit / finAPI GiroIdent: Altersprüfung per Online-Banking
    return {
      success: false,
      error: 'Schufa QBIT: API-Integration erforderlich (z.B. finAPI GiroIdent).',
    }
  },
  async checkStatus(_sessionId) {
    return { status: 'rejected', error: 'Schufa QBIT checkStatus nicht implementiert.' }
  },
}

const PROVIDER = (process.env.AGE_VERIFICATION_PROVIDER || 'simulation').toLowerCase() as AgeVerificationProvider

const providers: Record<AgeVerificationProvider, AgeVerificationProviderInterface> = {
  simulation: simulationProvider,
  idnow: idnowProvider,
  postident: postidentProvider,
  qbit: qbitProvider,
}

export function getAgeVerificationProvider(): AgeVerificationProviderInterface {
  return providers[PROVIDER] || simulationProvider
}
