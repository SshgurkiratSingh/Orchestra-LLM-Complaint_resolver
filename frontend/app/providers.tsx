"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { TopLoader } from "@/components/TopLoader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { LanguageProvider } from "@/contexts/LanguageContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <ThemeProvider>
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          <Navbar />
          <main className="flex-1 flex flex-col items-center">
            {children}
          </main>
          <footer className="w-full border-t bg-white dark:bg-slate-900 dark:border-slate-800 py-6 mt-auto">
            <div className="container mx-auto text-center text-sm text-slate-500 dark:text-slate-400">
              <p>&copy; {new Date().getFullYear()} LOKSETU Public Services. AI-Powered Civic Governance.</p>
            </div>
          </footer>
        </ThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
