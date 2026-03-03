import type { IBaseConnector } from './types'
import { InfluencerAPIConnector } from './InfluencerAPIConnector'

export * from './types'
export { BaseConnector } from './BaseConnector'
export { InfluencerAPIConnector } from './InfluencerAPIConnector'

const connectorMap: Record<string, IBaseConnector> = {
  influencer_api: new InfluencerAPIConnector(),
}

export function getConnector(type: string): IBaseConnector | null {
  return connectorMap[type] ?? null
}

export function getConnectorTypes(): { value: string; label: string }[] {
  return [
    { value: 'influencer_api', label: 'Influencer / Partner JSON-API' },
  ]
}
