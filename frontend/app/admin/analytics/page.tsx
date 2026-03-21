"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, Lightbulb, MapPin, BrainCircuit } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function AnalyticsDashboard() {
  const [sectors, setSectors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [rootCauseResult, setRootCauseResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetch("/api/admin/analytics/civic-health")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSectors(data.data);
        }
        setIsLoading(false);
      });
  }, []);

  const handleRootCauseAnalysis = async (sectorId: string, sectorName: string) => {
    setSelectedSector(sectorName);
    setIsAnalyzing(true);
    setRootCauseResult(null);

    try {
      const res = await fetch(`/api/admin/analytics/root-cause?sectorId=${sectorId}`);
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
    return <div className="p-8 text-center text-xl text-neutral-400 animate-pulse">Computing City-Wide Civic Health Index...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-500" />
            Civic Health Analytics
          </h1>
          <p className="text-neutral-400 mt-2">
            Real-time sector performance and AI-driven Root Cause Analysis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Col: Sector List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Sector Performance Rankings</h2>
          <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {sectors.map((sec) => {
              const score = parseFloat(sec.realtimeScore);
              return (
                <Card key={sec.id} className={`bg-neutral-900 border border-neutral-800 transition-all hover:border-neutral-700`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-neutral-400" />
                        <h3 className="font-semibold text-lg text-white">{sec.name}</h3>
                        <Badge variant="outline" className="bg-neutral-800 text-neutral-300">
                          Pop: {sec.population}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-neutral-400 mt-2">
                        <span>Open Grievances: <b className="text-white">{sec.openIssues}</b></span>
                        <span>Avg Urgency: <b className="text-rose-400">{sec.avgUrgency}/10</b></span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className={`px-4 py-2 rounded-lg border ${getScoreBg(score)} flex flex-col items-center`}>
                        <span className="text-xs uppercase tracking-wider text-neutral-400">Health Index</span>
                        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score.toFixed(0)}
                        </span>
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleRootCauseAnalysis(sec.id, sec.name)}
                        className="bg-blue-600 hover:bg-blue-500 text-white w-full"
                      >
                        <BrainCircuit className="h-4 w-4 mr-2" />
                        Run AI Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Col: AI Analysis Pane */}
        <div className="sticky top-8 space-y-4">
          
          <Card className="bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
            <CardHeader className="bg-neutral-950 border-b border-neutral-800 pb-6">
              <CardTitle className="text-xl text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-purple-400" />
                  Root Cause AI Engine
                </div>
              </CardTitle>
              <CardDescription className="text-neutral-400">
                Select a sector from the drop-down below to run predictive causality analysis on 6-month historical data.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-neutral-300">Target Analytics Sector</label>
                  <Select 
                    disabled={isAnalyzing}
                    onValueChange={(val) => {
                      const sec = sectors.find(s => s.id === val);
                      if (sec) handleRootCauseAnalysis(sec.id, sec.name);
                    }}
                  >
                    <SelectTrigger className="w-full bg-neutral-950 border-neutral-700 text-white">
                      <SelectValue placeholder="-- Interactive Map Selector --" />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-900 border-neutral-700 text-white">
                      <SelectGroup>
                        <SelectLabel className="text-neutral-400">Select Interactive Region</SelectLabel>
                        {sectors.map((sec) => (
                           <SelectItem key={sec.id} value={sec.id} className="cursor-pointer hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white">
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

          <Card className="bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden min-h-[400px]">
            <CardHeader className="bg-neutral-950 border-b border-neutral-800 pb-4">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-400" />
                Analysis Results {selectedSector ? `for ${selectedSector}` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              
              {!selectedSector && !isAnalyzing && (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-20 space-y-4">
                  <Activity className="h-16 w-16 opacity-20" />
                  <p>Awaiting Sector Selection</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="space-y-6 py-10 px-4">
                  <div className="flex justify-center mb-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                      <BrainCircuit className="h-12 w-12 text-purple-400 animate-pulse relative z-10" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-neutral-800 rounded animate-pulse w-full"></div>
                    <div className="h-2 bg-neutral-800 rounded animate-pulse w-5/6"></div>
                    <div className="h-2 bg-neutral-800 rounded animate-pulse w-4/6"></div>
                  </div>
                  <p className="text-center text-sm text-purple-400 animate-pulse mt-4 font-mono">
                    Cross-referencing {selectedSector} timelines...
                  </p>
                </div>
              )}

              {rootCauseResult && !isAnalyzing && (
               <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
                    <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Executive Summary
                    </h4>
                    <p className="text-white text-lg leading-relaxed">
                      {rootCauseResult.summary}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-ambwe-500" /> Correlated Key Issues
                    </h4>
                    <ul className="space-y-2">
                      {rootCauseResult.keyIssues.map((issue: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-neutral-300 bg-neutral-800/50 p-3 rounded-md">
                          <span className="text-rose-500 font-bold">•</span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-5 bg-blue-900/10 border border-blue-500/30 rounded-lg mt-6">
                    <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" /> Strategic Recommendation
                    </h4>
                    <p className="text-blue-100 font-medium">
                      {rootCauseResult.recommendation}
                    </p>
                  </div>
               </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
