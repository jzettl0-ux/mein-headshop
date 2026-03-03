import { createServerSupabase } from '@/lib/supabase-server'
import type { Metadata } from 'next'

type Props = { params: Promise<{ slug: string }>; children: React.ReactNode }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('products')
    .select('name, description, image_url, images')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()

  if (!data) return { title: 'Produkt' }
  const name = String(data.name ?? 'Produkt')
  const description = data.description
    ? String(data.description).slice(0, 160)
    : `${name} – Premium Headshop`
  const imageUrl = (data.images as string[])?.[0] ?? data.image_url ?? null
  const ogImage = imageUrl
    ? (imageUrl.startsWith('http') ? imageUrl : `${process.env.NEXT_PUBLIC_SITE_URL || ''}${imageUrl}`)
    : undefined
  return {
    title: `${name} | Premium Headshop`,
    description: description,
    openGraph: {
      title: name,
      description: description,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: name }] }),
    },
  }
}

export default function ProductLayout({ children }: Props) {
  return <>{children}</>
}
