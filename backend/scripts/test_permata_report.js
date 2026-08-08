const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPermataReport() {
  const permataBudgets = await prisma.iTProjectBudget.findMany({
    where: {
      fiscalYear: 2026,
      companyMasterId: 15
    }
  });

  console.log(`=== 2026 BUDGETS FOR PT PERMATA LANDMARQ ABADI (ID 15) ===`);
  console.log(`Count: ${permataBudgets.length}`);
  permataBudgets.forEach(b => {
    console.log(`- [${b.budgetType}] ${b.projectName} | Pagu: Rp ${b.allocatedBudget.toLocaleString('id-ID')} | Actual: Rp ${b.actualCost.toLocaleString('id-ID')}`);
  });
}

testPermataReport().finally(() => prisma.$disconnect());
