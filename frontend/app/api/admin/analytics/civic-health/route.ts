import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Get all sectors and complaints
    const sectors = await prisma.sector.findMany();
    
    // We only fetch minimal data for speed
    const complaints = await prisma.complaint.findMany({
      select: {
        sectorId: true,
        urgency: true,
        status: true,
        createdAt: true,
      }
    });

    // 2. Group by Sector and Calculate Real-time Civic Health
    const sectorStats = sectors.map(sec => {
      const secComplaints = complaints.filter(c => c.sectorId === sec.id);
      
      const openIssues = secComplaints.filter(c => 
        c.status !== "RESOLVED" && c.status !== "CLOSED" && c.status !== "REJECTED"
      );
      
      const avgUrgency = openIssues.length > 0 
        ? (openIssues.reduce((acc, curr) => acc + curr.urgency, 0) / openIssues.length) 
        : 0;
      
      // Civic Health Algorithm: 
      // Base 100. Penalty for high volume of open issues relative to population, 
      // and penalty for high average urgency of those open issues.
      const population = sec.population || 10000;
      const volumePenalty = (openIssues.length / population) * 10000; // Multiplier to make it impactful
      
      let calculatedScore = 100 - volumePenalty - (avgUrgency * 2);
      calculatedScore = Math.max(10, Math.min(100, calculatedScore));

      // Calculate Trend over last 6 months
      const trending = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        
        // Find complaints created before this month end
        const activeThatMonth = secComplaints.filter(c => {
          return new Date(c.createdAt) <= d; // Simplify: total historical load
        });
        
        // Simulate score fluctuation based on historical volume
        const histPenalty = (activeThatMonth.length / population) * 5000;
        const histScore = Math.max(10, Math.min(100, 100 - histPenalty));

        trending.push({
          month: monthLabel,
          score: histScore.toFixed(1),
          complaints: activeThatMonth.length
        });
      }

      return {
        id: sec.id,
        name: sec.name,
        code: sec.code,
        population: population,
        realtimeScore: calculatedScore.toFixed(1),
        totalHistory: secComplaints.length,
        openIssues: openIssues.length,
        avgUrgency: avgUrgency.toFixed(1),
        trend: trending
      };
    });

    // Sort by worst health score first
    sectorStats.sort((a, b) => parseFloat(a.realtimeScore) - parseFloat(b.realtimeScore));

    return NextResponse.json({ success: true, data: sectorStats });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
