'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface APlusBlock {
  id: string
  block_type: string
  content: Record<string, unknown>
}

interface APlusContentProps {
  productId: string
}

function BlockImageText({ content }: { content: Record<string, unknown> }) {
  const imageUrl = content.image_url as string | undefined
  const heading = content.heading as string | undefined
  const body = content.body as string | undefined
  const imageLeft = content.image_position === 'left'

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-center ${imageLeft ? '' : 'md:grid-flow-dense'}`}>
      {imageUrl && (
        <div className={`relative aspect-video rounded-xl overflow-hidden bg-luxe-gray ${imageLeft ? '' : 'md:col-start-2'}`}>
          <Image src={imageUrl} alt={heading || ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
      )}
      <div className={imageLeft && imageUrl ? '' : imageUrl ? 'md:col-start-1 md:row-start-1' : ''}>
        {heading && <h3 className="text-xl font-bold text-white mb-2">{heading}</h3>}
        {body && <p className="text-luxe-silver leading-relaxed whitespace-pre-line">{body}</p>}
      </div>
    </div>
  )
}

function BlockTextOnly({ content }: { content: Record<string, unknown> }) {
  const heading = content.heading as string | undefined
  const body = content.body as string | undefined
  return (
    <div>
      {heading && <h3 className="text-xl font-bold text-white mb-2">{heading}</h3>}
      {body && <p className="text-luxe-silver leading-relaxed whitespace-pre-line">{body}</p>}
    </div>
  )
}

function BlockComparisonTable({ content }: { content: Record<string, unknown> }) {
  const headers = (content.headers as string[]) ?? []
  const rows = (content.rows as string[][]) ?? []
  if (headers.length === 0 && rows.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2 bg-luxe-gray text-white font-semibold border border-luxe-gray">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2 text-luxe-silver border border-luxe-gray">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BlockFeatureList({ content }: { content: Record<string, unknown> }) {
  const heading = content.heading as string | undefined
  const items = (content.items as string[]) ?? []
  if (items.length === 0) return null

  return (
    <div>
      {heading && <h3 className="text-xl font-bold text-white mb-3">{heading}</h3>}
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-luxe-silver">
            <span className="text-luxe-gold mt-1">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BlockImageGallery({ content }: { content: Record<string, unknown> }) {
  const images = (content.images as string[]) ?? []
  const heading = content.heading as string | undefined
  if (images.length === 0) return null

  return (
    <div>
      {heading && <h3 className="text-xl font-bold text-white mb-3">{heading}</h3>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-luxe-gray">
            <Image src={url} alt="" fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function APlusContent({ productId }: APlusContentProps) {
  const [blocks, setBlocks] = useState<APlusBlock[]>([])

  useEffect(() => {
    fetch(`/api/aplus-content?product_id=${encodeURIComponent(productId)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setBlocks(Array.isArray(data) ? data : []))
      .catch(() => setBlocks([]))
  }, [productId])

  if (blocks.length === 0) return null

  return (
    <section className="mt-12 pt-12 border-t border-luxe-gray" aria-label="Zusätzliche Produktinformationen">
      <div className="space-y-10">
        {blocks.map((block) => {
          const content = block.content ?? {}
          return (
            <div key={block.id} className="rounded-xl p-6 bg-luxe-charcoal/50 border border-luxe-gray/50">
              {block.block_type === 'image_text' && <BlockImageText content={content} />}
              {block.block_type === 'text_only' && <BlockTextOnly content={content} />}
              {block.block_type === 'comparison_table' && <BlockComparisonTable content={content} />}
              {block.block_type === 'feature_list' && <BlockFeatureList content={content} />}
              {block.block_type === 'image_gallery' && <BlockImageGallery content={content} />}
            </div>
          )
        })}
      </div>
    </section>
  )
}
