"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, FileType, AlertCircle, Edit2, UploadCloud, Check, Copy, Loader2 } from "lucide-react";
import { PageLoader } from "@/components/PageLoader";

export default function CitizenComplaintPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  
  const [complaint, setComplaint] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchComplaint = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/complaints/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setComplaint(data);
        setEditDesc(data.description);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && params.id) {
      fetchComplaint();
    }
  }, [status, params.id]);

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/complaints/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: editDesc }),
      });
      if (res.ok) {
        setIsEditing(false);
        fetchComplaint(); // Re-fetch to see updated data and status if it changed
      }
    } catch (err) {
      console.error("Error editing", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("complaintId", complaint.id);
      Array.from(files).forEach((file) => formData.append("files", file));
      
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (uploadRes.ok) {
         fetchComplaint(); // Fetch newly attached docs
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (status === "loading" || isLoading) return <PageLoader message="Loading complaint details..." />;
  if (!complaint) return <div className="min-h-[80vh] flex items-center justify-center text-red-500">Complaint not found.</div>;

  const canEdit = complaint.status === "PENDING" || complaint.status === "NEEDS_INFO";

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>

        {complaint.status === "NEEDS_INFO" && (
          <div className="mb-6 flex items-center gap-2 rounded-md bg-amber-50 p-4 text-sm text-amber-700 border border-amber-200">
            <AlertCircle className="h-5 w-5" />
            <span>The department requires more information. Please edit your description or upload additional proof.</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{complaint.title}</h1>
            <p className="text-slate-500 text-sm mt-1">ID: {complaint.id} • Submitted on {new Date(complaint.createdAt).toLocaleDateString()}</p>
          </div>
          <Badge variant="outline" className="px-4 py-1 text-sm bg-slate-100 text-slate-700">
            {complaint.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-white border-b border-slate-100 pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Description Details</CardTitle>
              {canEdit && !isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-4 text-slate-700">
              {isEditing ? (
                <div className="space-y-4">
                  <textarea 
                    className="w-full border rounded-md p-3 min-h-[150px] focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={editDesc} 
                    onChange={e => setEditDesc(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} className="bg-indigo-600" disabled={isSaving}>
                      {isSaving ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                      ) : "Save Changes"}
                    </Button>
                    <Button variant="outline" onClick={() => { setIsEditing(false); setEditDesc(complaint.description); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed">{complaint.description}</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-slate-200">
            <CardHeader className="bg-white border-b border-slate-100 pb-4 flex flex-row justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2"><FileType className="h-5 w-5 text-slate-500"/> Submitted Evidence / Proofs</CardTitle>
              {canEdit && (
                <div>
                  <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    <UploadCloud className="h-4 w-4 mr-2" />
                    {isUploading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
                    ) : "Add Proof"}
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-4">
              {complaint.documents && complaint.documents.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">No proofs uploaded.</p>
              )}
            </CardContent>
          </Card>

          {complaint.actions && complaint.actions.length > 0 && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="bg-white border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">Official Updates</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {complaint.actions.map((act: any) => (
                    <div key={act.id} className="flex gap-4">
                      <div className="bg-teal-100 text-teal-600 rounded-full h-8 w-8 flex justify-center items-center flex-shrink-0">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{new Date(act.createdAt).toLocaleString()}</p>
                        <p className="text-slate-700 text-sm mt-1">{act.description}</p>
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
