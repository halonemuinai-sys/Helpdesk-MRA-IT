const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/performance
// Calculates and returns IT agent performance metrics (SLA compliance, average response & resolution times)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    // 1. Fetch all users who are AGENT or ADMIN
    const agents = await prisma.user.findMany({
      where: {
        role: { in: ['AGENT', 'ADMIN'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobPosition: true,
        company: {
          select: { name: true }
        }
      }
    });

    // 2. Fetch all tickets assigned to any agent/admin
    const tickets = await prisma.ticket.findMany({
      where: {
        assignedToId: { not: null }
      },
      select: {
        assignedToId: true,
        status: true,
        isSlaBreached: true,
        createdAt: true,
        respondedAt: true,
        resolvedAt: true,
        totalPausedMs: true
      }
    });

    // 3. Process metrics for each agent
    const leaderboard = agents.map(agent => {
      const agentTickets = tickets.filter(t => t.assignedToId === agent.id);
      
      const totalAssigned = agentTickets.length;
      const openTickets = agentTickets.filter(t => ['OPEN', 'IN_PROGRESS', 'PENDING'].includes(t.status)).length;
      const resolvedTickets = agentTickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status));
      
      let slaMet = 0;
      let slaBreached = 0;
      let totalResolutionMs = 0;
      let resolvedCountWithTime = 0;
      
      let totalResponseMs = 0;
      let respondedCount = 0;

      agentTickets.forEach(t => {
        // Response speed calculation (for all tickets responded to)
        if (t.respondedAt) {
          const responseDuration = new Date(t.respondedAt).getTime() - new Date(t.createdAt).getTime();
          totalResponseMs += responseDuration;
          respondedCount++;
        }

        // Resolution and SLA calculations (only for resolved/closed tickets)
        if (['RESOLVED', 'CLOSED'].includes(t.status)) {
          if (t.isSlaBreached) {
            slaBreached++;
          } else {
            slaMet++;
          }

          if (t.resolvedAt) {
            const resolutionDuration = new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime() - t.totalPausedMs;
            totalResolutionMs += resolutionDuration;
            resolvedCountWithTime++;
          }
        }
      });

      const totalClosed = slaMet + slaBreached;
      const complianceRate = totalClosed > 0 ? Math.round((slaMet / totalClosed) * 100) : 100;
      
      const avgResponseMin = respondedCount > 0 
        ? Math.round((totalResponseMs / respondedCount) / 1000 / 60) 
        : 0;

      const avgResolutionHour = resolvedCountWithTime > 0 
        ? parseFloat(((totalResolutionMs / resolvedCountWithTime) / 1000 / 60 / 60).toFixed(1)) 
        : 0;

      return {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        jobPosition: agent.jobPosition,
        companyName: agent.company.name,
        metrics: {
          totalAssigned,
          openTickets,
          resolvedTickets: totalClosed,
          slaMet,
          slaBreached,
          complianceRate, // KPI SLA %
          avgResponseMin,  // Speed (min)
          avgResolutionHour // Speed (hrs)
        }
      };
    });

    // Sort leaderboard by SLA compliance rate desc, then by resolved tickets desc
    leaderboard.sort((a, b) => {
      if (b.metrics.complianceRate !== a.metrics.complianceRate) {
        return b.metrics.complianceRate - a.metrics.complianceRate;
      }
      return b.metrics.resolvedTickets - a.metrics.resolvedTickets;
    });

    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
