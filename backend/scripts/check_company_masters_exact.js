const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCompanies() {
  try {
    const list = await prisma.companyMaster.findMany({
      orderBy: { id: 'asc' }
    });
    console.log('=== EXACT COMPANY MASTERS IN DATABASE ===');
    list.forEach(c => {
      console.log(`ID: ${c.id} | NAME: "${c.name}"`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompanies();
