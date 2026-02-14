import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-luxe-black flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 404 Number */}
        <div className="text-9xl font-bold text-gradient-gold">
          404
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold text-white">
          Seite nicht gefunden
        </h1>
        <p className="text-luxe-silver text-lg">
          Die Seite, die du suchst, existiert nicht oder wurde verschoben.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Zur Startseite
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center h-11 rounded-md px-8 border border-luxe-gray hover:bg-luxe-gray/20 text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Zum Shop
          </Link>
        </div>
      </div>
    </div>
  )
}
