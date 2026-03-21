import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function m() {
  console.log('Checking sector');
  const sector = await p.sector.findUnique({where:{id:'69be79230c2447038e21848f'}});
  console.log(sector);
  if (!sector) return;
  console.log('Querying complaints');
  const complaints = await p.complaint.findMany({
    where: { 
      OR: [
        { sectorId: sector.id },
        { title: { contains: sector.name, mode: "insensitive" } },
        { description: { contains: sector.name, mode: "insensitive" } },
        { title: { contains: `sec ${sector.number}`, mode: "insensitive" } },
        { description: { contains: `sec ${sector.number}`, mode: "insensitive" } },
        { title: { contains: `sector ${sector.number}`, mode: "insensitive" } },
        { description: { contains: `sector ${sector.number}`, mode: "insensitive" } }
      ]
    },
    select: {
      title: true,
      category: true,
      urgency: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" }
  });
  console.log('Found', complaints.length);
}
m().finally(()=>p.$disconnect());
