'use client'

import { motion, useScroll, useTransform } from 'framer-motion'

type IconProps = { className?: string }

/* Minimalistische Glas-Bong (Outline) */
function BongIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 72" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M24 68V44" />
      <path d="M18 44a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v20H18V44z" />
      <path d="M20 38h8M20 36V32a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v4" />
      <path d="M24 28V8" />
      <path d="M22 8h4" />
      <path d="M38 24l-4 4 2 4" />
      <circle cx="38" cy="24" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

/* Stylischer Grinder (Outline, Draufsicht) – gerundete Werte für Hydration-Konsistenz */
function GrinderIcon({ className }: IconProps) {
  const round = (n: number) => Math.round(n * 100) / 100
  return (
    <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className={className} aria-hidden>
      <circle cx="28" cy="28" r="24" />
      <circle cx="28" cy="28" r="16" />
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const r = (deg * Math.PI) / 180
        const x = round(28 + 20 * Math.cos(r))
        const y = round(28 + 20 * Math.sin(r))
        return <line key={deg} x1={28} y1={28} x2={x} y2={y} />
      })}
      <circle cx="28" cy="28" r="6" strokeDasharray="2 1.5" />
    </svg>
  )
}

/* Elegantes Hanfblatt, 7 Finger (Outline) */
function HanfblattIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 52 72" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M26 68 L26 48 L20 42 L14 36 L18 28 L12 22 L26 4 L40 22 L34 28 L38 36 L32 42 L26 48 Z" />
    </svg>
  )
}

/* Dünner Joint (Outline) */
function JointIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 80" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className={className} aria-hidden>
      <path d="M12 76V12" />
      <path d="M10 12h4" />
      <path d="M12 8c-1 0-2 .5-2 2v2c0 1.5 1 2 2 2s2-.5 2-2v-2c0-1.5-1-2-2-2z" />
      <path d="M8 20l2 4 2-4 2 4" strokeWidth="0.9" opacity="0.8" />
    </svg>
  )
}

/* Positionen vor allem am Bildschirmrand (links/rechts), Opacity 5–10 %, Parallax */
const ICONS = [
  { Icon: BongIcon, size: 96, x: '4%', y: '10%', parallax: 0.03 },
  { Icon: GrinderIcon, size: 80, x: '90%', y: '14%', parallax: -0.02 },
  { Icon: HanfblattIcon, size: 72, x: '2%', y: '72%', parallax: 0.04 },
  { Icon: JointIcon, size: 56, x: '92%', y: '58%', parallax: -0.03 },
  { Icon: BongIcon, size: 64, x: '88%', y: '6%', parallax: 0.02 },
  { Icon: HanfblattIcon, size: 52, x: '3%', y: '38%', parallax: -0.04 },
  { Icon: GrinderIcon, size: 58, x: '91%', y: '82%', parallax: 0.025 },
  { Icon: JointIcon, size: 48, x: '6%', y: '24%', parallax: -0.02 },
  { Icon: HanfblattIcon, size: 44, x: '94%', y: '44%', parallax: 0.035 },
  { Icon: BongIcon, size: 50, x: '5%', y: '52%', parallax: -0.025 },
  { Icon: JointIcon, size: 42, x: '88%', y: '28%', parallax: 0.02 },
  { Icon: GrinderIcon, size: 48, x: '93%', y: '66%', parallax: -0.03 },
]

/**
 * Wasserzeichen-Hintergrund für helles Design: Bong, Grinder, Hanfblatt, Joint.
 * Sehr helles Grau / zartes Gold, 5–10 % Opacity, leichter Blur, Parallax beim Scrollen.
 */
export function DecorativeProductBackground() {
  const { scrollYProgress } = useScroll()
  return (
    <div
      className="decorative-product-bg fixed inset-0 pointer-events-none overflow-hidden -z-10"
      aria-hidden
    >
      {ICONS.map(({ Icon, size, x, y, parallax }, i) => (
        <ParallaxIcon
          key={`${i}-${x}-${y}`}
          Icon={Icon}
          size={size}
          x={x}
          y={y}
          parallax={parallax}
          scrollYProgress={scrollYProgress}
          delay={i * 0.12}
        />
      ))}
    </div>
  )
}

function ParallaxIcon({
  Icon,
  size,
  x,
  y,
  parallax,
  scrollYProgress,
  delay,
}: {
  Icon: React.ComponentType<IconProps>
  size: number
  x: string
  y: string
  parallax: number
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress']
  delay: number
}) {
  const yOffset = useTransform(scrollYProgress, [0, 1], [0, parallax * 320])
  return (
    <motion.div
      className="absolute decorative-product-icon text-slate-300"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        opacity: 0.2,
        filter: 'blur(0.5px)',
        y: yOffset,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.2 }}
      transition={{ duration: 1, delay, ease: 'easeOut' }}
    >
      <Icon className="w-full h-full" />
    </motion.div>
  )
}
