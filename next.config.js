const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/profile/loyalty', destination: '/account/loyalty', permanent: false },
      { source: '/profile/referral', destination: '/account/referral', permanent: false },
      { source: '/manifest.webmanifest', destination: '/manifest.json', permanent: false },
      { source: '/products', destination: '/shop', permanent: false },
      { source: '/admin/settings/employee-contract', destination: '/admin/contracts/mitarbeiter', permanent: false },
    ]
  },
  async rewrites() {
    return [
      { source: '/icon-192.png', destination: '/api/icon/192' },
      { source: '/icon-512.png', destination: '/api/icon/512' },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "script-src-attr 'none'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mollie.com https://api-eu.dhl.com https://*.ingest.sentry.io",
              "frame-src https://*.mollie.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "report-uri /api/csp-report",
            ].join('; '),
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
    ],
  },
}

const sentryConfig = {
  org: process.env.SENTRY_ORG || 'optional',
  project: process.env.SENTRY_PROJECT || 'optional',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
}

module.exports = withSentryConfig(nextConfig, sentryConfig)
