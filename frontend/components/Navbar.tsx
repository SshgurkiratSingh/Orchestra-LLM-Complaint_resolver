"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white font-bold">
            LS
          </div>
          <span className="text-xl font-bold tracking-tight text-indigo-900">LOKSETU</span>
        </Link>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="/" className="text-slate-600 hover:text-indigo-600 transition-colors">
            Home
          </Link>
          <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 transition-colors">
            Track Complaint
          </Link>
          {(session?.user as any)?.role === "ADMIN" && (
            <Link href="/admin/dashboard" className="text-slate-600 hover:text-indigo-600 transition-colors">
              Admin Area
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="h-9 w-20 animate-pulse bg-slate-200 rounded-md"></div>
          ) : session ? (
            <>
              <Link 
                href={(session.user as any)?.role === "ADMIN" ? "/admin/dashboard" : "/dashboard"} 
                className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
              >
                Dashboard
              </Link>
              <Button 
                onClick={() => signOut({ callbackUrl: '/' })} 
                variant="outline" 
                size="sm"
                className="text-slate-700 hover:text-red-600 hover:bg-red-50"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                Official Login
              </Link>
              <Link href="/login" className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md transition-colors shadow-sm">
                Citizen Portal
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
