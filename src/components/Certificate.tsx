import { Award, ExternalLink } from "lucide-react";
import { useApp } from "../context";
import { LINKS } from "../data";
import { Heading, Reveal } from "./ui";

export function Certificate() {
  const { t } = useApp();
  return (
    <section id="certificates" className="cv max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
      <Heading kicker={t.cert.kicker} title={t.cert.title} />
      <Reveal>
        <div className="card card-lg p-6 md:p-10 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 md:gap-6">
            <span className="sq bg-c3 text-white w-14 h-14 grid place-items-center shrink-0"><Award className="w-7 h-7" /></span>
            <div>
              <h3 className="font-display text-lg md:text-2xl font-bold mb-1">{t.cert.name}</h3>
              <p className="text-sm md:text-base text-mute">{t.cert.desc}</p>
            </div>
          </div>
          <a href={LINKS.cs50} target="_blank" rel="noopener noreferrer" className="icon-btn shrink-0" aria-label={t.cert.name}><ExternalLink className="w-5 h-5" /></a>
        </div>
      </Reveal>
    </section>
  );
}
