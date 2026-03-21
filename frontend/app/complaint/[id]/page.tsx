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
      return "bg-yellow-100 text-yellow-800";
    case "ASSIGNED":
    case "INVESTIGATING":
      return "bg-blue-100 text-blue-800";
    case "RESOLVED":
    case "CLOSED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

export default async function PublicComplaintPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid ID</h1>
          <p className="text-slate-600 mb-4">No complaint ID provided.</p>
          <Link href="/">
            <Button>Return Home</Button>
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Complaint Not Found</h1>
          <p className="text-slate-600 mb-4">The complaint with ID ID "{id}"quot;{id}ID "{id}"quot; could not be found or does not exist.</p>
          <Link href="/">
            <Button>Return Home</Button>
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
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
              &larr; Back to Home
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Public Complaint Record</h1>
            <p className="text-slate-500 mt-1">ID: {complaint.id}</p>
          </div>
          <div>
            <Badge className={`${getStatusColor(complaint.status)} text-sm px-3 py-1 border-0`}>
              {complaint.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-white border-b border-slate-100 pb-4">
            <CardTitle className="text-2xl">{complaint.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2 font-medium">
               Filed by: {complaint.user?.name || "Citizen"} ({maskedPhone})
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6 bg-white">
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Description</h3>
              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Category</p>
                  <p className="text-sm text-slate-600">{complaint.category || "General"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Location</p>
                  <p className="text-sm text-slate-600">{complaint.sector?.name || "Not specified"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Department</p>
                  <p className="text-sm text-slate-600">{complaint.department?.name || "Unassigned"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Filed On</p>
                  <p className="text-sm text-slate-600">
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
              <div className="bg-indigo-50 rounded-lg p-4 mt-6 border border-indigo-100">
                <h3 className="text-sm font-semibold text-indigo-800 flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4" /> System Assessment
                </h3>
                <p className="text-sm text-indigo-900">{(complaint.sentiment !== null || complaint.urgency > 1)}</p>
                <div className="mt-3 flex gap-2">
                  {complaint.urgency && (
                    <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200">
                      Urgency: {complaint.urgency}/10
                    </Badge>
                  )}
                  {complaint.sentiment !== null && (
                    <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200">
                      Sentiment: {complaint.sentiment} 
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {complaint.documents && complaint.documents.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Attachments</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {complaint.documents.map((doc: any, i: number) => (
                    <div key={i} className="rounded-md overflow-hidden border border-slate-200 aspect-square relative bg-slate-100 flex items-center justify-center">
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
