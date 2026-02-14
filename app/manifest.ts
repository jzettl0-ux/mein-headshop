import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Premium Headshop',
    short_name: 'Premium Headshop',
    description: 'Exklusives Kiffer-Zubehör - Store-Eigene Produkte & Influencer-Editionen',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0A',
    theme_color: '#D4AF37',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
