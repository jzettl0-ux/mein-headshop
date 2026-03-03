import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const SIZES = [192, 512] as const
type Size = (typeof SIZES)[number]

/**
 * GET /api/icon/192 oder /api/icon/512 – PWA-Icons (Theme #D4AF37).
 * Über next.config Rewrite auch unter /icon-192.png und /icon-512.png erreichbar.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ size: string }> | { size: string } }
) {
  const params = await Promise.resolve(context.params)
  const parsed = parseInt(params?.size ?? '192', 10)
  const size: Size = parsed === 512 ? 512 : 192
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#D4AF37',
          borderRadius: size === 512 ? 64 : 24,
          fontSize: size === 512 ? 256 : 96,
          fontWeight: 700,
          color: '#0A0A0A',
        }}
      >
        P
      </div>
    ),
    { width: size, height: size }
  )
}
