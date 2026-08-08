const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('Seeding initial project budgets...');

    // 1. PT Mogems (Bvlgari) Master Company
    const mogems = await prisma.companyMaster.findFirst({ where: { name: { contains: 'Mogems', mode: 'insensitive' } } });
    const mogemsId = mogems ? mogems.id : null;

    // 2. PT Permata Master Company
    const permata = await prisma.companyMaster.findFirst({ where: { name: { contains: 'Permata', mode: 'insensitive' } } });
    const permataId = permata ? permata.id : null;

    // 3. PT Amanda Master Company
    const amanda = await prisma.companyMaster.findFirst({ where: { name: { contains: 'Amanda', mode: 'insensitive' } } });
    const amandaId = amanda ? amanda.id : null;

    const sampleBudgets = [
      {
        projectCode: 'PRJ-2026-001',
        projectName: 'OMEGA Cloud Services (Per Counter Store PI & Bali)',
        category: 'SOFTWARE_DEVELOPMENT',
        companyMasterId: mogemsId,
        brand: 'Bvlgari',
        department: 'Store Operations',
        fiscalYear: 2026,
        allocatedBudget: 16650000,
        actualCost: 16650000,
        remainingBudget: 0,
        budgetType: 'OPEX',
        accountType: 'License & Permit',
        priority: 'HIGH',
        status: 'COMPLETED',
        notes: 'Operational Expense 2026'
      },
      {
        projectCode: 'PRJ-2026-002',
        projectName: 'Mekari Qontak (WhatsApp Business CRM)',
        category: 'DIGITAL_TRANSFORMATION',
        companyMasterId: mogemsId,
        brand: 'Bvlgari',
        department: 'Sales & Boutique',
        fiscalYear: 2026,
        allocatedBudget: 9000000,
        actualCost: 9000000,
        remainingBudget: 0,
        budgetType: 'OPEX',
        accountType: 'License & Permit',
        priority: 'MEDIUM',
        status: 'COMPLETED'
      },
      {
        projectCode: 'PRJ-2026-003',
        projectName: 'Perangkat Pendukung POS (Barcode Scanner & Cash Drawer)',
        category: 'HARDWARE_REFRESH',
        companyMasterId: mogemsId,
        brand: 'Bvlgari',
        department: 'Store Operations',
        fiscalYear: 2026,
        allocatedBudget: 6000000,
        actualCost: 6000000,
        remainingBudget: 0,
        budgetType: 'CAPEX',
        accountType: 'Utilities',
        priority: 'HIGH',
        status: 'COMPLETED'
      },
      {
        projectCode: 'PRJ-2026-004',
        projectName: 'Megacount 3D People Counter & Traffic Analytics Store PI',
        category: 'AI_INNOVATION',
        companyMasterId: mogemsId,
        brand: 'Bvlgari',
        department: 'Sales & Boutique',
        fiscalYear: 2026,
        allocatedBudget: 12950000,
        actualCost: 12950000,
        remainingBudget: 0,
        budgetType: 'CAPEX',
        accountType: 'Repair & Maintenance',
        priority: 'CRITICAL',
        status: 'COMPLETED',
        notes: 'Unbudgeted item 2026 requested by Store Analytics'
      },
      {
        projectCode: 'PRJ-2027-001',
        projectName: 'Modernisasi POS Terminal & Multi-Payment Integration',
        category: 'DIGITAL_TRANSFORMATION',
        companyMasterId: mogemsId,
        brand: 'Bvlgari',
        department: 'Store Operations',
        fiscalYear: 2027,
        allocatedBudget: 45000000,
        actualCost: 0,
        remainingBudget: 45000000,
        budgetType: 'CAPEX',
        accountType: 'Utilities',
        priority: 'HIGH',
        status: 'PROPOSED'
      },
      {
        projectCode: 'PRJ-2027-002',
        projectName: 'AI Store Traffic Audit & Customer Heatmap Analytics',
        category: 'AI_INNOVATION',
        companyMasterId: mogemsId,
        brand: 'Bvlgari',
        department: 'Sales & Boutique',
        fiscalYear: 2027,
        allocatedBudget: 35000000,
        actualCost: 0,
        remainingBudget: 35000000,
        budgetType: 'CAPEX',
        accountType: 'Utilities',
        priority: 'CRITICAL',
        status: 'APPROVED'
      },
      {
        projectCode: 'PRJ-2027-003',
        projectName: 'EDR Antivirus & Zero-Trust Cybersecurity Audit Store',
        category: 'CYBERSECURITY',
        companyMasterId: permataId,
        brand: 'MRA Head Office',
        department: 'IT Department',
        fiscalYear: 2027,
        allocatedBudget: 24800000,
        actualCost: 0,
        remainingBudget: 24800000,
        budgetType: 'OPEX',
        accountType: 'License & Permit',
        priority: 'HIGH',
        status: 'APPROVED'
      }
    ];

    for (const b of sampleBudgets) {
      await prisma.iTProjectBudget.upsert({
        where: { projectCode: b.projectCode },
        update: b,
        create: b
      });
    }

    console.log('Successfully seeded initial project budgets!');
  } catch (err) {
    console.error('Error seeding budgets:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
