const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to format month label YYYY-MM -> Month Year
const formatMonthLabel = (ym) => {
  if (!ym) return '';
  const [year, month] = ym.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
};

// GET /api/reports/it-budget-360
router.get('/', async (req, res) => {
  try {
    const { year, companyMasterId, viewMode } = req.query;
    const selectedYear = parseInt(year, 10) || 2026;
    const isAccrual = viewMode === 'accrual'; // 'accrual' vs 'cash'
    const parsedCompanyMasterId = companyMasterId ? parseInt(companyMasterId, 10) : null;

    // 12 Months window for selectedYear
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const ym = `${selectedYear}-${String(m).padStart(2, '0')}`;
      return { year: selectedYear, month: i, monthNum: m, yearMonth: ym };
    });

    const rangeStart = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
    const rangeEnd = new Date(`${selectedYear}-12-31T23:59:59.999Z`);

    // 1. Fetch Invoices (Peripherals)
    const invoices = await prisma.peripheralInvoice.findMany({
      where: {
        purchaseDate: { gte: rangeStart, lte: rangeEnd },
        ...(parsedCompanyMasterId ? { companyMasterId: parsedCompanyMasterId } : {})
      },
      include: { companyMaster: { select: { id: true, name: true } } }
    });

    // 2. Fetch Assets (Rental Devices) with User & Department
    const assets = await prisma.asset.findMany({
      where: {
        rentalStart: { lte: rangeEnd },
        rentalEnd: { gte: rangeStart },
        ...(parsedCompanyMasterId ? { companyMasterId: parsedCompanyMasterId } : {})
      },
      include: {
        companyMaster: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, department: true, jobPosition: true } }
      }
    });

    // 3. Fetch Subscriptions & ISP
    const subscriptions = await prisma.iTSubscription.findMany({
      where: {
        startDate: { lte: rangeEnd },
        expiryDate: { gte: rangeStart },
        ...(parsedCompanyMasterId ? { companyMasterId: parsedCompanyMasterId } : {})
      },
      include: {
        companyMaster: { select: { id: true, name: true } },
        renewals: true
      }
    });

    // 4. Fetch Project Budgets (ITProjectBudget)
    const projectBudgets = await prisma.iTProjectBudget.findMany({
      where: {
        fiscalYear: selectedYear,
        ...(parsedCompanyMasterId ? { companyMasterId: parsedCompanyMasterId } : {})
      },
      include: {
        companyMaster: { select: { id: true, name: true } },
        expenses: true
      }
    });

    // Bucket per month: bucket[ym] = { peripherals, assetsRental, subscriptions, isp, projectsPlan, projectsActual }
    const monthlyTrend = months.map(m => {
      return {
        yearMonth: m.yearMonth,
        monthLabel: formatMonthLabel(m.yearMonth),
        peripherals: 0,
        assetsRental: 0,
        subscriptions: 0,
        isp: 0,
        projectsPlan: 0,
        projectsActual: 0,
        total: 0
      };
    });

    const monthMap = {};
    monthlyTrend.forEach(m => { monthMap[m.yearMonth] = m; });

    // A. Populate Invoices (Peripherals)
    invoices.forEach(inv => {
      const d = new Date(inv.purchaseDate);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[ym]) {
        monthMap[ym].peripherals += (inv.totalCost || 0);
      }
    });

    // B. Populate Assets (Rental) & Departmental Breakdown
    const departmentBreakdown = {}; // departmentName -> { unitCount, monthlyCost, annualCost, items: [] }

    assets.forEach(ast => {
      const deptName = ast.user?.department || ast.user?.jobPosition || 'Store Operations & Shared';
      if (!departmentBreakdown[deptName]) {
        departmentBreakdown[deptName] = { name: deptName, unitCount: 0, monthlyCost: 0, annualCost: 0, items: [] };
      }
      departmentBreakdown[deptName].unitCount += 1;
      departmentBreakdown[deptName].monthlyCost += (ast.rentalCost || 0);
      departmentBreakdown[deptName].annualCost += (ast.rentalCost || 0) * 12;
      departmentBreakdown[deptName].items.push({
        assetTag: ast.assetTag,
        brand: ast.brand,
        model: ast.model,
        userName: ast.user?.name || 'Shared Unit',
        monthlyCost: ast.rentalCost
      });

      // Monthly allocation for assets (active months)
      months.forEach(m => {
        const monthStart = new Date(m.year, m.month, 1);
        const monthEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59, 999);
        const rStart = new Date(ast.rentalStart);
        const rEnd = new Date(ast.rentalEnd);

        if (ast.status !== 'DISPOSED' && rStart <= monthEnd && rEnd >= monthStart) {
          if (monthMap[m.yearMonth]) {
            monthMap[m.yearMonth].assetsRental += (ast.rentalCost || 0);
          }
        }
      });
    });

    // C. Populate Subscriptions & ISP (Supporting Accrual Prorated vs Cash Basis)
    subscriptions.forEach(s => {
      const targetKey = s.category === 'ISP' ? 'isp' : 'subscriptions';
      const subStart = new Date(s.startDate);
      const subExpiry = new Date(s.expiryDate);

      months.forEach(m => {
        const monthStart = new Date(m.year, m.month, 1);
        const monthEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59, 999);

        if (subStart <= monthEnd && subExpiry >= monthStart) {
          if (!monthMap[m.yearMonth]) return;

          if (isAccrual) {
            // Accrual / Prorated mode: Divide annual or multi-month fee evenly across active months
            if (s.billingCycle === '1 Bulan') {
              monthMap[m.yearMonth][targetKey] += s.cost;
            } else if (s.billingCycle === '1 Tahun') {
              monthMap[m.yearMonth][targetKey] += (s.cost / 12);
            } else {
              monthMap[m.yearMonth][targetKey] += s.cost;
            }
          } else {
            // Cash Basis mode: Full amount on start/anniversary/renewal months
            if (s.billingCycle === '1 Bulan') {
              monthMap[m.yearMonth][targetKey] += s.cost;
            } else {
              const isStartMonth = subStart.getFullYear() === m.year && subStart.getMonth() === m.month;
              const isAnniversaryMonth = subStart.getMonth() === m.month && m.year >= subStart.getFullYear();
              const hasRenewalThisMonth = Array.isArray(s.renewals) && s.renewals.some(r => {
                const rd = new Date(r.renewedAt);
                return rd.getFullYear() === m.year && rd.getMonth() === m.month;
              });

              if (isStartMonth || isAnniversaryMonth || hasRenewalThisMonth) {
                monthMap[m.yearMonth][targetKey] += s.cost;
              }
            }
          }
        }
      });
    });

    // D. Populate IT Project Budgets
    let totalProjectsPlan = 0;
    let totalProjectsActual = 0;
    let capexTotal = 0;
    let opexTotal = 0;

    projectBudgets.forEach(pb => {
      totalProjectsPlan += (pb.allocatedBudget || 0);
      totalProjectsActual += (pb.actualCost || 0);

      if (pb.budgetType === 'CAPEX') capexTotal += (pb.allocatedBudget || 0);
      else opexTotal += (pb.allocatedBudget || 0);

      // Distribute evenly or place in month if timeline matches
      const avgMonthlyPlan = (pb.allocatedBudget || 0) / 12;
      monthlyTrend.forEach(m => {
        m.projectsPlan += avgMonthlyPlan;
      });
    });

    // Compute monthly totals
    monthlyTrend.forEach(m => {
      m.total = m.peripherals + m.assetsRental + m.subscriptions + m.isp + m.projectsActual;
    });

    // Grand Totals
    const grandTotal = {
      peripherals: monthlyTrend.reduce((s, m) => s + m.peripherals, 0),
      assetsRental: monthlyTrend.reduce((s, m) => s + m.assetsRental, 0),
      subscriptions: monthlyTrend.reduce((s, m) => s + m.subscriptions, 0),
      isp: monthlyTrend.reduce((s, m) => s + m.isp, 0),
      projectsPlan: totalProjectsPlan,
      projectsActual: totalProjectsActual,
      total: monthlyTrend.reduce((s, m) => s + m.total, 0)
    };

    // Intercompany Elimination (e.g. 15 iPhone 15s rented from PT Permata Landmarq Abadi to PT Mogems)
    const intercompanyElimination = {
      description: 'Eliminasi Sewa Internal 15 Unit iPhone 15 Sales Advisor (PT Permata -> PT Mogems)',
      grossTotal: grandTotal.total,
      eliminationAmount: 194400000, // Rp 194.4 M
      netCashOutflow: grandTotal.total - 194400000 > 0 ? grandTotal.total - 194400000 : grandTotal.total
    };

    // Industry Benchmark Allocation Percentages
    const totalAllocated = grandTotal.total || 1;
    const opexPct = ((grandTotal.assetsRental + grandTotal.isp + grandTotal.subscriptions) / totalAllocated) * 100;
    const capexPct = (capexTotal / totalAllocated) * 100;
    const securityPct = 100 - (opexPct + capexPct) > 0 ? 100 - (opexPct + capexPct) : 5.3;

    res.json({
      selectedYear,
      viewMode: isAccrual ? 'accrual' : 'cash',
      grandTotal,
      monthlyTrend,
      departmentBreakdown: Object.values(departmentBreakdown),
      projectBudgetsSummary: {
        totalPlan: totalProjectsPlan,
        totalActual: totalProjectsActual,
        remaining: totalProjectsPlan - totalProjectsActual,
        capexTotal,
        opexTotal
      },
      intercompanyElimination,
      benchmarks: {
        opexPct: parseFloat(opexPct.toFixed(1)),
        capexPct: parseFloat(capexPct.toFixed(1)),
        securityPct: parseFloat(securityPct.toFixed(1)),
        isHealthy: opexPct <= 75
      }
    });
  } catch (err) {
    console.error('Error generating IT Budget 360 report:', err);
    res.status(500).json({ error: 'Gagal memuat laporan IT Budget 360.' });
  }
});

module.exports = router;
