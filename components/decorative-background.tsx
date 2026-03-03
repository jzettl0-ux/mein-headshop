"use client";

import React from "react";

const iconBase =
  "absolute text-slate-500 object-contain pointer-events-none select-none";
const opacityStyle = { opacity: 0.65 };

/** Bong: Standfuß, Bauch, Hals, Mundstück, Bowl-Arm */
function BongIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M28 112 L52 112 L48 108 L32 108 Z" />
      <path d="M28 108 Q24 88 28 68 Q32 54 40 54 Q48 54 52 68 Q56 88 52 108" />
      <rect x="34" y="20" width="12" height="38" rx="2" />
      <path d="M30 20 L50 20" strokeWidth="3" />
      <path d="M52 72 L72 62 L76 56" />
      <circle cx="76" cy="56" r="6" fill="currentColor" />
    </svg>
  );
}

/** Grinder Draufsicht */
function GrinderIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
      aria-hidden
    >
      <circle cx="50" cy="50" r="44" />
      <circle cx="50" cy="50" r="34" />
      <circle cx="50" cy="50" r="12" strokeDasharray="4 3" />
      <path d="M50 22 L50 28 M50 72 L50 78 M22 50 L28 50 M72 50 L78 50" />
      <path d="M32 32 L36 36 M68 68 L72 72 M68 32 L72 36 M32 68 L36 72" />
      <path d="M38 22 L42 26 M62 58 L66 62 M58 38 L62 42 M22 62 L26 66" />
    </svg>
  );
}

/* Links unten: nur ein Bong (ganz unten), der andere weiter oben und weiter innen – keine Überschneidung. Rechts: Icons versetzt (verschiedene right/top), keine starre Linie. */
const MOTIVES = [
  { Icon: BongIcon, size: "w-32 h-42", pos: "top-[6%] left-[4%]", rotate: "rotate-[-32deg]" },
  { Icon: BongIcon, size: "w-28 h-36", pos: "top-[42%] left-[3%]", rotate: "rotate-[28deg]" },
  { Icon: BongIcon, size: "w-22 h-28", pos: "top-[52%] left-[14%]", rotate: "rotate-[-42deg]" },
  { Icon: BongIcon, size: "w-22 h-28", pos: "bottom-[2%] left-[2%]", rotate: "rotate-[38deg]" },
  { Icon: GrinderIcon, size: "w-20 h-20", pos: "top-[22%] left-[10%]", rotate: "rotate-12" },
  /* Rechte Seite: versetzt, nicht in einer Linie */
  { Icon: GrinderIcon, size: "w-16 h-16", pos: "top-[5%] right-[5%]", rotate: "rotate-45" },
  { Icon: GrinderIcon, size: "w-16 h-16", pos: "top-[28%] right-[14%]", rotate: "rotate-[-20deg]" },
  { Icon: BongIcon, size: "w-14 h-18", pos: "top-[46%] right-[6%]", rotate: "rotate-[25deg]" },
  { Icon: GrinderIcon, size: "w-16 h-16", pos: "top-[70%] right-[12%]", rotate: "rotate-12" },
  { Icon: GrinderIcon, size: "w-16 h-16", pos: "bottom-[4%] right-[8%]", rotate: "rotate-[-15deg]" },
] as const;

const DecorativeBackground = () => {
  return (
    <div
      className="decorative-bg fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      aria-hidden
    >
      {MOTIVES.map(({ Icon, size, pos, rotate }, i) => (
        <div
          key={`${i}-${pos}`}
          className={`${iconBase} ${pos} ${size} ${rotate}`}
          style={opacityStyle}
        >
          <Icon className="w-full h-full" />
        </div>
      ))}
    </div>
  );
};

export default DecorativeBackground;
