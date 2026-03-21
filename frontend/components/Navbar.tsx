"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export function Navbar() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(stored || systemPreference);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-slate-900/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 dark:border-slate-800">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white font-bold">
            LS
          </div>
          <span className="text-xl font-bold tracking-tight text-indigo-900 dark:text-indigo-400">LOKSETU</span>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="/" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            {t("nav.home")}
          </Link>
          <Link href="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            {t("nav.track")}
          </Link>
          {(session?.user as any)?.role === "ADMIN" && (
            <Link href="/admin/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              {t("nav.admin")}
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {mounted && (
            <select
              title="Select Language"
              className="text-xs sm:text-sm bg-transparent border border-slate-300 dark:border-slate-700 rounded-md p-1 pl-2 pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer dark:text-slate-100"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="gray" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>')`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 4px center' }}
            >
              <option value="English">EN</option>
              <option value="Hindi">हिंदी</option>
              <option value="Punjabi">ਪੰਜਾਬੀ</option>
            </select>
          )}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden sm:flex text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md"></div>
          ) : session ? (
            <>
              <Link 
                href={(session.user as any)?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"} 
                className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                {t("nav.dashboard")}
              </Link>
              <Button 
                onClick={() => signOut({ callbackUrl: '/' })} 
                variant="outline" 
                size="sm"
                className="text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border-slate-300 dark:border-slate-700"
              >
                {t("nav.signout")}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                {t("nav.login")}
              </Link>
              <Link href="/login" className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-3 py-1.5 md:px-4 md:py-2 rounded-md transition-colors shadow-sm whitespace-nowrap">
                {t("nav.portal")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
