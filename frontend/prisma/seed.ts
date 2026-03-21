import { PrismaClient, Status, Source } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

const DATA_DIR = path.join(__dirname, '../../backend/docs');
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
  
  const sectorMapping: Record<string, string> = {}; // map 'SEC-01' -> ObjectId

  for (const s of sectorsRaw) {
    // Generate a unique number if it's MNJ or IND. Actually, let's just use the ward_number as the "number"
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

  const deptMapping: Record<string, string> = {}; // map 'DEPT-MCC-ENG' -> ObjectId

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
    deptMapping[d.department_name] = record.id; // Map by Name because CSV has name

    // Insert employees for this dept
    for (const r of d.roles) {
      await prisma.employee.create({
        data: {
          name: r.mock_person_name,
          roleRank: r.role_title,
          departmentId: record.id
        }
      });
    }
  }
  console.log('✅ Departments & Employees imported.');

  // 4. Load Complaints from CSV
  console.log('Importing historical grievances from CSV...');
  const complaints: any[] = [];
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(GRV_FILE)
      .pipe(csv())
      .on('data', (data) => complaints.push(data))
      .on('end', () => resolve(true))
      .on('error', reject);
  });

  console.log(`Parsed ${complaints.length} CSV rows. Inserting (this might take a few seconds)...`);

  let count = 0;
  for (const row of complaints) {
    // Determine mapping
    const sectorObjectId = sectorMapping[row.sector_id] || null;
    const deptObjectId = deptMapping[row.assigned_department] || null;

    let parsedStatus: Status = Status.PENDING;
    if (row.status === 'Resolved') parsedStatus = Status.RESOLVED;
    if (row.status === 'In Progress') parsedStatus = Status.INVESTIGATING;
    if (row.status === 'Rejected') parsedStatus = Status.REJECTED;

    let parsedSource: Source = Source.TEXT;
    if (row.source === 'Voice Call') parsedSource = Source.VOICE;

    const urgencyScale = Math.round(parseFloat(row.urgency_score) * 10); // convert 0-1 to 1-10

    await prisma.complaint.create({
      data: {
        title: row.complaint_title,
        description: row.complaint_description,
        category: row.category,
        status: parsedStatus,
        urgency: urgencyScale > 0 ? urgencyScale : 1,
        source: parsedSource,
        createdAt: new Date(row.created_at),
        updatedAt: row.resolved_at ? new Date(row.resolved_at) : new Date(row.created_at),
        userId: citizen.id,
        sectorId: sectorObjectId,
        departmentId: deptObjectId
      }
    });
    count++;
  }

  console.log(`✅ successfully seeded ${count} complaints! Database is now rich with history.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
