const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sectors = await prisma.sector.findMany({take: 5});
  console.log(sectors);
}
main();
