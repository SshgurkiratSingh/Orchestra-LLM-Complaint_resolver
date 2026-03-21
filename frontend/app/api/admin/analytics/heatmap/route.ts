import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sectors = await prisma.sector.findMany({
      include: {
        complaints: {
          select: {
            status: true,
            urgency: true,
            category: true,
            createdAt: true,
          },
        },
      },
    });

    const heatmapData = sectors.map((sector) => {
      const complaints = sector.complaints;
      const totalComplaints = complaints.length;
      const openComplaints = complaints.filter(
        (c) => !["RESOLVED", "CLOSED", "REJECTED"].includes(c.status)
      ).length;
      const avgUrgency =
        complaints.length > 0
          ? complaints.reduce((sum, c) => sum + c.urgency, 0) / complaints.length
          : 0;

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const recentComplaints = complaints.filter((c) => c.createdAt >= last30Days).length;

      const categoryCount: Record<string, number> = {};
      complaints.forEach((c) => {
        const cat = c.category || "Other";
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });

      const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];

      const resolutionRate =
        totalComplaints > 0
          ? ((totalComplaints - openComplaints) / totalComplaints) * 100
          : 100;

      const healthScore = Math.max(
        0,
        100 - openComplaints * 2 - avgUrgency * 5 + resolutionRate * 0.3
      );

      return {
        sectorId: sector.id,
        sectorName: sector.name,
        sectorCode: sector.code,
        population: sector.population,
        totalComplaints,
        openComplaints,
        avgUrgency: parseFloat(avgUrgency.toFixed(1)),
        recentComplaints,
        resolutionRate: parseFloat(resolutionRate.toFixed(1)),
        healthScore: parseFloat(healthScore.toFixed(1)),
        topCategory: topCategory ? topCategory[0] : "None",
        topCategoryCount: topCategory ? topCategory[1] : 0,
      };
    });

    heatmapData.sort((a, b) => a.healthScore - b.healthScore);

    return NextResponse.json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    console.error("Heatmap analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch heatmap data" },
      { status: 500 }
    );
  }
}
