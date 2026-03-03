import Link from 'next/link'
import { Shield, Eye, Scale, Lock } from 'lucide-react'
import { getComplianceReport } from '@/lib/compliance-report'
import type { ComplianceCategory } from '@/lib/compliance-report'

export const metadata = {
  title: 'Transparenz & Compliance',
  description: 'Transparenz- und Compliance-Bericht: Sicherheit, Barrierefreiheit, Recht, Datenschutz.',
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  security: Shield,
  accessibility: Eye,
  legal: Scale,
  privacy: Lock,
}

function SealBadge({ status }: { status: string }) {
  if (status !== 'Konform') return null
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[#2D5A2D]/40 bg-[#2D5A2D]/08 px-3 py-1 text-sm font-medium text-[#2D5A2D]"
      aria-label="Konform"
    >
      <span className="h-2 w-2 rounded-full bg-[#2D5A2D]" />
      Konform
    </span>
  )
}

function CategoryCard({ category }: { category: ComplianceCategory }) {
  const Icon = CATEGORY_ICONS[category.id] ?? Shield
  return (
    <section
      className="border border-[#E5E5E5] bg-white p-8 sm:p-10"
      aria-labelledby={`compliance-${category.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <h2
          id={`compliance-${category.id}`}
          className="font-serif text-2xl font-semibold tracking-tight text-[#1A1A1A]"
        >
          {category.label}
        </h2>
        <SealBadge status={category.status} />
      </div>
      <ul className="mt-6 space-y-2">
        {category.standards.map((standard) => (
          <li key={standard} className="flex items-center gap-2 text-[#4A4A4A]">
            <span className="h-px w-4 shrink-0 bg-[#2D5A2D]/50" aria-hidden />
            <span className="text-sm">{standard}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex justify-end">
        <Icon className="h-8 w-8 text-[#2D5A2D]/30" aria-hidden />
      </div>
    </section>
  )
}

export default async function CompliancePage() {
  const report = await getComplianceReport()
  const lastCheckedLabel = report.lastChecked
    ? new Date(report.lastChecked).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '–'

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Certificate-style block: Clean Luxe, serif, lots of whitespace */}
      <div className="border-b border-[#E5E5E5] bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="mb-2 font-serif text-sm uppercase tracking-[0.2em] text-[#6B6B6B]">
            Transparenz- & Compliance-Bericht
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1A1A1A] sm:text-5xl">
            {report.shopName}
          </h1>
          <p className="mt-6 text-sm text-[#6B6B6B]">
            Letzte automatische Prüfung: <time dateTime={report.lastChecked ?? undefined}>{lastCheckedLabel}</time>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {report.categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-[#8A8A8A]">
          Dieses Dokument dient der Transparenz gegenüber Kunden und Behörden.
          <br />
          <Link href="/" className="text-[#2D5A2D] hover:underline">
            Zurück zur Startseite
          </Link>
        </p>
      </div>
    </div>
  )
}
