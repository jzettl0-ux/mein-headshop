import { Text } from '@react-email/components'
import * as React from 'react'
import { emailStyles as s } from './email-styles'

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'

/**
 * Einheitlicher E-Mail-Abschluss: "Dein Team von {SITE_NAME}".
 * Gleicher Aufbau wie in send-order-email.ts (renderShopEmailLayout).
 */
export function ShopEmailFooter() {
  return (
    <Text
      style={{
        margin: '28px 0 0',
        fontSize: 15,
        color: s.primary,
        fontWeight: 600,
      }}
    >
      Dein Team von {SITE_NAME}
    </Text>
  )
}
