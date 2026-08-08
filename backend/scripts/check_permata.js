const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPermata() {
  const permataCompany = await prisma.companyMaster.findFirst({
    where: { name: { contains: 'Permata', mode: 'insensitive' } }
  });
  console.log('Permata CompanyMaster:', permataCompany);

  const permataBudgets = await prisma.iTProjectBudget.findMany({
    where: {
      OR: [
        { companyMasterId: permataCompany ? permataCompany.id : 15 },
        { brand: { contains: 'Permata', mode: 'insensitive' } },
        { notes: { contains: 'PLA', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`Found ${permataBudgets.length} budgets for PT Permata Landmarq Abadi / PLA`);
  permataBudgets.forEach(b => console.log(`ID: ${b.id} | Name: ${b.projectName} | CompanyId: ${b.companyMasterId} | Brand: ${b.brand}`));
}

checkPermata().finally(() => prisma.$disconnect());
