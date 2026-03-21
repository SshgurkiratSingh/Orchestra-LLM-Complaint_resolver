import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
        <header className="sticky top-0 z-50 w-full border-b bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600 text-white font-bold">
                LS
              </div>
              <span className="text-xl font-bold tracking-tight text-indigo-900">LOKSETU</span>
            </div>
            <nav className="hidden md:flex gap-6 text-sm font-medium">
              <a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">Services</a>
              <a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">Track Complaint</a>
              <a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">Dashboards</a>
            </nav>
            <div className="flex items-center gap-4">
              <a href="/login" className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                Official Login
              </a>
              <a href="/login" className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md transition-colors shadow-sm">
                Citizen Portal
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center">
          {children}
        </main>
        
        <footer className="w-full border-t bg-white py-6 mt-auto">
          <div className="container mx-auto text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} LOKSETU Public Services. AI-Powered Civic Governance.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
