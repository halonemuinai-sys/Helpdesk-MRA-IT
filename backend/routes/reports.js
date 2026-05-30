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

module.exports = router;
