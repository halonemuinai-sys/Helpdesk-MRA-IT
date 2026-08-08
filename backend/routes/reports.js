const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/reports
// Returns structured analytics data for the dashboard and visual reports
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { companyId, startDate, endDate } = req.query;
    const where = {};

    if (companyId && companyId !== 'undefined' && companyId !== 'null' && companyId !== '') {
      const parsedId = parseInt(companyId);
      if (!isNaN(parsedId)) {
        where.companyId = parsedId;
      }
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // 1. Fetch all tickets under query criteria
    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        id: true,
        status: true,
        priority: true,
        category: true,
        subCategory: true,
        source: true,
        isSlaBreached: true,
        createdAt: true,
        respondedAt: true,
        resolvedAt: true,
        totalPausedMs: true,
        companyId: true,
        company: {
          select: { name: true }
        },
        requester: {
          select: { department: true }
        }
      }
    });

    // 2. Aggregate status counts
    const statusCounts = {
      OPEN: 0,
      IN_PROGRESS: 0,
      PENDING: 0,
      RESOLVED: 0,
      CLOSED: 0
    };

    // 3. Aggregate category counts
    const categoryCounts = {
      Hardware: 0,
      Software: 0,
      Network: 0,
      Access: 0
    };

    // 4. Aggregate priority counts
    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0
    };

    // 5. Aggregate source counts
    const sourceCounts = {};

    // 6. Aggregate department counts
    const departmentCounts = {};

    // 7. Aggregate subcategory counts
    const subCategoryCounts = {};

    // 8. Aggregate SLA compliance & durations
    let slaMet = 0;
    let slaBreached = 0;

    let totalResponseTimeMs = 0;
    let respondedTicketsCount = 0;

    let totalResolutionTimeMs = 0;
    let resolvedTicketsCount = 0;

    // 9. Aggregate company-specific ticket counts
    const companyDistribution = {};

    tickets.forEach(ticket => {
      // Status
      if (statusCounts[ticket.status] !== undefined) {
        statusCounts[ticket.status]++;
      }
      
      // Category
      if (categoryCounts[ticket.category] !== undefined) {
        categoryCounts[ticket.category]++;
      } else {
        categoryCounts[ticket.category] = (categoryCounts[ticket.category] || 0) + 1; // Safeguard for dynamic categories
      }

      // Sub-category
      const subCat = ticket.subCategory || '-';
      subCategoryCounts[subCat] = (subCategoryCounts[subCat] || 0) + 1;

      // Source
      const src = ticket.source || 'Walk-in';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;

      // Department
      const dept = ticket.requester?.department || 'General';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

      // Priority
      if (priorityCounts[ticket.priority] !== undefined) {
        priorityCounts[ticket.priority]++;
      }

      // Response Time calculation
      if (ticket.respondedAt) {
        const timeDiff = new Date(ticket.respondedAt).getTime() - new Date(ticket.createdAt).getTime();
        if (timeDiff >= 0) {
          totalResponseTimeMs += timeDiff;
          respondedTicketsCount++;
        }
      }

      // Resolution Time calculation (for Resolved or Closed tickets)
      if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
        if (ticket.resolvedAt) {
          const rawDiff = new Date(ticket.resolvedAt).getTime() - new Date(ticket.createdAt).getTime();
          const netDiff = rawDiff - (ticket.totalPausedMs || 0);
          totalResolutionTimeMs += Math.max(0, netDiff);
          resolvedTicketsCount++;
        }

        if (ticket.isSlaBreached) {
          slaBreached++;
        } else {
          slaMet++;
        }
      }

      // Company Distribution
      const compName = ticket.company.name;
      companyDistribution[compName] = (companyDistribution[compName] || 0) + 1;
    });

    const totalResolved = slaMet + slaBreached;
    const slaComplianceRate = totalResolved > 0 ? Math.round((slaMet / totalResolved) * 100) : 100;

    const avgResponseHours = respondedTicketsCount > 0 
      ? parseFloat((totalResponseTimeMs / (1000 * 60 * 60 * respondedTicketsCount)).toFixed(1))
      : 0;

    const avgResolutionHours = resolvedTicketsCount > 0
      ? parseFloat((totalResolutionTimeMs / (1000 * 60 * 60 * resolvedTicketsCount)).toFixed(1))
      : 0;

    res.json({
      totalTickets: tickets.length,
      status: statusCounts,
      categories: categoryCounts,
      priorities: priorityCounts,
      sources: sourceCounts,
      departments: departmentCounts,
      subCategories: subCategoryCounts,
      sla: {
        met: slaMet,
        breached: slaBreached,
        complianceRate: slaComplianceRate,
        avgResponseHours,
        avgResolutionHours
      },
      companies: companyDistribution,
      tickets: tickets
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/rental-analysis
// Returns structured rental cost projection data for a given year
router.get('/rental-analysis', verifyToken, async (req, res, next) => {
  try {
    const year = parseInt(req.query.year || new Date().getFullYear());
    const category = req.query.category || 'ALL'; // ALL, LAPTOP, SMARTPHONE
    
    // 1. Fetch all rental assets
    const assets = await prisma.asset.findMany({
      where: {
        ownershipType: 'RENTAL'
      },
      include: {
        companyMaster: true,
        user: true
      }
    });

    const isSmartphone = (asset) => {
      const brand = (asset.brand || '').toLowerCase();
      const model = (asset.model || '').toLowerCase();
      const os = (asset.os || '').toLowerCase();
      const ram = (asset.ram || '').toLowerCase();

      return (brand === 'apple' && model.includes('iphone')) ||
             os.includes('ios') ||
             os.includes('android') ||
             brand === 'samsung' ||
             brand === 'oppo' ||
             brand === 'vivo' ||
             brand === 'xiaomi' ||
             brand === 'realme' ||
             brand === 'infinix' ||
             brand === 'iqoo' ||
             parseInt(ram, 10) === 4;
    };

    let filteredAssets = assets;
    if (category === 'LAPTOP') {
      filteredAssets = assets.filter(a => !isSmartphone(a));
    } else if (category === 'SMARTPHONE') {
      filteredAssets = assets.filter(a => isSmartphone(a));
    }

    // 2. Fetch all company masters with their branches and users to aggregate budgets
    const sector = req.query.sector;
    const companyMasters = await prisma.companyMaster.findMany({
      where: sector && sector !== 'ALL' ? { sector } : undefined,
      include: {
        companies: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                monthlyBudget: true,
                jobPosition: true
              }
            }
          }
        }
      }
    });

    const companyStats = [];
    const monthlyTotals = Array(12).fill(0);

    for (const master of companyMasters) {
      // Flatten all users belonging to this company master, excluding Office Boy, Office Girl, and Driver
      const usersMap = new Map();
      master.companies.forEach(c => {
        c.users.forEach(u => {
          const position = (u.jobPosition || '').toLowerCase().trim();
          if (position !== 'office boy' && position !== 'office girl' && position !== 'driver') {
            usersMap.set(u.id, u);
          }
        });
      });
      const uniqueUsers = Array.from(usersMap.values());
      const empMonthlyBudget = uniqueUsers.reduce((sum, u) => sum + (u.monthlyBudget || 0), 0);
      const monthlyBudget = empMonthlyBudget + (master.sharedBudget || 0);
      const yearlyBudget = monthlyBudget * 12;

      // Find rental assets for this company master
      const companyAssets = filteredAssets.filter(a => a.companyMasterId === master.id);
      
      // Calculate monthly costs for each month of the selected year (postpaid shift - delayed 1 month, no prorate)
      const monthlyCosts = Array(12).fill(0);
      for (let M = 0; M < 12; M++) {
        // Payment Month M (0 = Jan, 11 = Dec)
        // Usage Month is M - 1.
        let usageYear = year;
        let usageMonth = M - 1;
        if (M === 0) {
          usageYear = year - 1;
          usageMonth = 11; // December of previous year
        }

        const usageStartOfMonth = new Date(usageYear, usageMonth, 1);
        const usageEndOfMonth = new Date(usageYear, usageMonth + 1, 0, 23, 59, 59, 999);

        const activeAssets = companyAssets.filter(a => {
          const rentalStart = new Date(a.rentalStart);
          const rentalEnd = new Date(a.rentalEnd);
          return rentalStart <= usageEndOfMonth && rentalEnd >= usageStartOfMonth;
        });

        const cost = activeAssets.reduce((sum, a) => sum + (a.rentalCost || 0), 0);
        monthlyCosts[M] = cost;
        monthlyTotals[M] += cost;
      }

      const totalProjectedCost = monthlyCosts.reduce((sum, c) => sum + c, 0);
      
      // Count total distinct devices active in this year's payment period (Dec Y-1 to Nov Y)
      const startOfPeriod = new Date(year - 1, 11, 1); // December 1st of previous year
      const endOfPeriod = new Date(year, 11, 0, 23, 59, 59, 999); // November 30th of current year
      const activeDevices = companyAssets.filter(a => {
        const rentalStart = new Date(a.rentalStart);
        const rentalEnd = new Date(a.rentalEnd);
        return rentalStart <= endOfPeriod && rentalEnd >= startOfPeriod;
      });

      // Only include company masters that have a budget or have assets/devices
      if (yearlyBudget > 0 || activeDevices.length > 0) {
        const getVendorName = (asset) => {
          const brand = (asset.brand || '').toLowerCase();
          const model = (asset.model || '').toLowerCase();
          const os = (asset.os || '').toLowerCase();
          const ram = (asset.ram || '').toLowerCase();
          const isSmartphone = (brand === 'apple' && model.includes('iphone')) ||
                               os.includes('ios') ||
                               os.includes('android') ||
                               brand === 'samsung' ||
                               brand === 'oppo' ||
                               brand === 'vivo' ||
                               brand === 'xiaomi' ||
                               brand === 'realme' ||
                               brand === 'infinix' ||
                               brand === 'iqoo' ||
                               parseInt(ram, 10) === 4;

          if (isSmartphone) {
            return "PT Permata Landmarq Abadi";
          }
          return "PT Teknologi Skoring Nusantara";
        };

        companyStats.push({
          id: master.id,
          name: master.name,
          sharedBudget: master.sharedBudget || 0,
          monthlyBudget,
          yearlyBudget,
          monthlyCosts,
          totalCost: totalProjectedCost,
          totalDevices: activeDevices.length,
          users: uniqueUsers.map(u => ({ id: u.id, name: u.name, monthlyBudget: u.monthlyBudget })),
          assets: activeDevices.map(a => ({
            id: a.id,
            brand: a.brand,
            model: a.model,
            assetTag: a.assetTag,
            deviceRef: a.deviceRef,
            vendorRef: a.vendorRef,
            rentalCost: a.rentalCost,
            rentalStart: a.rentalStart,
            rentalEnd: a.rentalEnd,
            status: a.status,
            vendor: a.vendor || getVendorName(a),
            user: a.user ? { name: a.user.name, department: a.user.department } : null
          }))
        });
      }
    }

    res.json({
      year,
      monthlyTotals,
      companyStats
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reports/rental-budget/user
// Updates a specific user's monthly budget
router.put('/rental-budget/user', verifyToken, async (req, res, next) => {
  try {
    const { userId, monthlyBudget } = req.body;
    if (!userId || monthlyBudget === undefined) {
      return res.status(400).json({ error: 'userId and monthlyBudget are required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { monthlyBudget: parseFloat(monthlyBudget) },
      select: {
        id: true,
        name: true,
        monthlyBudget: true
      }
    });

    res.json({ message: 'Budget updated successfully', user: updatedUser });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reports/rental-budget/company
// Updates a company's total monthly budget (distributing it among users) and/or its shared budget
router.put('/rental-budget/company', verifyToken, async (req, res, next) => {
  try {
    const { companyMasterId, totalBudget, sharedBudget } = req.body;
    if (!companyMasterId) {
      return res.status(400).json({ error: 'companyMasterId is required.' });
    }

    if (totalBudget === undefined && sharedBudget === undefined) {
      return res.status(400).json({ error: 'At least totalBudget or sharedBudget is required.' });
    }

    // 1. Update sharedBudget if provided
    if (sharedBudget !== undefined) {
      await prisma.companyMaster.update({
        where: { id: parseInt(companyMasterId) },
        data: { sharedBudget: parseFloat(sharedBudget) }
      });
    }

    // 2. Distribute totalBudget if provided
    let N = 0;
    let parsedBudget = 0;
    if (totalBudget !== undefined) {
      parsedBudget = parseFloat(totalBudget);
      
      const allUsers = await prisma.user.findMany({
        where: {
          company: {
            companyMasterId: parseInt(companyMasterId)
          }
        }
      });

      const users = allUsers.filter(u => {
        const position = (u.jobPosition || '').toLowerCase().trim();
        return position !== 'office boy' && position !== 'office girl' && position !== 'driver';
      });

      const excludedUsers = allUsers.filter(u => {
        const position = (u.jobPosition || '').toLowerCase().trim();
        return position === 'office boy' || position === 'office girl' || position === 'driver';
      });

      // Reset budget for excluded positions to 0
      for (const eu of excludedUsers) {
        if (eu.monthlyBudget !== 0) {
          await prisma.user.update({
            where: { id: eu.id },
            data: { monthlyBudget: 0 }
          });
        }
      }

      if (users.length > 0) {
        N = users.length;
        const baseBudget = Math.floor(parsedBudget / N);
        const remainder = parsedBudget % N;

        for (let i = 0; i < N; i++) {
          const userBudget = i < remainder ? baseBudget + 1 : baseBudget;
          await prisma.user.update({
            where: { id: users[i].id },
            data: { monthlyBudget: userBudget }
          });
        }
      }
    }

    res.json({ 
      message: 'Budget updated successfully.',
      distributedCount: N,
      distributedAmount: parsedBudget,
      sharedBudget: sharedBudget !== undefined ? parseFloat(sharedBudget) : undefined
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/it-cost-overview
// Combines IT Peripherals purchases, Asset rental costs, and IT Subscriptions into a
// single 12-month spend overview, broken down by month and by company master entity.
router.get('/it-cost-overview', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const { companyMasterId, year } = req.query;
    const parsedCompanyMasterId = companyMasterId ? parseInt(companyMasterId, 10) : null;

    // Build the months window: either Jan-Dec of an explicitly selected year, or
    // (default, no year given) the trailing 12 months ending at the current month.
    const now = new Date();
    const months = [];
    if (year) {
      const targetYear = parseInt(year, 10);
      for (let m = 0; m < 12; m++) {
        months.push({
          yearMonth: `${targetYear}-${String(m + 1).padStart(2, '0')}`,
          year: targetYear,
          month: m
        });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          year: d.getFullYear(),
          month: d.getMonth()
        });
      }
    }
    const rangeStart = new Date(months[0].year, months[0].month, 1);
    const rangeEnd = new Date(months[11].year, months[11].month + 1, 0, 23, 59, 59, 999);

    // 1. Peripherals invoices dated within the window
    const invoices = await prisma.peripheralInvoice.findMany({
      where: {
        purchaseDate: { gte: rangeStart, lte: rangeEnd },
        ...(parsedCompanyMasterId ? { companyMasterId: parsedCompanyMasterId } : {})
      },
      include: { companyMaster: { select: { name: true } } }
    });

    // 2. Rental assets active at any point within the window
    const rentalAssets = await prisma.asset.findMany({
      where: {
        ownershipType: 'RENTAL',
        rentalStart: { lte: rangeEnd },
        rentalEnd: { gte: rangeStart },
        ...(parsedCompanyMasterId ? { companyMasterId: parsedCompanyMasterId } : {})
      },
      include: { companyMaster: { select: { name: true } } }
    });

    // 3. Subscriptions actually paid (started/renewed) within the window — cash basis,
    // same as Peripherals invoices: the full cost lands in the month it was actually paid,
    // not spread across the months the subscription happens to cover.
    const subscriptions = await prisma.iTSubscription.findMany({
      where: {
        startDate: { gte: rangeStart, lte: rangeEnd },
        ...(parsedCompanyMasterId ? { companyMasterId: parsedCompanyMasterId } : {})
      },
      include: { companyMaster: { select: { name: true } } }
    });

    // Per-entity-per-month buckets: bucket[yearMonth][entityName] = { peripherals, assetsRental, subscriptions }
    const bucket = {};
    months.forEach(m => { bucket[m.yearMonth] = {}; });
    const ensureBucket = (yearMonth, entityName) => {
      if (!bucket[yearMonth][entityName]) {
        bucket[yearMonth][entityName] = { peripherals: 0, assetsRental: 0, subscriptions: 0, isp: 0 };
      }
      return bucket[yearMonth][entityName];
    };

    invoices.forEach(inv => {
      const d = new Date(inv.purchaseDate);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!bucket[ym]) return;
      const entityName = inv.companyMaster?.name || 'Tanpa Entitas';
      // Service rows already linked to an auto-created subscription are counted under
      // "subscriptions" below — exclude them here so the combined total isn't double-counted.
      const linkedSubscriptionCost = Array.isArray(inv.serviceCostBreakdown)
        ? inv.serviceCostBreakdown.filter(row => row.subscriptionId).reduce((sum, row) => sum + (row.cost || 0), 0)
        : 0;
      ensureBucket(ym, entityName).peripherals += inv.totalCost - linkedSubscriptionCost;
    });

    // Subscriptions & ISP: cash basis, full cost in the month actually paid
    subscriptions.forEach(s => {
      const d = new Date(s.startDate);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!bucket[ym]) return;
      const entityName = s.companyMaster?.name || 'Tanpa Entitas';
      if (s.category === 'ISP') {
        ensureBucket(ym, entityName).isp += s.cost;
      } else {
        ensureBucket(ym, entityName).subscriptions += s.cost;
      }
    });

    // Rental assets: still spread across active months (these are genuinely billed monthly)
    months.forEach(m => {
      const monthStart = new Date(m.year, m.month, 1);
      const monthEnd = new Date(m.year, m.month + 1, 0, 23, 59, 59, 999);

      rentalAssets.forEach(a => {
        const rentalStart = new Date(a.rentalStart);
        const rentalEnd = new Date(a.rentalEnd);
        if (rentalStart <= monthEnd && rentalEnd >= monthStart) {
          const entityName = a.companyMaster?.name || 'Tanpa Entitas';
          ensureBucket(m.yearMonth, entityName).assetsRental += a.rentalCost;
        }
      });
    });

    // Derive monthly trend (summed across entities)
    const monthlyTrend = months.map(m => {
      let peripherals = 0, assetsRental = 0, subscriptions = 0, isp = 0;
      Object.values(bucket[m.yearMonth]).forEach(e => {
        peripherals += e.peripherals;
        assetsRental += e.assetsRental;
        subscriptions += e.subscriptions;
        isp += e.isp;
      });
      return {
        yearMonth: m.yearMonth,
        peripherals: Math.round(peripherals),
        assetsRental: Math.round(assetsRental),
        subscriptions: Math.round(subscriptions),
        isp: Math.round(isp),
        total: Math.round(peripherals + assetsRental + subscriptions + isp)
      };
    });

    // Derive per-entity totals (summed across the 12-month window)
    const entityTotals = {};
    months.forEach(m => {
      Object.entries(bucket[m.yearMonth]).forEach(([name, vals]) => {
        if (!entityTotals[name]) entityTotals[name] = { peripherals: 0, assetsRental: 0, subscriptions: 0, isp: 0 };
        entityTotals[name].peripherals += vals.peripherals;
        entityTotals[name].assetsRental += vals.assetsRental;
        entityTotals[name].subscriptions += vals.subscriptions;
        entityTotals[name].isp += vals.isp;
      });
    });
    const byEntity = Object.entries(entityTotals)
      .map(([name, vals]) => ({
        name,
        peripherals: Math.round(vals.peripherals),
        assetsRental: Math.round(vals.assetsRental),
        subscriptions: Math.round(vals.subscriptions),
        isp: Math.round(vals.isp),
        total: Math.round(vals.peripherals + vals.assetsRental + vals.subscriptions + vals.isp)
      }))
      .sort((a, b) => b.total - a.total);

    const currentMonthSummary = monthlyTrend[monthlyTrend.length - 1];

    const grandTotal = monthlyTrend.reduce((acc, m) => ({
      peripherals: acc.peripherals + m.peripherals,
      assetsRental: acc.assetsRental + m.assetsRental,
      subscriptions: acc.subscriptions + m.subscriptions,
      isp: acc.isp + m.isp,
      total: acc.total + m.total
    }), { peripherals: 0, assetsRental: 0, subscriptions: 0, isp: 0, total: 0 });

    res.json({
      currentMonthSummary,
      grandTotal,
      monthlyTrend,
      byEntity
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/expiring-soon
// Combines Asset (rental) lease expiry and IT Subscription expiry within the next N days
// (default 30) so the dashboard can surface both with a single call.
router.get('/expiring-soon', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const days = parseInt(req.query.days, 10) || 30;
    const now = new Date();
    const horizon = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const assets = await prisma.asset.findMany({
      where: {
        ownershipType: 'RENTAL',
        status: { not: 'DISPOSED' },
        rentalEnd: { lte: horizon }
      },
      select: {
        id: true, assetTag: true, brand: true, model: true, rentalEnd: true,
        user: { select: { name: true } },
        companyMaster: { select: { name: true } }
      },
      orderBy: { rentalEnd: 'asc' }
    });

    const subscriptions = await prisma.iTSubscription.findMany({
      where: {
        status: 'ACTIVE',
        expiryDate: { lte: horizon }
      },
      select: {
        id: true, name: true, vendor: true, expiryDate: true,
        companyMaster: { select: { name: true } }
      },
      orderBy: { expiryDate: 'asc' }
    });

    const toItem = (type, expiryDate) => {
      const diffDays = Math.ceil((new Date(expiryDate) - now) / (1000 * 60 * 60 * 24));
      return { type, expiryDate, diffDays, isExpired: diffDays < 0 };
    };

    const assetItems = assets.map(a => ({
      ...toItem('ASSET', a.rentalEnd),
      id: a.id,
      label: `${a.brand} ${a.model}`,
      tag: a.assetTag,
      assignedTo: a.user?.name || null,
      entity: a.companyMaster?.name || null
    }));

    const subscriptionItems = subscriptions.map(s => ({
      ...toItem('SUBSCRIPTION', s.expiryDate),
      id: s.id,
      label: s.name,
      tag: s.vendor,
      assignedTo: null,
      entity: s.companyMaster?.name || null
    }));

    const combined = [...assetItems, ...subscriptionItems].sort((a, b) => a.diffDays - b.diffDays);

    res.json({
      days,
      total: combined.length,
      expiredCount: combined.filter(i => i.isExpired).length,
      items: combined
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
