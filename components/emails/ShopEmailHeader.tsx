import { Section, Img, Link, Text } from '@react-email/components'
import * as React from 'react'
import { emailStyles as s } from './email-styles'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://premium-headshop.de'

export interface ShopEmailHeaderProps {
  /** Logo-URL aus site_settings (wird in allen Shop-Mails verwendet) */
  logoUrl?: string
}

/**
 * Einheitlicher E-Mail-Header: heller Hintergrund (Logo gut erkennbar), kein kräftiges Grün.
 */
export function ShopEmailHeader({ logoUrl }: ShopEmailHeaderProps) {
  return (
    <Section
      style={{
        background: s.headerBg,
        padding: '28px 24px',
        textAlign: 'center',
      }}
    >
      {logoUrl ? (
        <Link href={SITE_URL} style={{ display: 'inline-block' }}>
          <Img
            src={logoUrl}
            alt={SITE_NAME}
            width={160}
            height={48}
            style={{ display: 'block', margin: '0 auto', maxHeight: 48, width: 'auto', objectFit: 'contain' }}
          />
        </Link>
      ) : (
        <Text
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: s.text,
            letterSpacing: '0.02em',
            margin: 0,
          }}
        >
          {SITE_NAME}
        </Text>
      )}
    </Section>
  )
}
