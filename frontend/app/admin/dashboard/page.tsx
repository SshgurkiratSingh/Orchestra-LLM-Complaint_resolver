"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
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
      (session?.user as any)?.role === "ADMIN"
    ) {
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

  const activeCount = complaints.filter(
    (c) => !["RESOLVED", "CLOSED", "REJECTED"].includes(c.status),
  ).length;
  const resolvedCount = complaints.filter((c) =>
    ["RESOLVED", "CLOSED"].includes(c.status),
  ).length;
  const totalCount = complaints.length;

  const handleAction = async (action: string, id: string) => {
    if (action === "view") {
      router.push(`/admin/complaints/${id}`);
    } else if (action === "delete") {
      if (confirm("Are you sure you want to delete this complaint?")) {
        try {
          const res = await fetch(`/api/admin/complaints/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            setComplaints(complaints.filter((c) => c.id !== id));
          } else {
            alert("Failed to delete complaint.");
          }
        } catch (err) {
          console.error(err);
          alert("Error deleting complaint.");
        }
      }
    }
  };

  const filteredComplaints = complaints.filter((c) => {
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
    <div className="w-full bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              City Command Center
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1">
              Admin view for all active civic grievances and city health.
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full md:w-auto">
            <Link href="/admin/analytics" className="flex-1 md:flex-none">
              <Button
                variant="default"
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 w-full min-h-[44px]"
              >
                <BarChart className="h-4 w-4" />{" "}
                <span className="hidden sm:inline">
                  Analytics & Intelligence
                </span>
                <span className="sm:hidden">Analytics</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="gap-2 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 min-h-[44px]"
            >
              <LogOut className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8">
          <Card className="border-indigo-100 dark:border-indigo-900 shadow-sm border-t-4 border-t-indigo-500 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex justify-between">
                Total City Complaints
                <BarChart className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {totalCount}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-100 dark:border-amber-900 shadow-sm border-t-4 border-t-amber-500 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex justify-between">
                Active / Needs Attention
                <Clock className="h-4 w-4 text-amber-500 dark:text-amber-400" />
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
                Resolved
                <CheckCircle2 className="h-4 w-4 text-teal-500 dark:text-teal-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {resolvedCount}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md border-slate-200 dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <CardTitle className="dark:text-slate-100">
                    Master Grievance Registry
                  </CardTitle>
                  <CardDescription className="dark:text-slate-400">
                    All incoming and existing civic issues.
                  </CardDescription>
                </div>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search complaints..."
                  className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 min-h-[44px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow className="dark:border-slate-700">
                  <TableHead className="w-[80px] sm:w-[100px] font-semibold dark:text-slate-300">
                    ID
                  </TableHead>
                  <TableHead className="font-semibold dark:text-slate-300 hidden sm:table-cell">
                    Citizen
                  </TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">
                    Title
                  </TableHead>
                  <TableHead className="font-semibold dark:text-slate-300 hidden md:table-cell">
                    AI Urgency
                  </TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">
                    Status
                  </TableHead>
                  <TableHead className="text-right font-semibold dark:text-slate-300">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.length === 0 ? (
                  <TableRow className="dark:border-slate-800">
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-slate-500 dark:text-slate-400"
                    >
                      No complaints found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredComplaints.map((c) => (
                    <TableRow
                      key={c.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 dark:border-slate-800"
                    >
                      <TableCell className="font-medium text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        {c.id.substring(c.id.length - 6).toUpperCase()}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400 dark:text-slate-500" />{" "}
                          <span className="dark:text-slate-200 text-sm">
                            {c.user?.name || c.user?.phone || "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-200 max-w-[150px] sm:max-w-[200px] truncate text-sm">
                        {c.title}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={c.urgency > 2 ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          Lv {c.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            c.status === "RESOLVED"
                              ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-900"
                              : c.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"
                                : "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900"
                          }`}
                        >
                          <span className="hidden sm:inline">{c.status}</span>
                          <span className="sm:hidden">
                            {c.status.substring(0, 3)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          onValueChange={(value) => {
                            if (typeof value === "string") {
                              handleAction(value, c.id);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full sm:w-[130px] ml-auto">
                            <SelectValue placeholder="Actions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View Details</SelectItem>
                            <SelectItem
                              value="delete"
                              className="text-red-500 hover:text-red-600 focus:text-red-600"
                            >
                              Delete
                            </SelectItem>
                          </SelectContent>
                        </Select>
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
