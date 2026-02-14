'use client'

import { motion } from 'framer-motion'

/* Echtes Hanfblatt (Cannabis) – 7 Finger, typische Form */
function HanfblattIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" fill="currentColor" className={className} aria-hidden>
      {/* Symmetrisches Blatt: Spitze oben, Stiel unten, 3 Zacken links, 3 rechts, 1 Mitte */}
      <path d="
        M32 2
        L36 14 L42 18 L40 26 L44 32 L38 40 L36 52 L32 78
        L28 52 L26 40 L20 32 L24 26 L22 18 L28 14
        Z
      " />
    </svg>
  )
}

/* Echte Bong – Standfuß, Bauch, Hals, Mundstück, Bowl-Arm mit Kopf */
function BongIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 80" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {/* Standfuß (flach) */}
      <path d="M20 76 L44 76 L42 74 L22 74 Z" />
      {/* Wasserkammer (runder Bauch) */}
      <path d="M20 74 Q16 60 20 48 Q24 40 32 40 Q40 40 44 48 Q48 60 44 74" />
      {/* Hals (Röhre) */}
      <rect x="28" y="24" width="8" height="20" rx="1" />
      {/* Mundstück (oberer Rand) */}
      <path d="M26 24 L38 24" strokeWidth="2.5" />
      {/* Downstem + Bowl (seitlich abgewinkelt) */}
      <path d="M44 52 L54 46 L56 42" />
      <circle cx="56" cy="42" r="4" fill="currentColor" />
    </svg>
  )
}

/* Echter Grinder – Draufsicht: zwei Etagen, Zähne innen */
function GrinderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
      {/* Untere Etage (äußerer Ring) */}
      <circle cx="32" cy="32" r="26" />
      <circle cx="32" cy="32" r="18" />
      {/* Zähne (innen, wie bei Grinder) – kleine Rechtecke im Kreis */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180
        const x = 32 + 20 * Math.cos(r)
        const y = 32 + 20 * Math.sin(r)
        return (
          <rect
            key={deg}
            x={x - 3}
            y={y - 2}
            width="6"
            height="4"
            fill="currentColor"
            transform={`rotate(${deg} ${x} ${y})`}
          />
        )
      })}
      {/* Mittlerer Bereich (Kief-Sieb) */}
      <circle cx="32" cy="32" r="8" strokeDasharray="2 2" />
    </svg>
  )
}

const items: { Icon: React.ComponentType<{ className?: string }>; label: string; size: number; x: string; y: string; delay: number; blur: boolean }[] = [
  { Icon: BongIcon, label: 'Bongs', size: 120, x: '5%', y: '15%', delay: 0, blur: true },
  { Icon: GrinderIcon, label: 'Grinder', size: 90, x: '88%', y: '25%', delay: 0.5, blur: true },
  { Icon: HanfblattIcon, label: 'Hanfblatt', size: 80, x: '12%', y: '70%', delay: 1, blur: true },
  { Icon: BongIcon, label: 'Bongs', size: 100, x: '85%', y: '65%', delay: 0.3, blur: true },
  { Icon: HanfblattIcon, label: 'Hanfblatt', size: 60, x: '75%', y: '12%', delay: 0.8, blur: true },
  { Icon: GrinderIcon, label: 'Grinder', size: 70, x: '8%', y: '45%', delay: 0.2, blur: true },
  { Icon: HanfblattIcon, label: 'Hanfblatt', size: 50, x: '92%', y: '82%', delay: 0.6, blur: true },
  { Icon: BongIcon, label: 'Bongs', size: 55, x: '25%', y: '88%', delay: 0.4, blur: true },
  { Icon: GrinderIcon, label: 'Grinder', size: 45, x: '65%', y: '42%', delay: 0.7, blur: true },
  { Icon: HanfblattIcon, label: 'Hanfblatt', size: 65, x: '42%', y: '18%', delay: 0.1, blur: true },
]

export function DecorativeProductBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden
    >
      {/* Sanfter Verlauf für Tiefe */}
      <div className="absolute inset-0 bg-gradient-to-br from-luxe-primary/10 via-transparent to-luxe-accent/10" />
      {/* Kiffer-Motive: Hanfblatt, Bong, Grinder – eigene SVGs */}
      {items.map(({ Icon, size, x, y, delay, blur }, i) => (
        <motion.div
          key={`${i}-${x}-${y}`}
          className="absolute opacity-[0.08] text-luxe-primary"
          style={{
            left: x,
            top: y,
            width: size,
            height: size,
            filter: blur ? 'blur(2px)' : undefined,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.08, 0.14, 0.08],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 8 + i * 0.5,
            repeat: Infinity,
            delay: delay * 2,
            ease: 'easeInOut',
          }}
        >
          <Icon className="w-full h-full" />
        </motion.div>
      ))}
      {/* Weiche Lichtkreise für Atmosphäre */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] rounded-full bg-luxe-primary/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] rounded-full bg-luxe-accent/10 blur-3xl" />
    </div>
  )
}
