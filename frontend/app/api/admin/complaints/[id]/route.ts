import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const complaint = await (prisma.complaint.findUnique as any)({
      where: { id },
      include: {
        user: {
          select: { name: true, phone: true, email: true }
        },
        documents: true,
        department: true,
        assignedTo: true,
        actions: true,
        debateLogs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("Admin single complaint retrieval error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
