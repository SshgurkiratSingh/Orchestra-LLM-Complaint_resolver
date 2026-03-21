import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Building2, Tag, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
    case "NEEDS_INFO":
      return "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-400";
    case "ASSIGNED":
    case "INVESTIGATING":
      return "bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400";
    case "RESOLVED":
    case "CLOSED":
      return "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400";
    case "REJECTED":
      return "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400";
    default:
      return "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300";
  }
}

export default async function PublicComplaintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Invalid ID</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">No complaint ID provided.</p>
          <Link href="/">
            <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      department: true, sector: true,
      documents: true,
      user: {
        select: {
          name: true,
          phone: true // Maybe we shouldn't show phone completely, just partial
        }
      }
    },
  });

  if (!complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Complaint Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-4">The complaint with ID "{id}" could not be found or does not exist.</p>
          <Link href="/">
            <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Mask user phone for privacy
  const maskedPhone = complaint.user?.phone 
    ? `${complaint.user.phone.substring(0, 4)}XXXX${complaint.user.phone.substring(complaint.user.phone.length - 2)}` 
    : "Anonymous";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-2 inline-block">
              &larr; Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Public Complaint Record</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">ID: {complaint.id}</p>
          </div>
          <div>
            <Badge className={`${getStatusColor(complaint.status)} text-sm px-3 py-1 border-0`}>
              {complaint.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-2xl dark:text-slate-100">{complaint.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2 font-medium dark:text-slate-400">
               Filed by: {complaint.user?.name || "Citizen"} ({maskedPhone})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 bg-white dark:bg-slate-900">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Category</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{complaint.category || "General"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Location</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{complaint.sector?.name || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Department</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{complaint.department?.name || "Unassigned"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-indigo-500 dark:text-indigo-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Filed On</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(complaint.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {(complaint.sentiment !== null || complaint.urgency > 1) && (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-4 mt-6 border border-indigo-100 dark:border-indigo-900">
                <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-400 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" /> System Assessment
                </h3>
                <p className="text-sm text-indigo-900 dark:text-indigo-300">{(complaint.sentiment !== null || complaint.urgency > 1)}</p>
                <div className="mt-3 flex gap-2">
                  {complaint.urgency && (
                    <Badge variant="outline" className="bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                      Urgency: {complaint.urgency}/10
                    </Badge>
                  )}
                  {complaint.sentiment !== null && (
                    <Badge variant="outline" className="bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                      Sentiment: {complaint.sentiment} 
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {complaint.documents && complaint.documents.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Attachments</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {complaint.documents.map((doc: any, i: number) => (
                    <div key={i} className="rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square relative bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                       {/* Assuming the URL is an image for now */}
                      <img src={doc.url} alt={`Attachment ${i+1}`} className="object-cover w-full h-full" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
