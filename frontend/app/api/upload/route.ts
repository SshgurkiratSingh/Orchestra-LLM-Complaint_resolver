import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const complaintId = formData.get("complaintId") as string;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files received." }, { status: 400 });
    }
    
    if (!complaintId) {
      return NextResponse.json({ error: "No complaint ID provided." }, { status: 400 });
    }

    const uploadedDocuments = [];

    // Ensure the local uploads directory exists
    // Path: /home/gurkirat/Projects/DELHI_28/frontend/public/uploads/... 
    // We put it in public so the Next.js app can serve it easily for viewing
    const uploadDir = join(process.cwd(), "public", "uploads", "complaints", complaintId);
    await mkdir(uploadDir, { recursive: true });

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate a unique filename
      const uniqueSuffix = crypto.randomBytes(4).toString('hex');
      const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePathRelative = `/uploads/complaints/${complaintId}/${filename}`;
      const filePathAbsolute = join(uploadDir, filename);

      // Write to Local Drive
      await writeFile(filePathAbsolute, buffer);

      // Map to Database
      const doc = await prisma.document.create({
        data: {
          complaintId,
          filePath: filePathRelative,
          fileType: file.type,
        }
      });
      
      uploadedDocuments.push(doc);
    }

    return NextResponse.json({ 
      message: "Files uploaded successfully", 
      documents: uploadedDocuments 
    }, { status: 201 });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload files." }, { status: 500 });
  }
}
