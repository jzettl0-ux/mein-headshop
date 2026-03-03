'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface APlusBlockEditorProps {
  blockType: string
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
}

function updateContent(prev: Record<string, unknown>, key: string, value: unknown) {
  const next = { ...prev }
  if (value === '' || value === undefined) delete next[key]
  else next[key] = value
  return next
}

export function APlusBlockEditor({ blockType, content, onChange }: APlusBlockEditorProps) {
  if (blockType === 'text_only') {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-luxe-silver">Überschrift</Label>
          <Input
            value={(content.heading as string) ?? ''}
            onChange={(e) => onChange(updateContent(content, 'heading', e.target.value))}
            placeholder="z. B. Produktdetails"
            className="bg-luxe-black border-luxe-gray text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-luxe-silver">Text</Label>
          <Textarea
            value={(content.body as string) ?? ''}
            onChange={(e) => onChange(updateContent(content, 'body', e.target.value))}
            placeholder="Fließtext..."
            rows={4}
            className="bg-luxe-black border-luxe-gray text-white mt-1"
          />
        </div>
      </div>
    )
  }

  if (blockType === 'image_text') {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-luxe-silver">Bild-URL</Label>
          <Input
            value={(content.image_url as string) ?? ''}
            onChange={(e) => onChange(updateContent(content, 'image_url', e.target.value))}
            placeholder="https://..."
            className="bg-luxe-black border-luxe-gray text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-luxe-silver">Bildposition</Label>
          <select
            value={(content.image_position as string) ?? 'left'}
            onChange={(e) => onChange(updateContent(content, 'image_position', e.target.value))}
            className="mt-1 w-full rounded-md bg-luxe-black border border-luxe-gray px-3 py-2 text-white"
          >
            <option value="left">Links</option>
            <option value="right">Rechts</option>
          </select>
        </div>
        <div>
          <Label className="text-luxe-silver">Überschrift</Label>
          <Input
            value={(content.heading as string) ?? ''}
            onChange={(e) => onChange(updateContent(content, 'heading', e.target.value))}
            placeholder="Optional"
            className="bg-luxe-black border-luxe-gray text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-luxe-silver">Text</Label>
          <Textarea
            value={(content.body as string) ?? ''}
            onChange={(e) => onChange(updateContent(content, 'body', e.target.value))}
            placeholder="Beschreibung..."
            rows={4}
            className="bg-luxe-black border-luxe-gray text-white mt-1"
          />
        </div>
      </div>
    )
  }

  if (blockType === 'comparison_table') {
    const headers = (content.headers as string[]) ?? []
    const rows = (content.rows as string[][]) ?? []

    const setHeaders = (h: string[]) => onChange({ ...content, headers: h })
    const setRows = (r: string[][]) => onChange({ ...content, rows: r })

    return (
      <div className="space-y-4">
        <div>
          <Label className="text-luxe-silver">Spaltenüberschriften (kommagetrennt)</Label>
          <Input
            value={headers.join(', ')}
            onChange={(e) =>
              setHeaders(
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder="Eigenschaft, Wert, ..."
            className="bg-luxe-black border-luxe-gray text-white mt-1"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-luxe-silver">Zeilen</Label>
            <Button
              type="button"
              variant="admin-outline"
              size="sm"
              onClick={() => setRows([...rows, headers.map(() => '')])}
            >
              <Plus className="w-4 h-4 mr-1" /> Zeile
            </Button>
          </div>
          <div className="space-y-2">
            {rows.map((row, ri) => (
              <div key={ri} className="flex gap-2 items-center">
                {headers.length === 0 ? (
                  <Input
                    value={row[0] ?? ''}
                    onChange={(e) => {
                      const r = [...rows]
                      r[ri] = [e.target.value]
                      setRows(r)
                    }}
                    placeholder="Wert"
                    className="bg-luxe-black border-luxe-gray text-white flex-1"
                  />
                ) : (
                  headers.map((_, ci) => (
                    <Input
                      key={ci}
                      value={row[ci] ?? ''}
                      onChange={(e) => {
                        const r = rows.map((x) => [...x])
                        while ((r[ri]?.length ?? 0) <= ci) r[ri].push('')
                        r[ri][ci] = e.target.value
                        setRows(r)
                      }}
                      placeholder={headers[ci] || `Spalte ${ci + 1}`}
                      className="bg-luxe-black border-luxe-gray text-white flex-1"
                    />
                  ))
                )}
                <Button
                  type="button"
                  variant="admin-outline"
                  size="sm"
                  className="text-red-400 shrink-0"
                  onClick={() => setRows(rows.filter((_, i) => i !== ri))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (blockType === 'feature_list') {
    const items = (content.items as string[]) ?? []
    const setItems = (i: string[]) => onChange({ ...content, items: i })

    return (
      <div className="space-y-4">
        <div>
          <Label className="text-luxe-silver">Überschrift</Label>
          <Input
            value={(content.heading as string) ?? ''}
            onChange={(e) => onChange(updateContent(content, 'heading', e.target.value))}
            placeholder="z. B. Highlights"
            className="bg-luxe-black border-luxe-gray text-white mt-1"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-luxe-silver">Einträge</Label>
            <Button type="button" variant="admin-outline" size="sm" onClick={() => setItems([...items, ''])}>
              <Plus className="w-4 h-4 mr-1" /> Eintrag
            </Button>
          </div>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const next = [...items]
                    next[i] = e.target.value
                    setItems(next)
                  }}
                  placeholder={`Eintrag ${i + 1}`}
                  className="bg-luxe-black border-luxe-gray text-white flex-1"
                />
                <Button
                  type="button"
                  variant="admin-outline"
                  size="sm"
                  className="text-red-400 shrink-0"
                  onClick={() => setItems(items.filter((_, j) => j !== i))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (blockType === 'image_gallery') {
    const images = (content.images as string[]) ?? []
    const setImages = (imgs: string[]) => onChange({ ...content, images: imgs })

    return (
      <div className="space-y-4">
        <div>
          <Label className="text-luxe-silver">Überschrift</Label>
          <Input
            value={(content.heading as string) ?? ''}
            onChange={(e) => onChange(updateContent(content, 'heading', e.target.value))}
            placeholder="z. B. Produktbilder"
            className="bg-luxe-black border-luxe-gray text-white mt-1"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-luxe-silver">Bild-URLs</Label>
            <Button type="button" variant="admin-outline" size="sm" onClick={() => setImages([...images, ''])}>
              <Plus className="w-4 h-4 mr-1" /> Bild
            </Button>
          </div>
          <div className="space-y-2">
            {images.map((url, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => {
                    const next = [...images]
                    next[i] = e.target.value
                    setImages(next)
                  }}
                  placeholder={`Bild-URL ${i + 1}`}
                  className="bg-luxe-black border-luxe-gray text-white flex-1"
                />
                <Button
                  type="button"
                  variant="admin-outline"
                  size="sm"
                  className="text-red-400 shrink-0"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
