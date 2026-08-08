const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getMogems2026Report() {
  const selectedYear = 2026;
  const parsedCompanyMasterId = 14; // Mogems

  const rangeStart = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
  const rangeEnd = new Date(`${selectedYear}-12-31T23:59:59.999Z`);

  // Peripherals
  const invoices = await prisma.peripheralInvoice.findMany({
    where: { purchaseDate: { gte: rangeStart, lte: rangeEnd }, companyMasterId: parsedCompanyMasterId }
  });
  const peripheralsTotal = invoices.reduce((s, x) => s + (x.totalCost || 0), 0);

  // Rental assets
  const assets = await prisma.asset.findMany({
    where: { rentalStart: { lte: rangeEnd }, rentalEnd: { gte: rangeStart }, companyMasterId: parsedCompanyMasterId }
  });
  const rentalTotal = assets.reduce((s, x) => s + (x.rentalCost || 0) * 12, 0);

  // Subscriptions & ISP
  const subs = await prisma.iTSubscription.findMany({
    where: { startDate: { lte: rangeEnd }, expiryDate: { gte: rangeStart }, companyMasterId: parsedCompanyMasterId }
  });
  const subscriptionsTotal = subs.filter(x => x.category !== 'ISP').reduce((s, x) => s + (x.cost || 0), 0);
  const ispTotal = subs.filter(x => x.category === 'ISP').reduce((s, x) => s + (x.cost || 0), 0);

  // Project budgets
  const pbs = await prisma.iTProjectBudget.findMany({
    where: { fiscalYear: selectedYear, companyMasterId: parsedCompanyMasterId }
  });
  const projectsPlan = pbs.reduce((s, x) => s + (x.allocatedBudget || 0), 0);
  const capexTotal = pbs.filter(x => x.budgetType === 'CAPEX').reduce((s, x) => s + (x.allocatedBudget || 0), 0);

  const grandTotal = peripheralsTotal + rentalTotal + subscriptionsTotal + ispTotal;
  const opexPct = ((rentalTotal + ispTotal + subscriptionsTotal) / (grandTotal || 1)) * 100;
  const capexPct = (capexTotal / (grandTotal || 1)) * 100;

  console.log({
    peripheralsTotal,
    rentalTotal,
    subscriptionsTotal,
    ispTotal,
    projectsPlan,
    capexTotal,
    grandTotal,
    opexPct: opexPct.toFixed(1),
    capexPct: capexPct.toFixed(1)
  });
}

getMogems2026Report().finally(() => prisma.$disconnect());
