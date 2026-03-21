import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const complaints = await prisma.complaint.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        user: {
          select: { name: true, phone: true }
        }
      }
    });

    return NextResponse.json(complaints);
  } catch (error) {
    console.error("Admin complaints retrieval error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
