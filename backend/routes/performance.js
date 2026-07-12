const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');
const { sendMail } = require('../api/email');

const router = express.Router();

function generatePerformanceReportHtml(leaderboard, periodLabel) {
  const now = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta'
  });

  const totalAgents = leaderboard.length;
  const avgCompliance = totalAgents > 0
    ? Math.round(leaderboard.reduce((s, a) => s + a.metrics.complianceRate, 0) / totalAgents)
    : 0;
  const topAgent = leaderboard[0] || null;
  const avgResolution = totalAgents > 0
    ? parseFloat((leaderboard.reduce((s, a) => s + (a.metrics.avgResolutionHour || 0), 0) / totalAgents).toFixed(1))
    : 0;

  const medalEmoji = ['🥇', '🥈', '🥉'];
  const rankColors = [
    { bg: '#fffbeb', border: '#f59e0b', badge: '#d97706', text: '#92400e' },
    { bg: '#f8fafc', border: '#94a3b8', badge: '#64748b', text: '#334155' },
    { bg: '#fff7ed', border: '#fb923c', badge: '#ea580c', text: '#9a3412' },
  ];

  const top3Rows = leaderboard.slice(0, 3).map((agent, i) => {
    const c = rankColors[i];
    return `
      <td style="padding:0 8px 0 0; width:33%; vertical-align:top;">
        <div style="background:${c.bg}; border:1px solid ${c.border}; border-radius:12px; padding:16px; text-align:center;">
          <div style="font-size:28px; line-height:1; margin-bottom:8px;">${medalEmoji[i]}</div>
          <div style="font-weight:800; font-size:13px; color:#0f172a; margin-bottom:2px;">${agent.name}</div>
          <div style="font-size:10px; color:#64748b; margin-bottom:10px;">${agent.jobPosition || '-'}</div>
          <div style="background:${c.badge}; color:#fff; border-radius:20px; padding:3px 10px; font-size:11px; font-weight:700; display:inline-block; margin-bottom:10px;">
            KPI Score: ${agent.metrics.kpiScore}
          </div>
          <table width="100%" style="font-size:10px; color:#475569; border-collapse:collapse;">
            <tr>
              <td style="padding:3px 0; border-bottom:1px solid ${c.border}33;">Tickets</td>
              <td style="padding:3px 0; border-bottom:1px solid ${c.border}33; text-align:right; font-weight:700; color:#0f172a;">${agent.metrics.totalAssigned}</td>
            </tr>
            <tr>
              <td style="padding:3px 0; border-bottom:1px solid ${c.border}33;">SLA Compliance</td>
              <td style="padding:3px 0; border-bottom:1px solid ${c.border}33; text-align:right; font-weight:700; color:${agent.metrics.complianceRate >= 80 ? '#059669' : '#dc2626'};">${agent.metrics.complianceRate}%</td>
            </tr>
            <tr>
              <td style="padding:3px 0;">Avg Resolution</td>
              <td style="padding:3px 0; text-align:right; font-weight:700; color:#0f172a;">${agent.metrics.avgResolutionHour}h</td>
            </tr>
          </table>
        </div>
      </td>`;
  }).join('');

  const tableRows = leaderboard.map((agent, i) => {
    const isEven = i % 2 === 0;
    const compColor = agent.metrics.complianceRate >= 90 ? '#059669' : agent.metrics.complianceRate >= 70 ? '#d97706' : '#dc2626';
    return `
      <tr style="background:${isEven ? '#ffffff' : '#f8fafc'};">
        <td style="padding:10px 12px; font-weight:800; color:#64748b; text-align:center; font-size:12px;">${i + 1}</td>
        <td style="padding:10px 12px;">
          <div style="font-weight:700; font-size:12px; color:#0f172a;">${agent.name}</div>
          <div style="font-size:10px; color:#94a3b8;">${agent.jobPosition || '-'}</div>
        </td>
        <td style="padding:10px 12px; font-size:11px; color:#64748b; text-align:center;">${agent.metrics.totalAssigned}</td>
        <td style="padding:10px 12px; font-size:11px; color:#059669; text-align:center; font-weight:600;">${agent.metrics.slaMet}</td>
        <td style="padding:10px 12px; font-size:11px; color:#dc2626; text-align:center; font-weight:600;">${agent.metrics.slaBreached}</td>
        <td style="padding:10px 12px; text-align:center;">
          <span style="background:${compColor}1a; color:${compColor}; border-radius:20px; padding:2px 8px; font-size:11px; font-weight:700;">${agent.metrics.complianceRate}%</span>
        </td>
        <td style="padding:10px 12px; font-size:11px; color:#64748b; text-align:center;">${agent.metrics.avgResponseMin > 0 ? agent.metrics.avgResponseMin + ' min' : '-'}</td>
        <td style="padding:10px 12px; font-size:11px; color:#64748b; text-align:center;">${agent.metrics.avgResolutionHour > 0 ? agent.metrics.avgResolutionHour + ' h' : '-'}</td>
        <td style="padding:10px 12px; text-align:center;">
          <span style="background:#0ea5e91a; color:#0284c7; border-radius:20px; padding:2px 8px; font-size:11px; font-weight:800;">${agent.metrics.kpiScore}</span>
        </td>
      </tr>`;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9; padding:24px 0;">
    <tr><td align="center">
      <table width="680" cellpadding="0" cellspacing="0" style="max-width:680px; width:100%;">

        <!-- Header Banner -->
        <tr><td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0c4a6e 100%); border-radius:16px 16px 0 0; padding:32px 36px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div>
              <div style="font-size:10px; font-weight:700; letter-spacing:3px; color:#38bdf8; text-transform:uppercase; margin-bottom:6px;">MRA IT Helpdesk</div>
              <h1 style="margin:0; font-size:24px; font-weight:900; color:#ffffff; line-height:1.2;">IT Agent Performance Report</h1>
              <div style="font-size:14px; color:#94a3b8; margin-top:6px; font-weight:600;">Period: ${periodLabel}</div>
            </div>
          </div>
          <div style="margin-top:16px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.08); font-size:11px; color:#64748b;">
            Generated on ${now} &nbsp;|&nbsp; Confidential — For Management Use Only
          </div>
        </td></tr>

        <!-- Executive Summary KPIs -->
        <tr><td style="background:#ffffff; padding:24px 36px 16px;">
          <div style="font-size:10px; font-weight:800; letter-spacing:2px; color:#0ea5e9; text-transform:uppercase; margin-bottom:14px;">Executive Summary</div>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:25%; padding-right:8px;">
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:14px; text-align:center;">
                  <div style="font-size:26px; font-weight:900; color:#059669;">${totalAgents}</div>
                  <div style="font-size:10px; color:#64748b; font-weight:700; margin-top:2px;">Total Agents</div>
                </div>
              </td>
              <td style="width:25%; padding-right:8px;">
                <div style="background:${avgCompliance >= 80 ? '#f0fdf4' : '#fef2f2'}; border:1px solid ${avgCompliance >= 80 ? '#bbf7d0' : '#fecaca'}; border-radius:10px; padding:14px; text-align:center;">
                  <div style="font-size:26px; font-weight:900; color:${avgCompliance >= 80 ? '#059669' : '#dc2626'};">${avgCompliance}%</div>
                  <div style="font-size:10px; color:#64748b; font-weight:700; margin-top:2px;">Avg SLA Compliance</div>
                </div>
              </td>
              <td style="width:25%; padding-right:8px;">
                <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; padding:14px; text-align:center;">
                  <div style="font-size:13px; font-weight:900; color:#d97706; line-height:1.3;">${topAgent ? topAgent.name : '-'}</div>
                  <div style="font-size:10px; color:#64748b; font-weight:700; margin-top:2px;">🏆 Top Performer</div>
                </div>
              </td>
              <td style="width:25%;">
                <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:14px; text-align:center;">
                  <div style="font-size:26px; font-weight:900; color:#0284c7;">${avgResolution}h</div>
                  <div style="font-size:10px; color:#64748b; font-weight:700; margin-top:2px;">Avg Resolution</div>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Top 3 Podium -->
        ${leaderboard.length >= 1 ? `
        <tr><td style="background:#ffffff; padding:20px 36px 24px;">
          <div style="font-size:10px; font-weight:800; letter-spacing:2px; color:#0ea5e9; text-transform:uppercase; margin-bottom:14px;">Top Performers</div>
          <table width="100%" cellpadding="0" cellspacing="0"><tr>${top3Rows}</tr></table>
        </td></tr>` : ''}

        <!-- Full Leaderboard Table -->
        <tr><td style="background:#ffffff; padding:20px 36px 28px; border-radius:0 0 16px 16px;">
          <div style="font-size:10px; font-weight:800; letter-spacing:2px; color:#0ea5e9; text-transform:uppercase; margin-bottom:14px;">Full Leaderboard</div>
          <div style="overflow-x:auto;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; border-radius:10px; overflow:hidden; border:1px solid #e2e8f0;">
              <thead>
                <tr style="background:linear-gradient(to right,#0f172a,#1e3a5f);">
                  <th style="padding:10px 12px; font-size:10px; font-weight:700; color:#94a3b8; text-align:center; letter-spacing:0.5px;">#</th>
                  <th style="padding:10px 12px; font-size:10px; font-weight:700; color:#94a3b8; text-align:left; letter-spacing:0.5px;">AGENT</th>
                  <th style="padding:10px 12px; font-size:10px; font-weight:700; color:#94a3b8; text-align:center; letter-spacing:0.5px;">TICKETS</th>
                  <th style="padding:10px 12px; font-size:10px; font-weight:700; color:#94a3b8; text-align:center; letter-spacing:0.5px;">SLA ✓</th>
                  <th style="padding:10px 12px; font-size:10px; font-weight:700; color:#94a3b8; text-align:center; letter-spacing:0.5px;">SLA ✗</th>
                  <th style="padding:10px 12px; font-size:10px; font-weight:700; color:#94a3b8; text-align:center; letter-spacing:0.5px;">COMPLIANCE</th>
                  <th style="padding:10px 12px; font-size:10px; font-weight:700; color:#94a3b8; text-align:center; letter-spacing:0.5px;">AVG RESP</th>
                  <th style="padding:10px 12px; font-size:10px; font-weight:700; color:#94a3b8; text-align:center; letter-spacing:0.5px;">AVG RESOL</th>
                  <th style="padding:10px 12px; font-size:10px; font-weight:700; color:#94a3b8; text-align:center; letter-spacing:0.5px;">KPI</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0 0;">
          <div style="border-top:1px solid #e2e8f0; padding-top:16px; text-align:center; font-size:11px; color:#64748b; line-height:1.6;">
            <p style="margin:0 0 4px; font-weight:800; color:#0f172a; font-size:12px;">IT MRA - Service Helpdesk</p>
            <p style="margin:0 0 2px;">Wisma MRA Lt.6</p>
            <p style="margin:0 0 2px;">Telp: +62 (21) 2765 1957 ext 6637 &nbsp;|&nbsp; Email: <a href="mailto:helpdesk@mra.co.id" style="color:#0ea5e9; text-decoration:none;">helpdesk@mra.co.id</a></p>
            <p style="margin:0 0 12px;">Working hours: Monday–Friday (excl. Public Holidays) 9am–5pm</p>
            <p style="margin:0; font-size:10px; color:#94a3b8; border-top:1px dashed #f1f5f9; padding-top:10px;">This is an automated system notification. Please do not reply directly to this email.</p>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// POST /api/performance/send-report
router.post('/send-report', verifyToken, async (req, res, next) => {
  try {
    const { leaderboard, periodLabel } = req.body;
    if (!Array.isArray(leaderboard)) {
      return res.status(400).json({ error: 'leaderboard array required' });
    }
    const label = periodLabel || 'All Periods';
    const html = generatePerformanceReportHtml(leaderboard, label);
    await sendMail({
      to: 'Aris@mraretail.co.id',
      subject: `[MRA IT] Agent Performance Report — ${label}`,
      html,
    });
    res.json({ success: true, message: `Report sent to Aris@mraretail.co.id` });
  } catch (err) {
    next(err);
  }
});

// GET /api/performance
// Calculates and returns IT agent performance metrics (SLA compliance, average response & resolution times)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    // 1. Fetch all users who are AGENT
    const agents = await prisma.user.findMany({
      where: {
        role: 'AGENT'
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

    const { startDate, endDate } = req.query;
    const ticketsWhere = { assignedToId: { not: null } };
    if (startDate || endDate) {
      ticketsWhere.createdAt = {};
      if (startDate) ticketsWhere.createdAt.gte = new Date(startDate);
      if (endDate) ticketsWhere.createdAt.lte = new Date(endDate);
    }

    // 2. Fetch all tickets assigned to any agent/admin
    const tickets = await prisma.ticket.findMany({
      where: ticketsWhere,
      select: {
        assignedToId: true,
        status: true,
        isSlaBreached: true,
        createdAt: true,
        respondedAt: true,
        resolvedAt: true,
        totalPausedMs: true,
        slaResponseLimit: true,
        slaResolutionLimit: true,
        priority: true,
        category: true
      }
    });

    // 3. Process metrics for each agent (First Pass)
    const leaderboardRaw = agents.map(agent => {
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
      
      let responseSlaMet = 0;
      let responseSlaTotal = 0;
      let rawComplexityPoints = 0;

      agentTickets.forEach(t => {
        // Response speed calculation (for all tickets responded to)
        if (t.respondedAt) {
          const responseDuration = new Date(t.respondedAt).getTime() - new Date(t.createdAt).getTime();
          totalResponseMs += responseDuration;
          respondedCount++;
        }

        // Response SLA calculation
        if (t.respondedAt && t.slaResponseLimit) {
          responseSlaTotal++;
          if (new Date(t.respondedAt) <= new Date(t.slaResponseLimit)) {
            responseSlaMet++;
          }
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

          // Complexity calculations
          let basePoints = 1;
          if (t.priority === 'CRITICAL') basePoints = 10;
          else if (t.priority === 'HIGH') basePoints = 5;
          else if (t.priority === 'MEDIUM') basePoints = 3;

          const isHard = ['Hardware', 'Network'].includes(t.category);
          const multiplier = isHard ? 1.3 : 1.0;
          
          rawComplexityPoints += basePoints * multiplier;
        }
      });

      const totalClosed = slaMet + slaBreached;
      const complianceRate = totalClosed > 0 ? Math.round((slaMet / totalClosed) * 100) : 100;
      const responseSlaRate = responseSlaTotal > 0 ? Math.round((responseSlaMet / responseSlaTotal) * 100) : 100;
      
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
        rawComplexityPoints,
        responseSlaRate,
        metrics: {
          totalAssigned,
          openTickets,
          resolvedTickets: totalClosed,
          slaMet,
          slaBreached,
          complianceRate, // KPI SLA %
          avgResponseMin,  // Speed (min)
          avgResolutionHour, // Speed (hrs)
          totalResponseMs,
          respondedCount,
          totalResolutionMs,
          resolvedCountWithTime
        }
      };
    });

    // Find maximum complexity points for relative scaling
    const maxComplexityPoints = Math.max(...leaderboardRaw.map(a => a.rawComplexityPoints), 0);

    // Second Pass: Compute complexityScore and final kpiScore
    const leaderboard = leaderboardRaw.map(agent => {
      const complexityScore = maxComplexityPoints > 0 
        ? Math.round((agent.rawComplexityPoints / maxComplexityPoints) * 100)
        : 0;

      // Final KPI score logic: 25% Response SLA, 35% Resolution SLA, 40% Complexity
      const kpiScore = agent.metrics.totalAssigned > 0
        ? Math.round((0.25 * agent.responseSlaRate) + (0.35 * agent.metrics.complianceRate) + (0.40 * complexityScore))
        : 0;

      const { rawComplexityPoints, responseSlaRate, ...rest } = agent;
      return {
        ...rest,
        metrics: {
          ...rest.metrics,
          complexityPoints: Math.round(rawComplexityPoints * 10) / 10,
          complexityScore,
          kpiScore
        }
      };
    });

    // Sort leaderboard by kpiScore desc, then by totalAssigned desc
    leaderboard.sort((a, b) => {
      if (b.metrics.kpiScore !== a.metrics.kpiScore) {
        return b.metrics.kpiScore - a.metrics.kpiScore;
      }
      return b.metrics.totalAssigned - a.metrics.totalAssigned;
    });

    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
