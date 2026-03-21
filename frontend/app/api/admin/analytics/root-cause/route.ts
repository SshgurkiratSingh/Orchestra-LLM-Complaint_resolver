import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Define an interface for the expected result structure
export interface RootCauseAnalysisResult {
  summary: string;
  keyIssues: string[];
  recommendation: string;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sectorId = searchParams.get("sectorId");

  if (!sectorId) {
    return NextResponse.json({ error: "sectorId is required" }, { status: 400 });
  }

  try {
    // 1. Fetch Sector Details
    const sector = await prisma.sector.findUnique({
      where: { id: sectorId },
    });

    if (!sector) {
      return NextResponse.json({ error: "Sector not found" }, { status: 404 });
    }

    // 2. Fetch Complaints for this sector (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const complaints: any[] = await (prisma.complaint.findMany as any)({
      where: {
        sectorId: sectorId,
        createdAt: { gte: sixMonthsAgo }
      },
      select: {
        title: true,
        category: true,
        urgency: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" }
    });

    if (complaints.length === 0) {
      return NextResponse.json({ 
        data: {
          summary: "No complaints found for this sector in the last 6 months.",
          keyIssues: [],
          recommendation: "Maintain current operations."
        } 
      });
    }

    // 3. Format Data for Gemini Prompt
    const complaintDump = complaints.map(c => 
      `Date: ${c.createdAt.toISOString().split('T')[0]} | Category: ${c.category || 'N/A'} | Title: ${c.title} | Urgency: ${c.urgency} | Status: ${c.status}`
    ).join("\n");

    const prompt = `
      You are an expert urban planner and root cause analyst for the Chandigarh Municipal Corporation.
      Analyze the following 6-month grievance data for ${sector.name} (Code: ${sector.code}).
      
      Grievance Data:
      ${complaintDump}
      
      Identify the underlying systemic root causes (e.g., aging infrastructure, poor vendor performance, seasonal weather events). 
      Provide a highly precise analysis.
      
      Output strictly in JSON format matching this structure:
      {
        "summary": "A 2-3 sentence overarching conclusion.",
        "keyIssues": ["Specific issue string 1", "Specific issue string 2"],
        "recommendation": "One actionable recommendation for the Chief Engineer or DC."
      }
    `;

    // 4. Generate Analysis by calling Python Backend
    const response = await fetch("http://localhost:8000/analytics/root-cause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sector_name: sector.name,
        sector_code: sector.code,
        complaints_dump: complaintDump
      })
    });

    if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
    }

    const resultJson = await response.json();
    return NextResponse.json({ success: true, data: resultJson });

  } catch (error: any) {
    console.error("Root Cause Analysis Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}