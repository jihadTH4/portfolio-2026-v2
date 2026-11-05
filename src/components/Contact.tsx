import { Code, Mail, MessageCircle, Award } from "lucide-react";
import { useApp } from "../context";
import { LINKS } from "../data";
import { Reveal } from "./ui";

export function Contact() {
  const { t } = useApp();
  return (
    <section id="contact" className="cv max-w-6xl mx-auto px-5 md:px-8 py-16 md:py-24">
      <Reveal y={48}>
        <div className="card-lg relative overflow-hidden p-8 md:p-16 text-white bg-linear-to-br from-c1 via-c2 to-c3 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="absolute -top-16 -end-16 w-56 h-56 rounded-full border-30 border-white/15" />
          <div className="absolute -bottom-10 start-1/3 w-24 h-24 sq bg-white/15 rotate-12" />
          <div className="relative text-center lg:text-start max-w-xl">
            <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-5 leading-tight">{t.contact.title}</h2>
            <p className="text-white/85 mb-8 leading-relaxed">{t.contact.sub}</p>
            <a href={`mailto:${LINKS.mail}`} className="btn bg-white text-c1 !px-6 !py-4 text-base md:text-lg break-all"><Mail className="w-5 h-5 shrink-0" />{LINKS.mail}</a>
          </div>
          <div className="relative flex flex-col items-center lg:items-end gap-6">
            <div className="flex gap-3">
              {[[Code, LINKS.github, "GitHub"], [MessageCircle, LINKS.whatsapp, "WhatsApp"], [Award, LINKS.mentor, "Frontend Mentor"]].map(([Icon, href, label]) => {
                const I = Icon as typeof Code;
                return <a key={href as string} href={href as string} target="_blank" rel="noopener noreferrer" aria-label={label as string} className="btn bg-white/20 hover:bg-white/30 !p-4"><I className="w-6 h-6" /></a>;
              })}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80 text-center lg:text-end max-w-56">{t.contact.avail}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function Footer() {
  const { t } = useApp();
  const links = [[t.footer.ig, LINKS.instagram], [t.footer.wa, LINKS.whatsapp], [t.footer.gh, LINKS.github]];
  return (
    <footer className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-5 border-t border-line text-xs font-semibold text-mute">
      <p>{t.footer.rights}</p>
      <div className="flex gap-6">
        {links.map(([n, h]) => <a key={h} href={h} target="_blank" rel="noopener noreferrer" className="hover:text-c1 transition-colors">{n}</a>)}
      </div>
    </footer>
  );
}
