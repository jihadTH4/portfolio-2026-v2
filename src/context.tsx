import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations, type Lang } from "./data";

type Theme = "light" | "dark";
interface Ctx { lang: Lang; t: (typeof translations)["en"]; theme: Theme; toggleLang: () => void; toggleTheme: () => void }
const AppCtx = createContext<Ctx | null>(null);

// Initial values come from the inline script in index.html (no flash on load).
const root = () => document.documentElement;

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (root().lang === "en" ? "en" : "ar"));
  const [theme, setTheme] = useState<Theme>(() => (root().classList.contains("dark") ? "dark" : "light"));

  useEffect(() => {
    const r = root();
    r.lang = lang;
    r.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    root().classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleLang = useCallback(() => setLang((l) => (l === "ar" ? "en" : "ar")), []);
  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  const value = useMemo(() => ({ lang, t: translations[lang], theme, toggleLang, toggleTheme }), [lang, theme, toggleLang, toggleTheme]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}
