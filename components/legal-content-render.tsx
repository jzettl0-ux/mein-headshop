import { Card, CardContent } from '@/components/ui/card'

/**
 * Rendert im Admin gespeicherten Rechtstext (HTML) mit Shop-Styling.
 * Platzhalter sollten vor dem Aufruf bereits ersetzt sein (replaceLegalPlaceholders).
 */
export function LegalContentRender({
  title,
  content,
  className = '',
}: {
  title: string
  content: string
  className?: string
}) {
  return (
    <div className={className}>
      {title ? <h1 className="text-4xl font-bold text-white mb-8">{title}</h1> : null}
      <Card className="bg-luxe-charcoal border-luxe-gray">
        <CardContent className="pt-6">
          <div
            className="legal-html text-luxe-silver leading-relaxed space-y-4 [&_a]:text-luxe-gold [&_a]:hover:underline [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_strong]:text-white [&_table]:w-full [&_th]:text-white [&_th]:font-medium [&_td]:py-2 [&_td]:pr-4"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
