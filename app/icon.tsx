import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #D4AF37 0%, #b8860b 60%, #39FF14 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
          <path
            fill="#0A0A0A"
            d="M24 5c16 9 18 23 12 35-4 5-14 5-20 1-8-6-10-22-2-31 4-4 4-5 10-5z"
          />
        </svg>
      </div>
    ),
    { ...size }
  )
}
