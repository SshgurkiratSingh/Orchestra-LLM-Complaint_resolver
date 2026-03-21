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
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        documents: true,
        department: true,
        actions: true,
        assignedTo: true
      }
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    // Ensure citizen can only see their own complaints
    if ((session.user as any).role === "CITIZEN" && complaint.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(complaint);
  } catch (error) {
    console.error("Citizen single complaint retrieval error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.complaint.findUnique({ where: { id } });
    if (!existing || existing.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden or not found" }, { status: 403 });
    }

    if (existing.status !== "PENDING" && existing.status !== "NEEDS_INFO") {
      return NextResponse.json({ error: "Cannot edit an active or resolved complaint" }, { status: 400 });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        description: body.description || existing.description,
        status: existing.status === "NEEDS_INFO" ? "PENDING" : existing.status, // Move back to pending if they respond to NEEDS_INFO
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Citizen complaint update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
