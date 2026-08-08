const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPermata() {
  try {
    console.log('Fixing CompanyMaster ID for PT Permata Landmarq Abadi (ID 15)...');

    // 1. Update ITProjectBudget records from ID 55 to ID 15
    const res1 = await prisma.iTProjectBudget.updateMany({
      where: {
        OR: [
          { companyMasterId: 55 },
          { brand: { contains: 'Permata', mode: 'insensitive' } }
        ]
      },
      data: {
        companyMasterId: 15,
        brand: 'PT Permata Landmarq Abadi'
      }
    });

    console.log(`✓ Updated ${res1.count} ITProjectBudget records to companyMasterId = 15!`);

    // 2. Also check if there are any other PLA records
    const permataCount = await prisma.iTProjectBudget.count({
      where: { companyMasterId: 15 }
    });

    console.log(`🎉 Total ITProjectBudget records for PT Permata Landmarq Abadi (ID 15) now: ${permataCount}`);

  } catch (err) {
    console.error('Error fixing Permata Company ID:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixPermata();
