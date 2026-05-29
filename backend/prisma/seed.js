const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Read employees.json
  const employeesPath = path.join(__dirname, 'employees.json');
  if (!fs.existsSync(employeesPath)) {
    console.error(`Error: employees.json not found at ${employeesPath}. Please run the python parser first.`);
    return;
  }
  
  const employeesData = JSON.parse(fs.readFileSync(employeesPath, 'utf8'));
  
  // Hash default password
  const salt = await bcrypt.genSalt(10);
  const defaultPasswordHash = await bcrypt.hash('Password123!', salt);
  
  // 1. Collect unique companies
  const companyMap = new Map(); // key: "name|location", value: { name, location, sector }
  
  // Ensure the default company for admin/agent exists
  companyMap.set("PT Mugi Rekso Abadi|General", {
    name: "PT Mugi Rekso Abadi",
    location: "General",
    sector: "GENERAL"
  });
  
  for (const emp of employeesData) {
    const key = `${emp.company}|${emp.location}`;
    if (!companyMap.has(key)) {
      companyMap.set(key, {
        name: emp.company,
        location: emp.location,
        sector: emp.sector
      });
    }
  }
  
  console.log(`Found ${companyMap.size} unique companies/branches. Seeding companies...`);
  
  // Insert companies and store their database IDs
  const dbCompanies = {};
  for (const [key, value] of companyMap.entries()) {
    const company = await prisma.company.upsert({
      where: {
        name_location: {
          name: value.name,
          location: value.location
        }
      },
      update: {
        sector: value.sector
      },
      create: {
        name: value.name,
        location: value.location,
        sector: value.sector
      }
    });
    dbCompanies[key] = company.id;
  }
  
  console.log('Companies seeded successfully.');
  
  // 2. Seed Admin & Agent Test Accounts
  console.log('Seeding default Admin & Agent accounts...');
  
  const adminCompanyId = dbCompanies["PT Mugi Rekso Abadi|General"];
  
  // Upsert Admin
  await prisma.user.upsert({
    where: { email: 'admin@mragroup.co.id' },
    update: {},
    create: {
      id: 'ADMIN-01',
      email: 'admin@mragroup.co.id',
      password: defaultPasswordHash,
      name: 'Super Admin MRA',
      department: 'IT Support',
      jobPosition: 'IT Helpdesk Administrator',
      role: 'ADMIN',
      companyId: adminCompanyId
    }
  });

  // Upsert Agent
  await prisma.user.upsert({
    where: { email: 'agent@mragroup.co.id' },
    update: {},
    create: {
      id: 'AGENT-01',
      email: 'agent@mragroup.co.id',
      password: defaultPasswordHash,
      name: 'IT Agent Support',
      department: 'IT Support',
      jobPosition: 'IT Support Engineer',
      role: 'AGENT',
      companyId: adminCompanyId
    }
  });
  
  console.log('Default accounts seeded.');
  
  // 3. Seed Karyawan dari Excel
  console.log(`Seeding ${employeesData.length} employees...`);
  
  let userCount = 0;
  let skippedCount = 0;
  
  for (const emp of employeesData) {
    const compKey = `${emp.company}|${emp.location}`;
    const companyId = dbCompanies[compKey];
    
    if (!companyId) {
      console.log(`Warning: Company not found for employee ${emp.name} (${compKey})`);
      skippedCount++;
      continue;
    }
    
    // Determine user role (promote to AGENT if in IT/Tech/MIS department)
    let role = 'USER';
    const deptLower = emp.department.toLowerCase();
    const posLower = emp.jobPosition.toLowerCase();
    
    if (deptLower.includes('it') || deptLower.includes('mis') || deptLower.includes('system') ||
        posLower.includes('it') || posLower.includes('technician') || posLower.includes('programmer')) {
      role = 'AGENT';
    }
    
    try {
      await prisma.user.upsert({
        where: { email: emp.email },
        update: {
          department: emp.department,
          jobPosition: emp.jobPosition,
          phone: emp.phone,
          companyId: companyId
        },
        create: {
          id: emp.employeeId,
          email: emp.email,
          password: defaultPasswordHash,
          name: emp.name,
          department: emp.department,
          jobPosition: emp.jobPosition,
          phone: emp.phone,
          role: role,
          companyId: companyId
        }
      });
      userCount++;
    } catch (err) {
      console.log(`Error seeding user ${emp.name} (${emp.email}):`, err.message);
      skippedCount++;
    }
  }
  
  console.log(`Seeding complete. Seeded ${userCount} users. Skipped ${skippedCount} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
