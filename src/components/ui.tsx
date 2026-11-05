import { m } from "motion/react";
import type { ReactNode } from "react";

/** Fade + rise when the element enters the viewport (runs once). */
export function Reveal({ children, delay = 0, y = 32, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </m.div>
  );
}

export function Heading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-12 md:mb-16">
      <Reveal><span className="kicker">{kicker}</span></Reveal>
      <Reveal delay={0.08}><h2 className="font-display text-4xl md:text-6xl font-extrabold leading-tight">{title}</h2></Reveal>
    </div>
  );
}

export const TILE = ["bg-c1", "bg-c2", "bg-c3", "bg-c4", "bg-c5"];
