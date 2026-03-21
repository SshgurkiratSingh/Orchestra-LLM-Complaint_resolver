import re

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/layout.tsx", "r") as f:
    text = f.read()

# Add imports
imports = """import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
"""

# Let's just create a Client Component for Navbar to handle "useSession" and hydration correctly, and wrap children in Providers in layout.tsx
# Or, even better, if we make layout.tsx simple and use a Navbar:

new_layout = """import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Navbar } from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LOKSETU | AI-Powered Public Service CRM',
  description: 'Smart Grievance Management, Civic Health analytics, and transparent citizen communication.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50 text-slate-900`}>
        <Providers>
          <Navbar />
          <main className="flex-1 flex flex-col items-center">
            {children}
          </main>
          <footer className="w-full border-t bg-white py-6 mt-auto">
            <div className="container mx-auto text-center text-sm text-slate-500">
              <p>&copy; {new Date().getFullYear()} LOKSETU Public Services. AI-Powered Civic Governance.</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
"""

with open("/home/gurkirat/Projects/DELHI_28/frontend/app/layout.tsx", "w") as f:
    f.write(new_layout)

