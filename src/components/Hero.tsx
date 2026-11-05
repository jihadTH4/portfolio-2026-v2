import { m, useScroll, useTransform } from "motion/react";
import { ArrowRight, Code, MessageCircle, Award } from "lucide-react";
import { useApp } from "../context";
import { LINKS, me } from "../data";

export function Hero() {
  const { lang, t } = useApp();
  const { scrollYProgress } = useScroll();
  const imgY = useTransform(scrollYProgress, [0, 0.25], [0, 80]);
  const textY = useTransform(scrollYProgress, [0, 0.25], [0, -40]);

  return (
    <section id="hero" className="min-h-svh max-w-6xl mx-auto px-5 md:px-8 pt-28 pb-16 grid lg:grid-cols-12 gap-12 items-center">
      <m.div style={{ y: textY }} initial={{ opacity: 0, x: lang === "ar" ? 40 : -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="lg:col-span-7 text-center lg:text-start">
        <h1 className="font-display font-extrabold uppercase leading-[0.95] tracking-tight text-5xl sm:text-7xl lg:text-8xl mb-6">
          <span className="block">{t.hero.first}</span>
          <span className="grad">{t.hero.last}</span>
        </h1>
        <p className="text-lg md:text-xl text-mute max-w-xl mx-auto lg:mx-0 mb-9 leading-relaxed">{t.hero.sub}</p>
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
          <a href="#work" className="btn btn-primary group">
            {t.hero.cta}
            <ArrowRight className={`w-4 h-4 transition-transform ${lang === "ar" ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
          </a>
          {[[Code, LINKS.github, "GitHub"], [MessageCircle, LINKS.whatsapp, "WhatsApp"], [Award, LINKS.mentor, "Frontend Mentor"]].map(([Icon, href, label]) => {
            const I = Icon as typeof Code;
            return <a key={href as string} href={href as string} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={label as string}><I className="w-5 h-5" /></a>;
          })}
        </div>
      </m.div>

      <m.div style={{ y: imgY }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.15 }} className="lg:col-span-5 relative flex justify-center">
        <div className="float absolute -top-4 -start-2 w-16 h-16 sq bg-c3" />
        <div className="float absolute -bottom-5 -end-3 w-20 h-20 rounded-full border-[14px] border-c2" style={{ animationDelay: "-2s" }} />
        <div className="float absolute top-1/2 -end-6 w-10 h-10 sq bg-c4 rotate-12" style={{ animationDelay: "-4s" }} />
        <div className="relative w-full max-w-md aspect-square card-lg p-2 bg-linear-to-br from-c1 via-c2 to-c3">
          <img src={me} alt="Jihad Thabit" width={450} height={450} fetchPriority="high" decoding="async" className="w-full h-full object-cover object-top card-lg" />
        </div>
      </m.div>
    </section>
  );
}
