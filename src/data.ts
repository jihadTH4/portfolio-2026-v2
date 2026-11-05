import type { LucideIcon } from "lucide-react";
import { Database, Sparkles } from "lucide-react";
import { siCss, siDjango, siGit, siHtml5, siJavascript, siPython, siReact, siSass, siTailwindcss, type Brand } from "./brandIcons";
import me from "./assets/me.webp";
import p1 from "./assets/p1.webp";
import p2 from "./assets/p2.webp";
import p3 from "./assets/p3.webp";

export const LINKS = {
  github: "https://github.com/jihadTH4",
  whatsapp: "https://wa.me/970595665806",
  mentor: "https://www.frontendmentor.io/profile/jihadTH4",
  instagram: "https://www.instagram.com/thabitjihad",
  mail: "thabtjhad37@gmail.com",
  cs50: "https://cs50.harvard.edu/certificates/918f81d0-62dc-474e-8a3f-f8199098fb3f",
};

export { me };

export interface Skill { name: string; brand?: Brand; fallback?: LucideIcon }
export const SKILLS: Skill[] = [
  { name: "HTML5", brand: siHtml5 },
  { name: "CSS3", brand: siCss },
  { name: "JAVASCRIPT", brand: siJavascript },
  { name: "REACT", brand: siReact },
  { name: "TAILWIND", brand: siTailwindcss },
  { name: "SASS/SCSS", brand: siSass },
  { name: "GIT / GITHUB", brand: siGit },
  { name: "DJANGO", brand: siDjango },
  { name: "PYTHON", brand: siPython },
  { name: "SQL", fallback: Database },
  { name: "AI TOOLS", fallback: Sparkles },
];

export const PROJECTS = [
  { image: p1, tags: ["REACT", "TAILWIND"], link: "https://blogr-landing-page-main-vercel-wzij.vercel.app/", code: "https://github.com/jihadTH4/blogr-landing-page-main/tree/master" },
  { image: p2, tags: ["HTML", "SCSS"], link: "https://huddle-landing-page-jith.netlify.app/", code: "https://github.com/jihadTH4/Huddle-landing-page-with-curved-sections" },
  { image: p3, tags: ["JAVASCRIPT", "UI/UX"], link: "https://newsletter-sign-up-jth.netlify.app/", code: "https://github.com/jihadTH4/newsletter-sign-up-with-success-message-main" },
];

export const translations = {
  en: {
    nav: { work: "Work", skills: "Skills", contact: "Contact", cta: "Let's Talk" },
    hero: { first: "JIHAD", last: "THABIT", sub: "Personal & Creative. Making any design real and responsive with 2026 digital craftsmanship.", cta: "View My Work" },
    skills: { kicker: "Expertise", title: "Technical Stack" },
    work: { kicker: "Portfolio", title: "Selected Projects", more: "More Projects", live: "Live", code: "Code",
      items: [
        { title: "Blogr Landing Page", desc: "A responsive Blogr landing page built with React & CSS featuring futuristic layouts." },
        { title: "Huddle Landing Page", desc: "Huddle landing page with curved sections built with HTML & Sass/SCSS with clean aesthetics." },
        { title: "Newsletter Sign-up", desc: "Interactive newsletter sign-up form with validation and success state handling." },
      ] },
    cert: { kicker: "Certifications", title: "Education & Certificates", name: "CS50 Certificate", desc: "Completed CS50x: Introduction to Computer Science from Harvard" },
    contact: { title: "Let's work together", sub: "Have a project in mind or just want to chat? Reach out and let's create something extraordinary together.", avail: "Available for freelance & full-time opportunities" },
    footer: { rights: "© 2026 JIHAD THABIT. ENGINEERED WITH PRECISION.", ig: "Instagram", wa: "WhatsApp", gh: "GitHub" },
    brand: "JIHAD",
  },
  ar: {
    nav: { work: "أعمالي", skills: "مهاراتي", contact: "تواصل معي", cta: "لنحدث فرقاً" },
    hero: { first: "جهاد", last: "ثابت", sub: "شخصي ومبدع. أجعل أي تصميم حقيقة واستجابة مع براعة رقمية لعام 2026.", cta: "مشاهدة أعمالي" },
    skills: { kicker: "الخبرة", title: "مجموعتي التقنية" },
    work: { kicker: "الأعمال", title: "مشاريع مختارة", more: "مشاريع إضافية", live: "معاينة", code: "الكود",
      items: [
        { title: "صفحة هبوط Blogr", desc: "صفحة هبوط سريعة الاستجابة لـ Blogr تم بناؤها باستخدام React و CSS بتصاميم مستقبلية." },
        { title: "صفحة هبوط Huddle", desc: "صفحة هبوط Huddle مع أقسام منحنية تم بناؤها باستخدام HTML و Sass/SCSS بجماليات نظيفة." },
        { title: "الاشتراك في النشرة الإخبارية", desc: "نموذج اشتراك تفاعلي في النشرة الإخبارية مع التحقق من صحة البيانات وحالة النجاح." },
      ] },
    cert: { kicker: "المؤهلات", title: "شهاداتي", name: "شهادة CS50", desc: "أكملت CS50x: مقدمة في علوم الحاسوب من جامعة هارفارد" },
    contact: { title: "لنعمل معاً", sub: "هل لديك مشروع في بالك أو تريد الدردشة فقط؟ تواصل معي ولنصنع شيئاً استثنائياً معاً.", avail: "متاح للعمل الحر وفرص العمل الكاملة" },
    footer: { rights: "© 2026 جهاد ثابت. صُمم بدقة.", ig: "إنستغرام", wa: "واتساب", gh: "غيت هاب" },
    brand: "جهاد",
  },
};

export type Lang = keyof typeof translations;
