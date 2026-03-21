import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Camera, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { TrackComplaint } from "@/components/TrackComplaint";


export default function Home() {
  return (
    <div className="w-full flex-col flex bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="w-full bg-slate-50 dark:bg-slate-900 py-12 sm:py-16 lg:py-24 xl:py-32 flex flex-col items-center border-b dark:border-slate-800">
        <div className="container px-4 md:px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 text-xs sm:text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-4 sm:mb-6">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mr-2"></span>
            Civic Intelligence Network
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-3xl text-slate-900 dark:text-slate-100 mb-4 sm:mb-6 font-serif leading-tight">
            Bridging the gap between <span className="text-indigo-600 dark:text-indigo-400">Citizens</span> and <span className="text-indigo-600 dark:text-indigo-400">Governance</span>
          </h1>
          <p className="max-w-[700px] text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-6 sm:mb-10 leading-relaxed px-4">
            Fast, transparent, and proactive grievance redressal platform. Driven by AI to automatically route issues, predict failures, and improve civic health scores.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto px-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-full px-6 sm:px-8 shadow-md min-h-[48px]">
                File a Grievance <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-6 sm:px-8 border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 min-h-[48px]">
                View Civic Dashboard
              </Button>
            </Link>
          </div>
          <TrackComplaint />
        </div>
      </section>

      {/* Features Outline */}
      <section className="w-full py-12 sm:py-16 lg:py-20 bg-white dark:bg-slate-950">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Multi-Modal Sensibility</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-400">Report issues your way — in any language.</p>
          </div>

          <div className="grid gap-6 sm:gap-8 lg:gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-md dark:hover:shadow-indigo-500/10 transition-shadow">
               <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                  <Mic className="h-6 w-6" />
               </div>
               <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Voice Input</h3>
               <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Speak your complaint in your regional language. Our AI translates and auto-files it.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-md dark:hover:shadow-indigo-500/10 transition-shadow">
               <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                  <Camera className="h-6 w-6" />
               </div>
               <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Image Validation</h3>
               <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Snap a photo of the incident. Instantly attach proof for clear visibility.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-md dark:hover:shadow-indigo-500/10 transition-shadow">
               <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                  <MapPin className="h-6 w-6" />
               </div>
               <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Smart Routing</h3>
               <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">AI triage directly targets the correct ward and department officials instantly.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-md dark:hover:shadow-indigo-500/10 transition-shadow">
               <div className="h-14 w-14 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-6 w-6" />
               </div>
               <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Civic Health</h3>
               <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Monitoring volume, resolution, and public sentiment to keep governments proactive.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
