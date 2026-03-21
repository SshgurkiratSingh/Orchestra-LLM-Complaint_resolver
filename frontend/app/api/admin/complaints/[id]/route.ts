import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        sector: true,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    const { status, departmentId, employeeId, category, severity } = body;

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (departmentId !== undefined) dataToUpdate.departmentId = departmentId === "unassigned" ? null : departmentId;
    if (employeeId !== undefined) dataToUpdate.employeeId = employeeId;
    if (category) dataToUpdate.category = category;
    if (severity !== undefined) dataToUpdate.severity = severity;

    const updatedComplaint = await (prisma as any).complaint.update({
      where: { id },
      data: dataToUpdate
    });

    return NextResponse.json(updatedComplaint);
  } catch (error) {
    console.error("Admin complaint update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await (prisma as any).complaint.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("Admin complaint deletion error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
