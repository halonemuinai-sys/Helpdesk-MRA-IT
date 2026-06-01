require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
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
  
  // 1. Collect unique master companies
  const masterCompanyMap = new Map(); // key: name, value: { name, sector }
  
  // Ensure the default company master exists
  masterCompanyMap.set("PT Mugi Rekso Abadi", {
    name: "PT Mugi Rekso Abadi",
    sector: "GENERAL"
  });

  for (const emp of employeesData) {
    if (!masterCompanyMap.has(emp.company)) {
      masterCompanyMap.set(emp.company, {
        name: emp.company,
        sector: emp.sector
      });
    }
  }

  console.log(`Found ${masterCompanyMap.size} unique master companies. Seeding CompanyMaster...`);
  const dbCompanyMasters = {};
  for (const [name, value] of masterCompanyMap.entries()) {
    const master = await prisma.companyMaster.upsert({
      where: { name: value.name },
      update: { sector: value.sector },
      create: {
        name: value.name,
        sector: value.sector
      }
    });
    dbCompanyMasters[name] = master.id;
  }
  console.log('CompanyMaster seeded successfully.');

  // 2. Collect unique companies (branches)
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
    const masterId = dbCompanyMasters[value.name];
    const company = await prisma.company.upsert({
      where: {
        name_location: {
          name: value.name,
          location: value.location
        }
      },
      update: {
        sector: value.sector,
        companyMasterId: masterId
      },
      create: {
        name: value.name,
        location: value.location,
        sector: value.sector,
        companyMasterId: masterId
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

  // Upsert Auditor
  await prisma.user.upsert({
    where: { email: 'audit@mragroup.co.id' },
    update: {},
    create: {
      id: 'AUDITOR-01',
      email: 'audit@mragroup.co.id',
      password: defaultPasswordHash,
      name: 'IT Auditor Admin',
      department: 'IT Audit & Compliance',
      jobPosition: 'IT Auditor',
      role: 'AUDITOR',
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
    
    // Determine user role (promote to AGENT only if programmer or IT staff, excluding technicians)
    let role = 'USER';
    const deptLower = emp.department.toLowerCase();
    const posLower = emp.jobPosition.toLowerCase();
    
    const hasIt = (/\bit\b/.test(deptLower) || /\bit\b/.test(posLower) || deptLower.includes('information & technology') || posLower.includes('information & technology'));
    const hasProgrammer = deptLower.includes('programmer') || posLower.includes('programmer');
    const isTechnician = deptLower.includes('teknik') || posLower.includes('technician');

    if ((hasIt || hasProgrammer) && !isTechnician) {
      role = 'AGENT';
    }
    
    try {
      await prisma.user.upsert({
        where: { email: emp.email },
        update: {
          department: emp.department,
          jobPosition: emp.jobPosition,
          phone: emp.phone,
          role: role,
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

  // 4. Seed Category & Subcategory Metadata
  console.log('Seeding category and subcategory metadata...');
  const categoryMetadata = [
    // Hardware
    { category: 'Hardware', subCategory: 'PC/Laptop' },
    { category: 'Hardware', subCategory: 'Printer' },
    { category: 'Hardware', subCategory: 'Scanner' },
    { category: 'Hardware', subCategory: 'Monitor' },
    { category: 'Hardware', subCategory: 'Keyboard/Mouse' },
    { category: 'Hardware', subCategory: 'IP Phone' },
    { category: 'Hardware', subCategory: 'UPS' },
    { category: 'Hardware', subCategory: 'POS Cashier Machine' },
    { category: 'Hardware', subCategory: 'Projector' },
    
    // Software
    { category: 'Software', subCategory: 'Outlook/Email' },
    { category: 'Software', subCategory: 'SAP' },
    { category: 'Software', subCategory: 'Retailsoft ERP' },
    { category: 'Software', subCategory: 'NetSuite ERP' },
    { category: 'Software', subCategory: 'Ginee ERP' },
    { category: 'Software', subCategory: 'Operating System (Windows/macOS)' },
    { category: 'Software', subCategory: 'Microsoft Office (Word, Excel, etc.)' },
    { category: 'Software', subCategory: 'Antivirus' },
    { category: 'Software', subCategory: 'Google Workspace' },
    { category: 'Software', subCategory: 'Custom Internal Apps' },
    
    // Network
    { category: 'Network', subCategory: 'Wi-Fi Connection' },
    { category: 'Network', subCategory: 'LAN Cable Connection' },
    { category: 'Network', subCategory: 'VPN/Remote Access' },
    { category: 'Network', subCategory: 'Internet Slow/Offline' },
    { category: 'Network', subCategory: 'Switch/Router Issue' },
    
    // Access
    { category: 'Access', subCategory: 'Active Directory / Login Domain' },
    { category: 'Access', subCategory: 'Email Password Reset' },
    { category: 'Access', subCategory: 'SAP Account Lock / Password Reset' },
    { category: 'Access', subCategory: 'Shared Folder Access' },
    { category: 'Access', subCategory: 'VPN Account Request' },
    { category: 'Access', subCategory: 'CCTV Access' }
  ];

  let metaCount = 0;
  for (const meta of categoryMetadata) {
    try {
      await prisma.categoryMetadata.upsert({
        where: {
          category_subCategory: {
            category: meta.category,
            subCategory: meta.subCategory
          }
        },
        update: {},
        create: {
          category: meta.category,
          subCategory: meta.subCategory
        }
      });
      metaCount++;
    } catch (err) {
      console.log(`Error seeding category metadata ${meta.category} - ${meta.subCategory}:`, err.message);
    }
  }
  console.log(`Seeding category metadata complete. Seeded ${metaCount} items.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
