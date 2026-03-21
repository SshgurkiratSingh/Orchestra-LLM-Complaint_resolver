import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clear() {
  console.log('Clearing departments and sectors to avoid E11000 Duplicate Key errors...');
  try {
    await prisma.action.deleteMany();
    await (prisma as any).debateLog.deleteMany();
    await prisma.document.deleteMany();
    await prisma.complaint.deleteMany(); // Cascade clear all complaints
    await prisma.employee.deleteMany();
    await prisma.department.deleteMany();
    await prisma.sector.deleteMany();
    console.log('Cleared successfully.');
  } catch (e) {
    console.error('Error during clear:', e);
  } finally {
    await prisma.$disconnect();
  }
}

clear();
