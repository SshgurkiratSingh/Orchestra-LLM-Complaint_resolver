import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, Camera, ShieldCheck, MapPin } from "lucide-react";
import Link from "next/link";
import { TrackComplaint } from "@/components/TrackComplaint";


export default function Home() {
  return (
    <div className="w-full flex-col flex bg-white">
      {/* Hero Section */}
      <section className="w-full bg-slate-50 py-24 lg:py-32 flex flex-col items-center border-b">
        <div className="container px-4 md:px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800 mb-6">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2"></span>
            Civic Intelligence Network
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl max-w-3xl text-slate-900 mb-6 font-serif">
            Bridging the gap between <span className="text-indigo-600">Citizens</span> and <span className="text-indigo-600">Governance</span>
          </h1>
          <p className="max-w-[700px] text-lg text-slate-600 md:text-xl mb-10 leading-relaxed">
            Fast, transparent, and proactive grievance redressal platform. Driven by AI to automatically route issues, predict failures, and improve civic health scores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 shadow-md">
                File a Grievance <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-full px-8 border-slate-300">
                View Civic Dashboard
              </Button>
            </Link>
          </div>
          <TrackComplaint />
        </div>
      </section>

      {/* Features Outline */}
      <section className="w-full py-20 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Multi-Modal Sensibility</h2>
            <p className="mt-4 text-lg text-slate-600">Report issues your way — in any language.</p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
               <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                  <Mic className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-semibold text-slate-900 mb-2">Voice Input</h3>
               <p className="text-slate-600">Speak your complaint in your regional language. Our AI translates and auto-files it.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
               <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                  <Camera className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-semibold text-slate-900 mb-2">Image Validation</h3>
               <p className="text-slate-600">Snap a photo of the incident. Instantly attach proof for clear visibility.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
               <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                  <MapPin className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-semibold text-slate-900 mb-2">Smart Routing</h3>
               <p className="text-slate-600">AI triage directly targets the correct ward and department officials instantly.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-md transition-shadow">
               <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center mb-4 text-indigo-600">
                  <ShieldCheck className="h-6 w-6" />
               </div>
               <h3 className="text-xl font-semibold text-slate-900 mb-2">Civic Health</h3>
               <p className="text-slate-600">Monitoring volume, resolution, and public sentiment to keep governments proactive.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
