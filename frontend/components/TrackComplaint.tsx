"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function TrackComplaint() {
  const [complaintId, setComplaintId] = useState("");
  const router = useRouter();

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (complaintId.trim()) {
      router.push(`/complaint/${complaintId.trim()}`);
    }
  };

  return (
    <div className="mt-12 w-full max-w-md mx-auto bg-white dark:bg-slate-900 p-2 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
      <form onSubmit={handleTrack} className="flex w-full">
        <Input 
          type="text" 
          placeholder="Enter Complaint ID to track..." 
          className="border-0 focus-visible:ring-0 shadow-none rounded-l-full px-6 bg-transparent dark:text-slate-100 dark:placeholder:text-slate-500"
          value={complaintId}
          onChange={(e) => setComplaintId(e.target.value)}
        />
        <Button type="submit" className="rounded-full bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-6">
          <Search className="w-4 h-4 mr-2" /> Track
        </Button>
      </form>
    </div>
  );
}
