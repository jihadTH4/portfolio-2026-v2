import { useApp } from "../context";
import { SKILLS, type Skill } from "../data";
import { Heading, Reveal, TILE } from "./ui";

// Very dark brand colors (Django, GitHub...) would vanish in dark mode, so they follow the text color instead.
const isDark = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b < 60;
};

function Logo({ skill, i }: { skill: Skill; i: number }) {
  const { brand, fallback: Fallback } = skill;
  if (brand) {
    const dark = isDark(brand.hex);
    return (
      <span className="sq w-12 h-12 grid place-items-center shrink-0" style={{ background: dark ? "var(--line)" : `#${brand.hex}22` }}>
        <svg viewBox="0 0 24 24" className="w-6 h-6" role="img" aria-label={skill.name} fill={dark ? "currentColor" : `#${brand.hex}`}>
          <path d={brand.path} />
        </svg>
      </span>
    );
  }
  return Fallback ? (
    <span className={`${TILE[i % 5]} sq w-12 h-12 grid place-items-center text-white shrink-0`}><Fallback className="w-6 h-6" /></span>
  ) : null;
}

export function Skills() {
  const { t } = useApp();
  return (
    <section id="skills" className="cv max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28">
      <Heading kicker={t.skills.kicker} title={t.skills.title} />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {SKILLS.map((s, i) => (
          <Reveal key={s.name} delay={Math.min(i * 0.05, 0.4)} y={24}>
            <div className="card p-4 flex items-center gap-3 transition-transform duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-c1/10">
              <Logo skill={s} i={i} />
              <span className="font-display text-xs font-bold tracking-wider">{s.name}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
