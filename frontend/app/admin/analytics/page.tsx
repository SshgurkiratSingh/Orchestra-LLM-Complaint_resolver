"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  AlertTriangle,
  Lightbulb,
  MapPin,
  BrainCircuit,
  Search,
  TrendingUp,
  Calendar,
  BarChart3,
  PieChart,
} from "lucide-react";
import { PageLoader } from "@/components/PageLoader";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsDashboard() {
  const [sectors, setSectors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [rootCauseResult, setRootCauseResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "sectors">("overview");

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/analytics/civic-health").then(r => r.json()),
      fetch("/api/admin/analytics/heatmap").then(r => r.json()),
      fetch(`/api/admin/analytics/time-series?days=${dateRange}`).then(r => r.json()),
    ]).then(([civic, heatmap, timeSeries]) => {
      if (civic.success) setSectors(civic.data);
      if (heatmap.success) setHeatmapData(heatmap.data);
      if (timeSeries.success) setTimeSeriesData(timeSeries.data);
      setIsLoading(false);
    });
  }, [dateRange]);

  const handleRootCauseAnalysis = async (
    sectorId: string,
    sectorName: string,
  ) => {
    setSelectedSector(sectorName);
    setIsAnalyzing(true);
    setRootCauseResult(null);

    try {
      const res = await fetch(
        `/api/admin/analytics/root-cause?sectorId=${sectorId}`,
      );
      const result = await res.json();
      if (result.success) {
        setRootCauseResult(result.data);
      } else {
        alert("Failed to run root cause analysis.");
      }
    } catch (e) {
      console.error(e);
      alert("Error analyzing sector.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/50";
    if (score >= 50) return "bg-amber-500/10 border-amber-500/50";
    return "bg-rose-500/10 border-rose-500/50";
  };

  if (isLoading) {
    return <PageLoader message="Computing City-Wide Civic Health Index..." />;
  }

  const filteredSectors = sectors.filter(
    (sec) =>
      !searchQuery ||
      sec.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950 min-h-screen py-8">
      <div className="px-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              Civic Health Analytics
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Real-time sector performance and AI-driven Root Cause Analysis
            </p>
          </div>
        </div>

        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
          {["overview", "trends", "sectors"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && timeSeriesData && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Time Range
              </h2>
              <Select
                value={dateRange.toString()}
                onValueChange={(value) => {
                  if (value) {
                    setDateRange(parseInt(value, 10));
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Complaint Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={timeSeriesData.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    Pending vs Resolved
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={timeSeriesData.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="pending" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
                      <Area type="monotone" dataKey="resolved" stackId="1" stroke="#10b981" fill="#10b981" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    Category Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie data={timeSeriesData.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                        {timeSeriesData.categoryBreakdown.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-rose-600" />
                    Average Urgency Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={timeSeriesData.timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgUrgency" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={timeSeriesData.statusDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "trends" && (
          <div className="space-y-6">
            {heatmapData.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center text-slate-500 dark:text-slate-400">
                  <Activity className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Loading heatmap data...</p>
                </div>
              </div>
            ) : (
              <>
            <Card>
              <CardHeader>
                <CardTitle>Sector Comparison Heatmap</CardTitle>
                <CardDescription>Health scores with gradient colors (red=bad, yellow=medium, green=good)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {heatmapData.map((sector) => {
                    const score = sector.healthScore;
                    const bgColor = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-rose-500";
                    return (
                      <div
                        key={sector.sectorId}
                        className={`${bgColor} bg-opacity-20 border-2 ${bgColor.replace("bg-", "border-")} rounded-lg p-4 hover:scale-105 transition-transform cursor-pointer`}
                        title={`${sector.sectorName}: ${sector.openComplaints} open, ${sector.resolutionRate}% resolved`}
                      >
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sector.sectorName}</div>
                        <div className={`text-3xl font-bold ${score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                          {score.toFixed(0)}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {sector.openComplaints} open
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resolution Rate Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={heatmapData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sectorName" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="resolutionRate" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Urgency Levels by Sector</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={heatmapData.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sectorName" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Bar dataKey="avgUrgency" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            </>
            )}
          </div>
        )}

        {activeTab === "sectors" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Col: Sector List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Sector Performance Rankings
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <Input
                  type="text"
                  placeholder="Search sectors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredSectors.length === 0 ? (
                <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                  No sectors found.
                </div>
              ) : (
                filteredSectors.map((sec) => {
                  const score = parseFloat(sec.realtimeScore);
                  return (
                    <Card
                      key={sec.id}
                      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                              {sec.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                            >
                              Pop: {sec.population}
                            </Badge>
                          </div>
                          <div className="flex gap-4 text-sm text-slate-500 dark:text-slate-400 mt-2">
                            <span>
                              Open Grievances:{" "}
                              <b className="text-slate-900 dark:text-slate-100">
                                {sec.openIssues}
                              </b>
                            </span>
                            <span>
                              Avg Urgency:{" "}
                              <b className="text-rose-500 dark:text-rose-400">
                                {sec.avgUrgency}/10
                              </b>
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <div
                            className={`px-4 py-2 rounded-lg border ${getScoreBg(score)} flex flex-col items-center`}
                          >
                            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Health Index
                            </span>
                            <span
                              className={`text-2xl font-bold ${getScoreColor(score)}`}
                            >
                              {score.toFixed(0)}
                            </span>
                          </div>

                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              handleRootCauseAnalysis(sec.id, sec.name)
                            }
                            className="bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 text-white w-full"
                          >
                            <BrainCircuit className="h-4 w-4 mr-2" />
                            Run AI Analysis
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Col: AI Analysis Pane */}
          <div className="sticky top-8 space-y-4">
            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 pb-6">
                <CardTitle className="text-xl text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    Root Cause AI Engine
                  </div>
                </CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400">
                  Select a sector from the drop-down below to run predictive
                  causality analysis on 6-month historical data.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex gap-4 items-end">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Target Analytics Sector
                    </label>
                    <Select
                      disabled={isAnalyzing}
                      onValueChange={(val) => {
                        const sec = sectors.find((s) => s.id === val);
                        if (sec) handleRootCauseAnalysis(sec.id, sec.name);
                      }}
                    >
                      <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                        <SelectValue placeholder="-- Interactive Map Selector --" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                        <SelectGroup>
                          <SelectLabel className="text-slate-500 dark:text-slate-400">
                            Select Interactive Region
                          </SelectLabel>
                          {sectors.map((sec) => (
                            <SelectItem
                              key={sec.id}
                              value={sec.id}
                              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100"
                            >
                              {sec.name} (Pop: {sec.population})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden min-h-[400px]">
              <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 pb-4">
                <CardTitle className="text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                  Analysis Results{" "}
                  {selectedSector ? `for ${selectedSector}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!selectedSector && !isAnalyzing && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-20 space-y-4">
                    <Activity className="h-16 w-16 opacity-20" />
                    <p>Awaiting Sector Selection</p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="space-y-6 py-10 px-4">
                    <div className="flex justify-center mb-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 dark:bg-indigo-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
                        <BrainCircuit className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-pulse relative z-10" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full"></div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6"></div>
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-4/6"></div>
                    </div>
                    <p className="text-center text-sm text-indigo-600 dark:text-indigo-400 animate-pulse mt-4 font-mono">
                      Cross-referencing {selectedSector} timelines...
                    </p>
                  </div>
                )}

                {rootCauseResult && !isAnalyzing && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" /> Executive Summary
                      </h4>
                      <p className="text-slate-800 dark:text-slate-200 text-lg leading-relaxed">
                        {rootCauseResult.summary}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400" />{" "}
                        Correlated Key Issues
                      </h4>
                      <ul className="space-y-2">
                        {rootCauseResult.keyIssues.map(
                          (issue: string, idx: number) => (
                            <li
                              key={idx}
                              className="flex gap-3 text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-md"
                            >
                              <span className="text-rose-500 dark:text-rose-400 font-bold">
                                •
                              </span>
                              {issue}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="p-5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-lg mt-6">
                      <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" /> Strategic
                        Recommendation
                      </h4>
                      <p className="text-indigo-900 dark:text-indigo-300 font-medium">
                        {rootCauseResult.recommendation}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
