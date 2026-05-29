const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

// SLA limits in milliseconds
const SLA_LIMITS = {
  HIGH: {
    response: 30 * 60 * 1000,      // 30 Minutes
    resolution: 2 * 60 * 60 * 1000  // 2 Hours
  },
  MEDIUM: {
    response: 2 * 60 * 60 * 1000,    // 2 Hours
    resolution: 6 * 60 * 60 * 1000   // 6 Hours
  },
  LOW: {
    response: 4 * 60 * 60 * 1000,    // 4 Hours
    resolution: 24 * 60 * 60 * 1000  // 24 Hours
  }
};

// GET /api/tickets
// Get all tickets with filtering support and role-based permissions
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { status, priority, companyId, search } = req.query;

    const where = {};

    // 1. Role-based filtering
    if (role === 'USER') {
      // Regular employees can only see their own tickets
      where.requesterId = userId;
    }

    // 2. Query filters
    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (companyId) {
      where.companyId = parseInt(companyId);
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        company: true,
        requester: {
          select: { id: true, name: true, email: true, department: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tickets);
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/:id
// Get detailed ticket by ID
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        company: true,
        requester: true,
        assignedTo: {
          select: { id: true, name: true, email: true, jobPosition: true, phone: true }
        },
        auditLogs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Role safety check
    if (role === 'USER' && ticket.requesterId !== userId) {
      return res.status(403).json({ error: 'Access forbidden. You do not own this ticket.' });
    }

    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// POST /api/tickets
// Create a new ticket
router.post('/', verifyToken, async (req, res, next) => {
  try {
    const { title, description, category, priority, companyId, requesterId } = req.body;
    const { role, id: currentUserId, name: currentUserName } = req.user;

    if (!title || !description || !category || !priority || !companyId || !requesterId) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const targetPriority = priority.toUpperCase();
    if (!SLA_LIMITS[targetPriority]) {
      return res.status(400).json({ error: 'Invalid priority level.' });
    }

    // Check if requester exists
    const requester = await prisma.user.findUnique({
      where: { id: requesterId }
    });
    if (!requester) {
      return res.status(404).json({ error: 'Selected employee/requester not found.' });
    }

    // Calculate SLA Targets
    const now = new Date();
    const limits = SLA_LIMITS[targetPriority];
    const slaResponseLimit = new Date(now.getTime() + limits.response);
    const slaResolutionLimit = new Date(now.getTime() + limits.resolution);

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        category,
        priority: targetPriority,
        companyId: parseInt(companyId),
        requesterId,
        slaResponseLimit,
        slaResolutionLimit,
        auditLogs: {
          create: {
            action: 'TICKET_CREATED',
            details: `Tiket dibuat oleh ${currentUserName} (${role}) dengan prioritas ${targetPriority}.`,
            performedBy: currentUserName
          }
        }
      },
      include: {
        company: true,
        requester: true
      }
    });

    res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/:id/status
// Update status (handles SLA calculations on state transitions)
router.patch('/:id/status', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, name: currentUserName, id: currentUserId } = req.user;

    if (role === 'USER') {
      return res.status(403).json({ error: 'Access forbidden. Only IT Agents or Admins can change status.' });
    }

    const newStatus = status.toUpperCase();
    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const now = new Date();
    const updateData = { status: newStatus };
    const auditLogData = {
      action: 'STATUS_CHANGED',
      details: `Status tiket diubah dari ${ticket.status} ke ${newStatus} oleh ${currentUserName}.`,
      performedBy: currentUserName
    };

    // First Response SLA Tracking
    if (newStatus === 'IN_PROGRESS' && !ticket.respondedAt) {
      updateData.respondedAt = now;
      // Auto-assign to current agent if not already assigned
      if (!ticket.assignedToId) {
        updateData.assignedToId = currentUserId;
        auditLogData.details += ` Tiket otomatis ditugaskan ke ${currentUserName}.`;
      }
    }

    // --- SLA Pause & Resume Logic ---
    let extraPausedMs = 0;
    
    // Leaving PENDING state -> Resume SLA
    if (ticket.status === 'PENDING' && ticket.lastPausedAt) {
      extraPausedMs = now.getTime() - new Date(ticket.lastPausedAt).getTime();
      updateData.totalPausedMs = ticket.totalPausedMs + extraPausedMs;
      updateData.lastPausedAt = null;
      auditLogData.details += ` SLA berjalan kembali (Pause duration: ${Math.round(extraPausedMs / 1000 / 60)} menit).`;
    }

    // Entering PENDING state -> Pause SLA
    if (newStatus === 'PENDING') {
      updateData.lastPausedAt = now;
      auditLogData.details += ` SLA dihentikan sementara (Paused).`;
    }

    // Entering RESOLVED state -> Check Resolution SLA Breach
    if (newStatus === 'RESOLVED') {
      updateData.resolvedAt = now;
      
      // Calculate total active resolution time
      const totalPaused = ticket.totalPausedMs + extraPausedMs;
      const resolutionDuration = now.getTime() - ticket.createdAt.getTime() - totalPaused;
      const originalLimitDuration = ticket.slaResolutionLimit.getTime() - ticket.createdAt.getTime();
      
      const isBreached = resolutionDuration > originalLimitDuration;
      updateData.isSlaBreached = isBreached;
      
      auditLogData.details += ` Tiket diselesaikan. Status SLA: ${isBreached ? 'BREACHED (Overdue)' : 'MET (On-Time)'}.`;
    }

    // Perform database updates
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        ...updateData,
        auditLogs: {
          create: auditLogData
        }
      },
      include: {
        company: true,
        requester: true,
        assignedTo: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/:id/assign
// Assign a ticket to an IT agent
router.patch('/:id/assign', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;
    const { role, name: currentUserName } = req.user;

    if (role === 'USER') {
      return res.status(403).json({ error: 'Access forbidden. Only IT Agents or Admins can assign tickets.' });
    }

    if (!assignedToId) {
      return res.status(400).json({ error: 'Agent ID is required.' });
    }

    const agent = await prisma.user.findUnique({
      where: { id: assignedToId }
    });

    if (!agent || (agent.role !== 'AGENT' && agent.role !== 'ADMIN')) {
      return res.status(400).json({ error: 'Selected user is not an IT Agent/Admin.' });
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        assignedToId,
        auditLogs: {
          create: {
            action: 'TICKET_ASSIGNED',
            details: `Tiket ditugaskan kepada ${agent.name} oleh ${currentUserName}.`,
            performedBy: currentUserName
          }
        }
      },
      include: {
        company: true,
        requester: true,
        assignedTo: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
