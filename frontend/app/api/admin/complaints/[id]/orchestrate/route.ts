import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    const complaint = await prisma.complaint.findUnique({ where: { id } });
    if (!complaint) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pythonRes = await fetch("http://127.0.0.1:8000/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: complaint.id,
        title: complaint.title,
        description: complaint.description
      })
    });

    if (!pythonRes.ok) {
      const errorText = await pythonRes.text();
      console.error("Python error:", errorText);
      return NextResponse.json({ error: "Failed to communicate with python engine" }, { status: 502 });
    }

    const data = await pythonRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Orchestration bridge error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
