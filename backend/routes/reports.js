const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/reports
// Returns structured analytics data for the dashboard and visual reports
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const where = {};

    if (companyId) {
      where.companyId = parseInt(companyId);
    }

    // 1. Fetch all tickets under query criteria
    const tickets = await prisma.ticket.findMany({
      where,
      select: {
        id: true,
        status: true,
        priority: true,
        category: true,
        isSlaBreached: true,
        createdAt: true,
        companyId: true,
        company: {
          select: { name: true }
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
      HIGH: 0
    };

    // 5. Aggregate SLA compliance
    let slaMet = 0;
    let slaBreached = 0;

    // 6. Aggregate company-specific ticket counts
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
        categoryCounts[ticket.category] = 1; // Safeguard for dynamic categories
      }

      // Priority
      if (priorityCounts[ticket.priority] !== undefined) {
        priorityCounts[ticket.priority]++;
      }

      // SLA Compliance (Resolved or Closed tickets)
      if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
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

    res.json({
      totalTickets: tickets.length,
      status: statusCounts,
      categories: categoryCounts,
      priorities: priorityCounts,
      sla: {
        met: slaMet,
        breached: slaBreached,
        complianceRate: slaComplianceRate
      },
      companies: companyDistribution
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
