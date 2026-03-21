import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Barebones citizen creation.
    // In Phase 3, the Python Orchestrator will listen to these entries, score Sentiment/Urgency, 
    // and assign the Ward/Department/Employee automatically.

    const complaint = await prisma.complaint.create({
      data: {
        title,
        description,
        userId: (session.user as any).id,
        status: "PENDING",
        source: "TEXT"
      }
    });

    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error("Complaint creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const complaints = await prisma.complaint.findMany({
      where: {
        userId: (session.user as any).id
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(complaints);
  } catch (error) {
    console.error("Complaint retrieval error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
