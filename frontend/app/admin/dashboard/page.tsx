"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FileText,
  CheckCircle2,
  Clock,
  LogOut,
  BarChart,
  Users,
  Search
} from "lucide-react";
import { PageLoader } from "@/components/PageLoader";

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
      fetch("/api/admin/complaints")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setComplaints(data);
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [status, session]);

  if (status === "loading" || isLoading) {
    return <PageLoader message="Loading City Command Center..." />;
  }

  const activeCount = complaints.filter(c => !["RESOLVED", "CLOSED", "REJECTED"].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => ["RESOLVED", "CLOSED"].includes(c.status)).length;
  const totalCount = complaints.length;

  const filteredComplaints = complaints.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (c.id && c.id.toLowerCase().includes(query)) ||
      (c.user?.name && c.user.name.toLowerCase().includes(query)) ||
      (c.user?.phone && c.user.phone.toLowerCase().includes(query)) ||
      (c.title && c.title.toLowerCase().includes(query)) ||
      (c.status && c.status.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full bg-slate-50 min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">City Command Center</h1>
            <p className="text-slate-600 mt-1">Admin view for all active civic grievances and city health.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/analytics">
              <Button variant="default" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <BarChart className="h-4 w-4" /> Analytics & Intelligence
              </Button>
            </Link>
            <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })} className="gap-2 text-slate-600 border-slate-300">
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-indigo-100 shadow-sm border-t-4 border-t-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
                Total City Complaints
                <BarChart className="h-4 w-4 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{totalCount}</div>
            </CardContent>
          </Card>
          <Card className="border-amber-100 shadow-sm border-t-4 border-t-amber-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
                Active / Needs Attention
                <Clock className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{activeCount}</div>
            </CardContent>
          </Card>
          <Card className="border-teal-100 shadow-sm border-t-4 border-t-teal-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex justify-between">
                Resolved
                <CheckCircle2 className="h-4 w-4 text-teal-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{resolvedCount}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md border-slate-200">
          <CardHeader className="bg-white border-b border-slate-100 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <div>
                  <CardTitle>Master Grievance Registry</CardTitle>
                  <CardDescription>All incoming and existing civic issues.</CardDescription>
                </div>
              </div>
              
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search complaints..."
                  className="pl-9 bg-slate-50 border-slate-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px] font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Citizen</TableHead>
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">AI Urgency</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="text-right font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center text-slate-500">No complaints found.</TableCell></TableRow>
                ) : (
                  filteredComplaints.map((c) => (
                    <TableRow key={c.id} className="hover:bg-slate-50">
                      <TableCell className="font-medium text-slate-500">{c.id.substring(c.id.length - 6).toUpperCase()}</TableCell>
                      <TableCell><div className="flex items-center gap-2"><Users className="h-4 w-4 text-slate-400"/> {c.user?.name || c.user?.phone || 'Unknown'}</div></TableCell>
                      <TableCell className="font-medium text-slate-900 max-w-[200px] truncate">{c.title}</TableCell>
                      <TableCell>
                        <Badge variant={c.urgency > 2 ? "destructive" : "secondary"}>Lv {c.urgency}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          c.status === "RESOLVED" ? "bg-teal-50 text-teal-700 border-teal-200" :
                          c.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }>{c.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/complaints/${c.id}`}>
                          <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50">View Details</Button>
                        </Link>
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
