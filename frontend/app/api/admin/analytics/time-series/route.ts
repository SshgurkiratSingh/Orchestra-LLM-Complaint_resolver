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

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get("days") || "30");
    const sectorId = searchParams.get("sectorId");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const whereClause: any = {
      createdAt: { gte: startDate },
    };
    if (sectorId) {
      whereClause.sectorId = sectorId;
    }

    const complaints = await prisma.complaint.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        status: true,
        urgency: true,
        category: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const dailyData: Record<string, any> = {};
    complaints.forEach((c) => {
      const dateKey = c.createdAt.toISOString().split("T")[0];
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: dateKey,
          total: 0,
          pending: 0,
          resolved: 0,
          urgencySum: 0,
          urgencyCount: 0,
        };
      }
      dailyData[dateKey].total++;
      if (["RESOLVED", "CLOSED"].includes(c.status)) {
        dailyData[dateKey].resolved++;
      } else {
        dailyData[dateKey].pending++;
      }
      dailyData[dateKey].urgencySum += c.urgency;
      dailyData[dateKey].urgencyCount++;
    });

    const timeSeriesData = Object.values(dailyData).map((day: any) => ({
      date: day.date,
      total: day.total,
      pending: day.pending,
      resolved: day.resolved,
      avgUrgency: day.urgencyCount > 0 ? parseFloat((day.urgencySum / day.urgencyCount).toFixed(1)) : 0,
    }));

    const categoryBreakdown: Record<string, number> = {};
    complaints.forEach((c) => {
      const cat = c.category || "Uncategorized";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
    });

    const categoryData = Object.entries(categoryBreakdown).map(([name, value]) => ({
      name,
      value,
    }));

    const statusBreakdown: Record<string, number> = {};
    complaints.forEach((c) => {
      statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;
    });

    const statusData = Object.entries(statusBreakdown).map(([name, value]) => ({
      name,
      value,
    }));

    return NextResponse.json({
      success: true,
      data: {
        timeSeries: timeSeriesData,
        categoryBreakdown: categoryData,
        statusDistribution: statusData,
        totalComplaints: complaints.length,
        dateRange: { start: startDate.toISOString(), end: new Date().toISOString() },
      },
    });
  } catch (error) {
    console.error("Time-series analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch time-series data" },
      { status: 500 }
    );
  }
}
