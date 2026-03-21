"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Calendar, FileType, CheckCircle, AlertTriangle, Activity, FileText } from "lucide-react";

export default function AdminComplaintDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [complaint, setComplaint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrchestrating, setIsOrchestrating] = useState(false);

  const handleOrchestrate = async () => {
    setIsOrchestrating(true);
    try {
      const res = await fetch(`/api/admin/complaints/${params.id}/orchestrate`, { method: "POST" });
      if (res.ok) {
        fetch(`/api/admin/complaints/${params.id}`)
          .then(r => r.json())
          .then(data => setComplaint(data));
      } else {
        alert("Failed to run orchestration.");
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsOrchestrating(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role === "ADMIN" && params.id) {
      fetch(`/api/admin/complaints/${params.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setComplaint(data);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [status, session, params.id]);

  if (status === "loading" || isLoading) return <div className="min-h-[80vh] flex items-center justify-center">Loading details...</div>;
  if (!complaint) return <div className="min-h-[80vh] flex items-center justify-center text-red-500">Complaint not found or error loading.</div>;

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <Link href="/admin/dashboard" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{complaint.title}</h1>
            <p className="text-slate-500 text-sm mt-1">ID: {complaint.id} • Submitted on {new Date(complaint.createdAt).toLocaleDateString()}</p>
          </div>
          <Badge variant="outline" className="px-4 py-1 text-sm bg-indigo-50 text-indigo-700 border-indigo-200">
            {complaint.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-white border-b border-slate-100 pb-4">
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-slate-700 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-white border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><FileType className="h-5 w-5 text-slate-500"/> Attached Evidence</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {complaint.documents && complaint.documents.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {complaint.documents.map((doc: any) => (
                      <div key={doc.id} className="border rounded-md overflow-hidden bg-slate-100 group relative aspect-square">
                        {doc.fileType.startsWith('image/') ? (
                          <img src={doc.filePath} alt="Attachment" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-500">
                            <FileText className="h-8 w-8 mb-2" />
                            <span className="text-xs text-center truncate w-full">{doc.filePath.split('/').pop()}</span>
                          </div>
                        )}
                        <a href={doc.filePath} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-sm">
                          View Full
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic">No attachments provided.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-white border-b border-slate-100 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-md">AI Insights & Orchestration</CardTitle>
                <Button 
                  size="sm" 
                  onClick={handleOrchestrate} 
                  disabled={isOrchestrating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isOrchestrating ? "Running AI..." : "Run AI Orchestration"}
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 flex items-center gap-1"><AlertTriangle className="h-4 w-4"/> Urgency Level</span>
                    <span className="font-semibold text-slate-900">{complaint.urgency} / 5</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className={`h-2 rounded-full ${complaint.urgency > 3 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${(complaint.urgency / 5) * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 flex items-center gap-1"><Activity className="h-4 w-4"/> AI Sentiment</span>
                    <span className="font-semibold text-slate-900">{complaint.sentiment !== null ? complaint.sentiment : 'Pending'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-white border-b border-slate-100 pb-3">
                <CardTitle className="text-md">Citizen Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm space-y-3">
                <div className="flex gap-3 items-center">
                  <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full hidden sm:block"><User className="h-4 w-4" /></div>
                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase">Reporter</p>
                    <p className="font-medium">{complaint.user?.name || complaint.user?.phone || 'Anonymous Citizen'}</p>
                  </div>
                </div>
                {complaint.user?.email && (
                  <div className="pl-11">
                    <p className="text-slate-500 text-xs font-semibold uppercase">Email</p>
                    <p className="text-slate-900">{complaint.user.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {complaint.debateLogs && complaint.debateLogs.length > 0 && (
              <Card className="shadow-sm border-slate-200 col-span-1 md:col-span-3 mt-6">
                <CardHeader className="bg-white border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg">AI Multi-Agent Debate Log</CardTitle>
                  <CardDescription>Transparent log of the LLM agents negotiating the outcome.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {complaint.debateLogs.map((log: any) => (
                    <div key={log.id} className="p-3 border rounded-md bg-slate-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-purple-700 text-sm">{log.agentName}</span>
                        <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-700 text-sm whitespace-pre-wrap">{log.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
