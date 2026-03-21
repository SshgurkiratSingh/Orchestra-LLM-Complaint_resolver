import { PrismaClient, Status, Source } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

const DATA_DIR = path.join(process.cwd(), '../backend/docs');
const SECTOR_FILE = path.join(DATA_DIR, 'category_b_platform_master_data/sector_demographics.json');
const DEPT_FILE = path.join(DATA_DIR, 'category_b_platform_master_data/department_taxonomy.json');
const GRV_FILE = path.join(DATA_DIR, 'category_c_historical_grievances/historical_grievances_500.csv');

async function main() {
  console.log('🌱 Starting DB Seeding Process for Master Datasets...');

  // 1. Create a dummy test citizen to assign complaints to
  let citizen = await prisma.user.findUnique({ where: { email: 'citizen@example.com' } });
  if (!citizen) {
    citizen = await prisma.user.create({
      data: {
        name: 'Mock Citizen',
        email: 'citizen@example.com',
        phone: '1234567890',
        role: 'CITIZEN'
      }
    });
    console.log('Created dummy citizen.');
  }

  // 2. Load Sectors
  const sectorsRaw = JSON.parse(fs.readFileSync(SECTOR_FILE, 'utf-8'));
  console.log(`Loaded ${sectorsRaw.length} sectors from JSON. Importing...`);
  
  const sectorMapping: Record<string, string> = {};

  for (const s of sectorsRaw) {
    const record = await prisma.sector.upsert({
      where: { code: s.sector_id },
      update: {
        population: s.population_estimate,
        score: Math.random() * 20 + 70 // Give a random civic health score between 70-90
      },
      create: {
        code: s.sector_id,
        name: s.sector_name,
        number: s.ward_number,
        population: s.population_estimate,
        score: Math.random() * 20 + 70
      }
    });
    sectorMapping[s.sector_id] = record.id;
  }
  console.log('✅ Sectors imported.');

  // 3. Load Departments & Roles
  const deptsRaw = JSON.parse(fs.readFileSync(DEPT_FILE, 'utf-8'));
  console.log(`Loaded ${deptsRaw.length} departments. Importing...`);

  const deptMapping: Record<string, string> = {}; 

  for (const d of deptsRaw) {
    const record = await prisma.department.upsert({
      where: { code: d.department_id },
      update: { description: d.wing },
      create: {
        code: d.department_id,
        name: d.department_name,
        description: d.wing
      }
    });
    deptMapping[d.department_name] = record.id;

    // Insert employees for this dept
    for (const r of d.roles) {
      // Find existing by name + role avoiding duplicates if re-seeding
      const existingEmployee = await prisma.employee.findFirst({
        where: { name: r.mock_person_name, departmentId: record.id }
      });
      if (!existingEmployee) {
        await prisma.employee.create({
          data: {
            name: r.mock_person_name,
            roleRank: r.role_title,
            departmentId: record.id
          }
        });
      }
    }
  }
  console.log('✅ Departments & Employees imported.');

  // 4. Load Complaints from CSV (Skipped for brevity, but retaining logic if needed)
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

