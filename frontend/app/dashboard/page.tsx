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
import { PageLoader } from "@/components/PageLoader";

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
    return <PageLoader message="Loading your dashboard..." />;
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
    <div className="w-full bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Citizen Dashboard
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              Welcome back, {(session?.user as any)?.phone || "Citizen"}. View
              and manage your civic requests.
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
            <Link href="/dashboard/new-complaint" className="flex-1 md:flex-none">
              <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white gap-2 w-full min-h-[44px]">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">File New Grievance</span>
                <span className="sm:hidden">New Complaint</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="gap-2 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 min-h-[44px]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
          <Card className="border-indigo-100 dark:border-indigo-900 shadow-sm border-t-4 border-t-indigo-500 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex justify-between">
                Active Complaints
                <Clock className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {activeCount}
              </div>
            </CardContent>
          </Card>
          <Card className="border-teal-100 dark:border-teal-900 shadow-sm border-t-4 border-t-teal-500 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex justify-between">
                Resolved Issues
                <CheckCircle2 className="h-4 w-4 text-teal-500 dark:text-teal-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {resolvedCount}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-100 dark:border-amber-900 shadow-sm border-t-4 border-t-amber-500 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex justify-between">
                Needs Attention
                <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {attentionCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Table Area */}
        <Card className="shadow-md border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <CardTitle className="dark:text-slate-100 text-base sm:text-lg">My Grievance History</CardTitle>
                <CardDescription className="dark:text-slate-400 text-xs sm:text-sm">
                  A complete log of cases you've reported in Chandigarh.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="dark:border-slate-700">
                  <TableHead className="w-[80px] sm:w-[100px] font-semibold dark:text-slate-300">ID</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Description</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300 hidden md:table-cell">Urgency</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300 hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right font-semibold dark:text-slate-300">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myComplaints.length === 0 ? (
                  <TableRow className="dark:border-slate-800">
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-slate-500 dark:text-slate-400"
                    >
                      No complaints found.
                    </TableCell>
                  </TableRow>
                ) : (
                  myComplaints.map((complaint) => (
                    <TableRow
                      key={complaint.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer dark:border-slate-800"
                      onClick={() => router.push(`/dashboard/complaints/${complaint.id}`)}
                    >
                      <TableCell className="font-medium text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm">
                        {complaint.id
                          .substring(complaint.id.length - 6)
                          .toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium dark:text-slate-200 text-sm max-w-[150px] sm:max-w-none truncate">
                        {complaint.title}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={
                            !complaint.priority || complaint.priority === "High"
                              ? "destructive"
                              : "secondary"
                          }
                          className="font-normal text-xs"
                        >
                          {complaint.priority || "Pending Analysis"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm hidden sm:table-cell">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={
                            `text-xs ${
                            complaint.status === "RESOLVED"
                              ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900"
                              : complaint.status === "INVESTIGATING"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900"
                                : complaint.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                                  : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                          }`}
                        >
                          <span className="hidden sm:inline">{complaint.status}</span>
                          <span className="sm:hidden">{complaint.status.substring(0, 3)}</span>
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
