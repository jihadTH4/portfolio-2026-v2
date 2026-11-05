import { ArrowUpRight, Code, Eye } from "lucide-react";
import { useApp } from "../context";
import { LINKS, PROJECTS } from "../data";
import { Heading, Reveal } from "./ui";

export function Projects() {
  const { lang, t } = useApp();
  return (
    <section id="work" className="cv max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-28">
      <div className="flex items-end justify-between">
        <Heading kicker={t.work.kicker} title={t.work.title} />
        <a href={LINKS.mentor} target="_blank" rel="noopener noreferrer" className="hidden md:inline-flex btn btn-ghost mb-16">
          {t.work.more}<ArrowUpRight className={`w-4 h-4 ${lang === "ar" ? "-scale-x-100" : ""}`} />
        </a>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROJECTS.map((p, i) => {
          const txt = t.work.items[i];
          return (
            <Reveal key={p.link} delay={i * 0.12} y={48}>
              <article className="card group overflow-hidden h-full flex flex-col transition-shadow duration-500 hover:shadow-2xl hover:shadow-c1/15">
                <div className="aspect-video overflow-hidden">
                  <img src={p.image} alt={txt.title} loading="lazy" decoding="async" width={800} height={450} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-6 flex flex-col gap-4 grow">
                  <h3 className="font-display text-xl font-bold">{txt.title}</h3>
                  <p className="text-mute text-sm leading-relaxed grow">{txt.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.tags.map((tag) => <span key={tag} className="sq bg-c1/10 text-c1 px-3 py-1 text-[10px] font-bold tracking-wider">{tag}</span>)}
                  </div>
                  <div className="flex gap-2">
                    <a href={p.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary !py-2.5"><Eye className="w-4 h-4" />{t.work.live}</a>
                    <a href={p.code} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-2.5"><Code className="w-4 h-4" />{t.work.code}</a>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
