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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  MapPin,
  Calendar,
  FileType,
  CheckCircle,
  AlertTriangle,
  Activity,
  FileText,
  Trash2,
  RefreshCw,
} from "lucide-react";

export default function AdminComplaintDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [complaint, setComplaint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDepartments(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleUpdate = async (type: "status" | "departmentId", value: string) => {
    if (!complaint) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/complaints/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaint({ ...complaint, ...updated });
      } else {
        alert("Failed to update.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this complaint? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/complaints/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        alert("Failed to delete complaint.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrchestrate = async () => {
    setIsOrchestrating(true);
    try {
      const res = await fetch(
        `/api/admin/complaints/${params.id}/orchestrate`,
        { method: "POST" },
      );
      if (res.ok) {
        fetch(`/api/admin/complaints/${params.id}`)
          .then((r) => r.json())
          .then((data) => setComplaint(data));
      } else {
        alert("Failed to run orchestration.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsOrchestrating(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      (session?.user as any)?.role !== "ADMIN"
    ) {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (
      status === "authenticated" &&
      (session?.user as any)?.role === "ADMIN" &&
      params.id
    ) {
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

  if (status === "loading" || isLoading)
    return (
      <div className="min-h-[80vh] flex items-center justify-center dark:text-slate-300">
        Loading details...
      </div>
    );
  if (!complaint)
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-red-500 dark:text-red-400">
        Complaint not found or error loading.
      </div>
    );

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-6 max-w-5xl">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {complaint.title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              ID: {complaint.id} • Submitted on{" "}
              {new Date(complaint.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Badge
            variant="outline"
            className="px-4 py-1 text-sm bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
          >
            {complaint.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg dark:text-slate-100">Description</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg flex items-center gap-2 dark:text-slate-100">
                  <FileType className="h-5 w-5 text-slate-500 dark:text-slate-400" /> Attached
                  Evidence
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {complaint.documents && complaint.documents.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {complaint.documents.map((doc: any) => (
                      <div
                        key={doc.id}
                        className="border dark:border-slate-700 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 group relative aspect-square"
                      >
                        {doc.fileType.startsWith("image/") ? (
                          <img
                            src={doc.filePath}
                            alt="Attachment"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-500 dark:text-slate-400">
                            <FileText className="h-8 w-8 mb-2" />
                            <span className="text-xs text-center truncate w-full">
                              {doc.filePath.split("/").pop()}
                            </span>
                          </div>
                        )}
                        <a
                          href={doc.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-sm"
                        >
                          View Full
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    No attachments provided.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-md dark:text-slate-100">
                  AI Insights & Orchestration
                </CardTitle>
                <Button
                  size="sm"
                  onClick={handleOrchestrate}
                  disabled={isOrchestrating}
                  className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
                >
                  {isOrchestrating ? "Running AI..." : "Run AI Orchestration"}
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Urgency Level
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {complaint.urgency} / 5
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${complaint.urgency > 3 ? "bg-red-500" : "bg-amber-500"}`}
                      style={{ width: `${(complaint.urgency / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Activity className="h-4 w-4" /> AI Sentiment
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {complaint.sentiment !== null
                        ? complaint.sentiment
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-3">
                <CardTitle className="text-md dark:text-slate-100">Citizen Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm space-y-3">
                <div className="flex gap-3 items-center">
                  <div className="bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 p-2 rounded-full hidden sm:block">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                      Reporter
                    </p>
                    <p className="font-medium dark:text-slate-200">
                      {complaint.user?.name ||
                        complaint.user?.phone ||
                        "Anonymous Citizen"}
                    </p>
                  </div>
                </div>
                {complaint.user?.email && (
                  <div className="pl-11">
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                      Email
                    </p>
                    <p className="text-slate-900 dark:text-slate-200">{complaint.user.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-3">
                <CardTitle className="text-md dark:text-slate-100">Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm space-y-3">
                <div className="flex gap-3 items-center">
                  <div className="bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 p-2 rounded-full hidden sm:block">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                      Sector
                    </p>
                    <p className="font-medium dark:text-slate-200">
                      {complaint.sector?.name || "Unassigned"}
                    </p>
                  </div>
                </div>
                <div className="pl-11">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                    Department
                  </p>
                  <p className="text-slate-900 dark:text-slate-200">
                    {complaint.department?.name || "Unassigned"}
                  </p>
                </div>
                <div className="pl-11">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                    Assigned Employee
                  </p>
                  <p className="text-slate-900 dark:text-slate-200">
                    {complaint.assignedTo?.name || "Unassigned"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-red-100 dark:border-red-900/50 dark:bg-slate-900">
              <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/50 pb-3">
                <CardTitle className="text-md text-red-800 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Admin Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Update Status</Label>
                  <Select
                    value={complaint.status}
                    onValueChange={(val) => handleUpdate("status", val)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="NEEDS_INFO">Needs Info</SelectItem>
                      <SelectItem value="ESCALATED">Escalated</SelectItem>
                      <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                      <SelectItem value="ASSIGNED">Assigned</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase">Reassign Department</Label>
                  <Select
                    value={complaint.departmentId || "unassigned"}
                    onValueChange={(val) => handleUpdate("departmentId", val)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned" className="italic text-slate-500">Unassigned</SelectItem>
                      {departments.map(dep => (
                        <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="w-full flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Complaint
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {complaint.debateLogs && complaint.debateLogs.length > 0 && (
            <Card className="shadow-lg border-purple-500/20 col-span-1 md:col-span-3 mt-2 bg-slate-950/50 backdrop-blur-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="border-b border-slate-800/50 pb-4 relative z-10 bg-slate-900/40">
                <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 drop-shadow-sm flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-400 animate-pulse" />
                  AI Multi-Agent Debate Log
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium tracking-wide">
                  Real-time transparent log of LLM agents negotiating the
                  outcome.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 pb-12 relative z-10 max-h-[800px] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-purple-500/10 before:via-purple-500/60 before:to-purple-500/10">
                  {complaint.debateLogs.map((log: any, index: number) => (
                    <div
                      key={log.id}
                      className={`relative flex justify-between md:justify-normal ${index % 2 === 0 ? "md:flex-row-reverse" : ""} group`}
                      style={{ animationDelay: `${index * 150}ms` }}
                    >
                      {/* Timeline dot */}
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-purple-600/80 shadow-[0_0_15px_rgba(168,85,247,0.8)] shrink-0 absolute left-0 md:left-1/2 z-10 top-4 -translate-x-1/2 ${index % 2 === 0 ? "md:translate-x-1/2" : "md:-translate-x-1/2"}`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></div>
                      </div>

                      {/* Content Card */}
                      <div
                        className={`w-[calc(100%-3rem)] md:w-[calc(50%-3rem)] ml-12 md:ml-0 p-5 border border-slate-700/60 rounded-xl bg-slate-900/80 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.25)] hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 relative`}
                      >
                        {/* Connecting Arrow */}
                        <div
                          className={`hidden md:block absolute top-[1.375rem] w-0 h-0 border-y-[8px] border-y-transparent ${index % 2 === 0 ? "-left-3 border-r-[12px] border-r-slate-700/60" : "-right-3 border-l-[12px] border-l-slate-700/60"}`}
                        ></div>
                        <div
                          className={`md:hidden absolute top-[1.375rem] -left-3 w-0 h-0 border-y-[8px] border-y-transparent border-r-[12px] border-r-slate-700/60`}
                        ></div>

                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b border-slate-800/80 pb-3 gap-2 sm:gap-0">
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-purple-400" />
                            <span className="font-bold text-purple-300 text-sm tracking-widest uppercase bg-purple-900/40 px-3 py-1 rounded-full border border-purple-500/20">
                              {log.agentName}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 font-mono tracking-wider flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed font-sans">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
