const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function countBudgets() {
  const total = await prisma.iTProjectBudget.count();
  const y2025 = await prisma.iTProjectBudget.count({ where: { fiscalYear: 2025 } });
  const y2026 = await prisma.iTProjectBudget.count({ where: { fiscalYear: 2026 } });
  console.log(`TOTAL BUDGET ITEMS IN DB: ${total} (2025: ${y2025}, 2026: ${y2026})`);
}

countBudgets().finally(() => prisma.$disconnect());
