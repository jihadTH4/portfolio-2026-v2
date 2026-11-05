import { m, useScroll, useSpring, useTransform, type MotionValue } from "motion/react";
import { memo, type ReactNode } from "react";

const C = { c1: "#6d5efc", c2: "#ff5c8a", c3: "#ffb020", c4: "#12cfa0", c5: "#1fa8ff" };

const LINES = [
  { d: "M-60 140 C 240 -80 380 460 640 280 S 920 40 1080 320", g: "g1", w: 7, r: [0.2, 1] },
  { d: "M-60 620 C 200 380 420 900 700 640 S 940 520 1080 760", g: "g2", w: 5, r: [0, 0.85] },
  { d: "M300 -60 C 120 240 520 380 380 640 S 220 900 520 1080", g: "g3", w: 4, r: [0.1, 0.7] },
];

function Line({ p, d, g, w, r }: { p: MotionValue<number>; d: string; g: string; w: number; r: number[] }) {
  const pathLength = useTransform(p, [0, 1], r);
  return <m.path d={d} stroke={`url(#${g})`} strokeWidth={w} fill="none" strokeLinecap="round" style={{ pathLength }} />;
}

function Float({ p, to, spin, children }: { p: MotionValue<number>; to: number; spin: number; children: ReactNode }) {
  const y = useTransform(p, [0, 1], [0, to]);
  const rotate = useTransform(p, [0, 1], [0, spin]);
  return <m.g style={{ y, rotate }}>{children}</m.g>;
}

/** One fixed SVG layer: curvy lines draw themselves while scrolling, shapes drift/rotate (transform-only, GPU friendly). */
export const Background = memo(function Background() {
  const { scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 30, restDelta: 0.001 });

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          {[["g1", C.c1, C.c2], ["g2", C.c4, C.c5], ["g3", C.c3, C.c2]].map(([id, a, b]) => (
            <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} />
            </linearGradient>
          ))}
        </defs>
        <g opacity=".55">{LINES.map((l) => <Line key={l.g} p={p} {...l} />)}</g>
        <g opacity=".5">
          <Float p={p} to={-260} spin={180}><circle cx="860" cy="170" r="54" fill="none" stroke={C.c2} strokeWidth="14" /></Float>
          <Float p={p} to={200} spin={-120}><path d="M110 330 l62 106 h-124 z" fill={C.c3} /></Float>
          <Float p={p} to={-180} spin={90}><rect x="820" y="520" width="84" height="84" rx="22" fill={C.c5} /></Float>
          <Float p={p} to={240} spin={140}><path d="M90 760 a62 62 0 0 1 124 0 z" fill={C.c4} /></Float>
          <Float p={p} to={-300} spin={220}><path d="M520 90 v70 M485 125 h70" stroke={C.c1} strokeWidth="14" strokeLinecap="round" /></Float>
          <Float p={p} to={160} spin={-200}><rect x="640" y="820" width="64" height="64" rx="16" fill="none" stroke={C.c1} strokeWidth="12" /></Float>
        </g>
      </svg>
    </div>
  );
});
