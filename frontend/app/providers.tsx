"use client";

import { Suspense } from "react";
import { SessionProvider } from "next-auth/react";
import { TopLoader } from "@/components/TopLoader";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Suspense fallback={null}>
        <TopLoader />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
