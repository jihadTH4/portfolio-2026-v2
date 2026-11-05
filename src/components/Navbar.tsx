import { m, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import { Languages, Menu, Moon, Sun, X } from "lucide-react";
import { useApp } from "../context";

const KEYS = ["work", "skills", "contact"] as const;

export function Navbar() {
  const { lang, t, theme, toggleLang, toggleTheme } = useApp();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY, scrollYProgress } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled((s) => (s === v > 40 ? s : v > 40)));

  return (
    <>
      <m.div className="fixed inset-x-0 top-0 z-[60] h-1 bg-linear-to-r from-c1 via-c2 to-c3" style={{ scaleX: scrollYProgress, originX: lang === "ar" ? 1 : 0 }} />
    <header className="fixed inset-x-0 top-0 z-50 px-3 md:px-8 pt-3">
      <nav className={`mx-auto max-w-6xl card flex items-center justify-between gap-3 px-4 py-2.5 transition-shadow duration-300 ${scrolled ? "shadow-xl shadow-c1/10 backdrop-blur-md" : ""}`}>
        <a href="#hero" className="font-display text-xl font-black tracking-tight">{t.brand}<span className="grad">.</span></a>

        <div className="hidden md:flex gap-8 text-sm font-medium text-mute">
          {KEYS.map((k) => <a key={k} href={`#${k}`} className="hover:text-fg transition-colors">{t.nav[k]}</a>)}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleLang} className="icon-btn !px-3 text-xs font-bold" aria-label="Toggle language">
            <Languages className="w-4 h-4" />{lang === "en" ? "AR" : "EN"}
          </button>
          <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <a href="#contact" className="btn btn-primary hidden md:inline-flex !py-2.5">{t.nav.cta}</a>
          <button onClick={() => setOpen(!open)} className="icon-btn md:hidden" aria-label="Menu" aria-expanded={open}>
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="pop md:hidden mx-auto max-w-6xl mt-2 card bg-bg p-3 flex flex-col gap-1 shadow-2xl">
          {KEYS.map((k) => (
            <a key={k} href={`#${k}`} onClick={() => setOpen(false)} className="sq px-4 py-3 font-display font-bold hover:bg-line/60">{t.nav[k]}</a>
          ))}
          <a href="#contact" onClick={() => setOpen(false)} className="btn btn-primary mt-1">{t.nav.cta}</a>
        </div>
      )}

    </header>
    </>
  );
}
