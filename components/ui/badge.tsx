import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* Einheitliche Höhe für Produkt-Badges (Bestseller, Store-Highlight, 18+, …) */
const productBadgeSize = "h-5 min-h-5 inline-flex items-center px-2 text-[10px] font-semibold leading-none rounded-full"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        /* 18+ – einheitliche Höhe mit anderen Produkt-Badges */
        adult:
          `badge-adult border-2 border-amber-400 bg-amber-500 text-black font-bold min-w-0 shrink-0 w-fit shadow-sm ${productBadgeSize}`,
        /* Store-Highlight – einheitliche Höhe */
        featured:
          `badge-featured border-transparent bg-amber-500 text-black border-amber-400 font-bold min-w-0 w-fit ${productBadgeSize}`,
        /* Influencer-Edition – einheitliche Höhe */
        influencer:
          `badge-influencer border-transparent bg-violet-600 text-white font-bold border-none shadow-md min-w-0 w-fit ${productBadgeSize}`,
        /* Nur X verfügbar – einheitliche Höhe */
        stock:
          `badge-stock border-transparent bg-amber-700/90 text-white font-semibold min-w-0 shrink-0 w-fit ${productBadgeSize}`,
        neon:
          "border-transparent bg-luxe-neon/20 text-luxe-neon border-luxe-neon/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      data-badge-variant={variant}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
