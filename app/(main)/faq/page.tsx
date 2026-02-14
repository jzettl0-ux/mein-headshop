'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

const faqs = [
  {
    category: 'Bestellung & Versand',
    questions: [
      {
        q: 'Wie lange dauert die Lieferung?',
        a: 'Die Lieferzeit beträgt innerhalb Deutschlands 2-5 Werktage. Bei 18+ Produkten kann es durch die Altersverifikation zu leichten Verzögerungen kommen.',
      },
      {
        q: 'Wie hoch sind die Versandkosten?',
        a: 'Der Versand kostet 4,90€. Bei Bestellungen mit 18+ Produkten fallen zusätzliche 2,00€ für die DHL Altersverifikation an. Ab 50€ Bestellwert liefern wir versandkostenfrei.',
      },
      {
        q: 'Kann ich meine Bestellung verfolgen?',
        a: 'Ja! Sobald dein Paket versandt wurde, erhältst du per Email eine Tracking-Nummer. Du kannst den Versandstatus auch in deinem Account-Bereich einsehen.',
      },
    ],
  },
  {
    category: 'Altersverifikation (18+)',
    questions: [
      {
        q: 'Warum muss ich mein Alter bestätigen?',
        a: 'Viele unserer Produkte dürfen gesetzlich nur an Personen über 18 Jahre verkauft werden. Die Altersverifikation ist rechtlich vorgeschrieben.',
      },
      {
        q: 'Was ist die DHL Alterssichtprüfung?',
        a: 'Bei 18+ Produkten erfolgt die Zustellung ausschließlich per DHL mit Alterssichtprüfung. Der Zusteller überprüft deinen Ausweis. Die Gebühr beträgt 2,00€.',
      },
      {
        q: 'Was passiert wenn ich nicht zuhause bin?',
        a: 'DHL hinterlegt eine Benachrichtigung und versucht die Zustellung erneut. Du kannst das Paket auch in einer Filiale abholen - dort erfolgt ebenfalls die Altersprüfung.',
      },
    ],
  },
  {
    category: 'Produkte & Qualität',
    questions: [
      {
        q: 'Sind alle Produkte original?',
        a: 'Ja, wir verkaufen ausschließlich Original-Produkte von namhaften Herstellern und unseren Partner-Influencern. Jedes Produkt wird von uns geprüft.',
      },
      {
        q: 'Was ist der Unterschied zwischen Store-Produkten und Influencer-Editionen?',
        a: 'Store-Produkte sind von uns kuratiert und geprüft. Influencer-Editionen sind exklusive Kollektionen, die von unseren Partner-Influencern persönlich ausgewählt und designed wurden.',
      },
      {
        q: 'Gibt es eine Garantie?',
        a: 'Ja, alle Produkte haben die gesetzliche Gewährleistung von 2 Jahren. Bei Defekten kontaktiere uns einfach.',
      },
    ],
  },
  {
    category: 'Zahlung & Rückgabe',
    questions: [
      {
        q: 'Welche Zahlungsmethoden akzeptiert ihr?',
        a: 'Wir akzeptieren Kreditkarte, PayPal, iDEAL, Sofortüberweisung und weitere Zahlungsmethoden über unseren Partner Mollie.',
      },
      {
        q: 'Kann ich eine Bestellung stornieren?',
        a: 'Solange die Bestellung noch nicht versandt wurde, kannst du sie kostenfrei stornieren. Kontaktiere uns einfach mit deiner Bestellnummer.',
      },
      {
        q: 'Wie funktioniert die Rückgabe?',
        a: 'Du hast 14 Tage Widerrufsrecht. Produkte müssen unbenutzt und in Originalverpackung sein. Kontaktiere uns für ein Rücksendelabel.',
      },
    ],
  },
]

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border-b border-luxe-gray last:border-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-luxe-gold transition-colors"
      >
        <span className="text-white font-semibold pr-4">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-luxe-gold flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              <p className="text-luxe-silver leading-relaxed">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-luxe-black py-12">
      <div className="container-luxe max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-4">Häufig gestellte Fragen (FAQ)</h1>
        <p className="text-luxe-silver text-lg mb-12">
          Hier findest du Antworten auf die wichtigsten Fragen rund um deinen Einkauf bei Premium Headshop.
        </p>

        <div className="space-y-8">
          {faqs.map((category) => (
            <Card key={category.category} className="bg-luxe-charcoal border-luxe-gray">
              <CardHeader>
                <h2 className="text-2xl font-bold text-white">{category.category}</h2>
              </CardHeader>
              <CardContent>
                {category.questions.map((faq) => (
                  <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-luxe-gold/10 border-luxe-gold/30 mt-12">
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-bold text-white mb-3">
              Weitere Fragen?
            </h3>
            <p className="text-luxe-silver mb-4">
              Unser Support-Team hilft dir gerne weiter!
            </p>
            <a
              href="mailto:support@premium-headshop.de"
              className="inline-flex items-center justify-center h-11 rounded-md px-8 bg-luxe-gold text-luxe-black hover:bg-luxe-gold/90 font-semibold tracking-wide transition-colors"
            >
              Kontakt aufnehmen
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
