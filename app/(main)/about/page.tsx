'use client'

import Link from 'next/link'
import { Shield, Truck, Award, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: 'Qualität',
      description: 'Nur Premium-Produkte aus geprüften Quellen',
    },
    {
      icon: Truck,
      title: 'Diskretion',
      description: 'Neutraler, schneller und sicherer Versand',
    },
    {
      icon: Award,
      title: 'Authentizität',
      description: 'Echte Influencer-Kollektionen, keine Fakes',
    },
    {
      icon: Heart,
      title: 'Community',
      description: 'Von der Community für die Community',
    },
  ]

  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Über <span className="text-gradient-gold">Premium Headshop</span>
          </h1>
          <p className="text-xl text-luxe-silver leading-relaxed">
            Deine erste Adresse für hochwertiges Cannabis-Zubehör. 
            Von Influencern kuratiert, von uns geprüft.
          </p>
        </div>

        {/* Story */}
        <Card className="bg-luxe-charcoal border-luxe-gray mb-12">
          <CardContent className="pt-8 space-y-6">
            <h2 className="text-3xl font-bold text-white mb-4">Unsere Story</h2>
            <p className="text-luxe-silver leading-relaxed text-lg">
              Premium Headshop wurde gegründet, um die Lücke zwischen hochwertigen Cannabis-Produkten 
              und der modernen Influencer-Kultur zu schließen. Wir glauben, dass Qualität und Stil 
              keine Gegensätze sein müssen.
            </p>
            <p className="text-luxe-silver leading-relaxed text-lg">
              Unsere Partnerschaften mit führenden Content-Creators ermöglichen es uns, exklusive 
              Kollektionen anzubieten, die nirgendwo sonst erhältlich sind. Jedes Produkt wird von 
              uns persönlich geprüft und für gut befunden.
            </p>
            <p className="text-luxe-silver leading-relaxed text-lg">
              Ob Glasbongs, Grinder oder Vaporizer - bei uns findest du nur Premium-Qualität. 
              Diskret verpackt und schnell geliefert. Mit Liebe zum Detail und Respekt für die Community.
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Unsere Werte
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <Card key={value.title} className="bg-luxe-charcoal border-luxe-gray">
                <CardContent className="pt-8 text-center">
                  <div className="w-16 h-16 bg-luxe-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-luxe-gold" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-luxe-silver">{value.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Stats */}
        <Card className="bg-gradient-to-r from-luxe-charcoal via-luxe-gray to-luxe-charcoal border-luxe-gold/30">
          <CardContent className="py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-luxe-gold mb-2">3+</div>
                <div className="text-luxe-silver">Partner-Influencer</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-luxe-gold mb-2">100+</div>
                <div className="text-luxe-silver">Premium-Produkte</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-luxe-gold mb-2">24/7</div>
                <div className="text-luxe-silver">Support</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-luxe-gold mb-2">100%</div>
                <div className="text-luxe-silver">Zufriedenheit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Bereit für Premium-Qualität?
          </h2>
          <p className="text-luxe-silver mb-8">
            Entdecke unsere exklusive Auswahl
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center h-14 rounded-md px-10 text-base bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
          >
            Jetzt shoppen
          </Link>
        </div>
      </div>
    </div>
  )
}
