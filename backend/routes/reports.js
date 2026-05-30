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

    if (companyId) {
      where.companyId = parseInt(companyId);
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
      companies: companyDistribution
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
             ram.includes('4 gb') ||
             ram.includes('4gb');
    };

    let filteredAssets = assets;
    if (category === 'LAPTOP') {
      filteredAssets = assets.filter(a => !isSmartphone(a));
    } else if (category === 'SMARTPHONE') {
      filteredAssets = assets.filter(a => isSmartphone(a));
    }

    // 2. Fetch all company masters with their branches and users to aggregate budgets
    const companyMasters = await prisma.companyMaster.findMany({
      include: {
        companies: {
          include: {
            users: {
              select: {
                id: true,
                name: true,
                yearlyBudget: true
              }
            }
          }
        }
      }
    });

    const companyStats = [];
    const monthlyTotals = Array(12).fill(0);

    for (const master of companyMasters) {
      // Flatten all users belonging to this company master
      const usersMap = new Map();
      master.companies.forEach(c => {
        c.users.forEach(u => {
          usersMap.set(u.id, u);
        });
      });
      const uniqueUsers = Array.from(usersMap.values());
      const yearlyBudget = uniqueUsers.reduce((sum, u) => sum + u.yearlyBudget, 0);

      // Find rental assets for this company master
      const companyAssets = filteredAssets.filter(a => a.companyMasterId === master.id);
      
      // Calculate monthly costs for each month of the selected year
      const monthlyCosts = Array(12).fill(0);
      for (let m = 0; m < 12; m++) {
        const startOfMonth = new Date(year, m, 1);
        const endOfMonth = new Date(year, m + 1, 0, 23, 59, 59, 999);

        const activeAssets = companyAssets.filter(a => {
          const rentalStart = new Date(a.rentalStart);
          const rentalEnd = new Date(a.rentalEnd);
          return rentalStart <= endOfMonth && rentalEnd >= startOfMonth;
        });

        const cost = activeAssets.reduce((sum, a) => sum + (a.rentalCost || 0), 0);
        monthlyCosts[m] = cost;
        monthlyTotals[m] += cost;
      }

      const totalProjectedCost = monthlyCosts.reduce((sum, c) => sum + c, 0);
      
      // Count total distinct devices active in this year
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);
      const activeDevices = companyAssets.filter(a => {
        const rentalStart = new Date(a.rentalStart);
        const rentalEnd = new Date(a.rentalEnd);
        return rentalStart <= endOfYear && rentalEnd >= startOfYear;
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
                               ram.includes('4 gb') ||
                               ram.includes('4gb');
          
          if (isSmartphone) {
            return "PT Permata Landmarq Abadi";
          }
          return "PT Teknologi Skoring Nusantara";
        };

        companyStats.push({
          id: master.id,
          name: master.name,
          yearlyBudget,
          monthlyCosts,
          totalCost: totalProjectedCost,
          totalDevices: activeDevices.length,
          users: uniqueUsers.map(u => ({ id: u.id, name: u.name, yearlyBudget: u.yearlyBudget })),
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
            vendor: getVendorName(a),
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
// Updates a specific user's yearly budget
router.put('/rental-budget/user', verifyToken, async (req, res, next) => {
  try {
    const { userId, yearlyBudget } = req.body;
    if (!userId || yearlyBudget === undefined) {
      return res.status(400).json({ error: 'userId and yearlyBudget are required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { yearlyBudget: parseFloat(yearlyBudget) },
      select: {
        id: true,
        name: true,
        yearlyBudget: true
      }
    });

    res.json({ message: 'Budget updated successfully', user: updatedUser });
  } catch (err) {
    next(err);
  }
});

// PUT /api/reports/rental-budget/company
// Updates a company's total budget by distributing it evenly among all its users
router.put('/rental-budget/company', verifyToken, async (req, res, next) => {
  try {
    const { companyMasterId, totalBudget } = req.body;
    if (!companyMasterId || totalBudget === undefined) {
      return res.status(400).json({ error: 'companyMasterId and totalBudget are required.' });
    }

    const parsedBudget = parseFloat(totalBudget);
    
    // Find all users belonging to this master company
    const users = await prisma.user.findMany({
      where: {
        company: {
          companyMasterId: parseInt(companyMasterId)
        }
      }
    });

    if (users.length === 0) {
      return res.status(400).json({ error: 'No employees found under this company master to distribute budget to.' });
    }

    const N = users.length;
    const baseBudget = Math.floor(parsedBudget / N);
    const remainder = parsedBudget % N;

    // Distribute budget
    for (let i = 0; i < N; i++) {
      const userBudget = i < remainder ? baseBudget + 1 : baseBudget;
      await prisma.user.update({
        where: { id: users[i].id },
        data: { yearlyBudget: userBudget }
      });
    }

    res.json({ message: `Successfully distributed Rp ${parsedBudget.toLocaleString('id-ID')} among ${N} employees.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
