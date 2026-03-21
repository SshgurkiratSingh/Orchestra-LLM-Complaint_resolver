"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  LogOut,
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    // Redirect officials to their specific dashboard
    if (status === "authenticated" && (session.user as any)?.role === "ADMIN") {
      router.push("/admin/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && (session.user as any)?.role !== "ADMIN") {
      fetch("/api/complaints")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMyComplaints(data);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [status, session]);

  if (status === "loading" || status === "unauthenticated" || isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Calculate stats
  const activeCount = myComplaints.filter(
    (c) => !["RESOLVED", "CLOSED", "REJECTED"].includes(c.status),
  ).length;
  const resolvedCount = myComplaints.filter((c) =>
    ["RESOLVED", "CLOSED"].includes(c.status),
  ).length;
  const attentionCount = myComplaints.filter(
    (c) => c.status === "NEEDS_INFO",
  ).length;

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Citizen Dashboard
            </h1>
            <p className="text-slate-600 mt-1">
              Welcome back, {(session?.user as any)?.phone || "Citizen"}. View
              and manage your civic requests.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/new-complaint">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                <PlusCircle className="h-4 w-4" />
                File New Grievance
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="gap-2 text-slate-600 border-slate-300"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-indigo-100 shadow-sm border-t-4 border-t-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
                Active Complaints
                <Clock className="h-4 w-4 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {activeCount}
              </div>
            </CardContent>
          </Card>
          <Card className="border-teal-100 shadow-sm border-t-4 border-t-teal-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
                Resolved Issues
                <CheckCircle2 className="h-4 w-4 text-teal-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {resolvedCount}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-100 shadow-sm border-t-4 border-t-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
                Needs Attention
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {attentionCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Area */}
        <Card className="shadow-md border-slate-200">
          <CardHeader className="bg-white border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <div>
                <CardTitle>My Grievance History</CardTitle>
                <CardDescription>
                  A complete log of cases you've reported in Chandigarh.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px] font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Urgency</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="text-right font-semibold">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myComplaints.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-slate-500"
                    >
                      No complaints found.
                    </TableCell>
                  </TableRow>
                ) : (
                  myComplaints.map((complaint) => (
                    <TableRow
                      key={complaint.id}
                      className="hover:bg-slate-50/50 cursor-pointer"
                      onClick={() => router.push(`/dashboard/complaints/${complaint.id}`)}
                    >
                      <TableCell className="font-medium text-indigo-600">
                        {complaint.id
                          .substring(complaint.id.length - 6)
                          .toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {complaint.title}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            !complaint.priority || complaint.priority === "High"
                              ? "destructive"
                              : "secondary"
                          }
                          className="font-normal"
                        >
                          {complaint.priority || "Pending Analysis"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            complaint.status === "RESOLVED"
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : complaint.status === "INVESTIGATING"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : complaint.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                          }
                        >
                          {complaint.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
