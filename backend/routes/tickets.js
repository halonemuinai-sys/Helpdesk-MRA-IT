const express = require('express');
const prisma = require('../api/db');
const { verifyToken, checkRole } = require('../api/authMiddleware');
const {
  sendTicketCreatedEmail,
  sendTicketStatusChangedEmail,
  sendTicketAssignedEmail,
  sendTicketClosedToAgentEmail
} = require('../api/email');

const router = express.Router();

// Helper to generate sequential thread-safe Ticket IDs (e.g. MRA-00001, MRA-00002)
async function generateNextTicketId() {
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS ticket_seq START 1`);
  
  let exists = true;
  let ticketId = '';
  
  while (exists) {
    const result = await prisma.$queryRawUnsafe(`SELECT nextval('ticket_seq') as val`);
    const seqVal = Number(result[0].val);
    ticketId = `MRA-${String(seqVal).padStart(5, '0')}`;
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });
    exists = !!ticket;
  }
  
  return ticketId;
}

// SLA limits in milliseconds
const SLA_LIMITS = {
  CRITICAL: {
    response: 30 * 60 * 1000,       // 30 Minutes
    resolution: 3 * 60 * 60 * 1000   // 3 Hours
  },
  HIGH: {
    response: 30 * 60 * 1000,       // 30 Minutes
    resolution: 5 * 60 * 60 * 1000   // 5 Hours
  },
  MEDIUM: {
    response: 2 * 60 * 60 * 1000,     // 2 Hours
    resolution: 8 * 60 * 60 * 1000    // 8 Hours
  },
  LOW: {
    response: 4 * 60 * 60 * 1000,     // 4 Hours
    resolution: 24 * 60 * 60 * 1000   // 24 Hours
  }
};

// GET /api/tickets
// Get all tickets with filtering support and role-based permissions
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const { status, priority, companyId, search, startDate, endDate, limit, skip } = req.query;

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
    if (companyId && companyId !== 'undefined' && companyId !== 'null' && companyId !== '') {
      const parsedId = parseInt(companyId);
      if (!isNaN(parsedId)) {
        where.companyId = parsedId;
      }
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const take = limit ? parseInt(limit) : undefined;
    const skipAmount = skip ? parseInt(skip) : undefined;

    const tickets = await prisma.ticket.findMany({
      where,
      take,
      skip: skipAmount,
      include: {
        company: true,
        requester: {
          select: { id: true, name: true, email: true, department: true }
        },
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        auditLogs: {
          select: { action: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tickets);
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/categories
// Get all ticket categories and subcategories metadata
router.get('/categories', verifyToken, async (req, res, next) => {
  try {
    const categories = await prisma.categoryMetadata.findMany({
      orderBy: [
        { category: 'asc' },
        { subCategory: 'asc' }
      ]
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/tickets/categories
// Add a new category metadata mapping
router.post('/categories', verifyToken, async (req, res, next) => {
  try {
    const { category, subCategory } = req.body;
    if (!category || !subCategory) {
      return res.status(400).json({ error: 'Category and subCategory are required.' });
    }

    const newMeta = await prisma.categoryMetadata.upsert({
      where: {
        category_subCategory: {
          category,
          subCategory: subCategory.trim()
        }
      },
      update: {},
      create: {
        category,
        subCategory: subCategory.trim()
      }
    });

    res.status(201).json(newMeta);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/categories/:id
// Update category metadata (e.g. associated brands)
router.patch('/categories/:id', verifyToken, async (req, res, next) => {
  try {
    const { role } = req.user;
    if (role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const { brands } = req.body;

    if (!Array.isArray(brands)) {
      return res.status(400).json({ error: 'Brands must be an array of strings.' });
    }

    const updatedMeta = await prisma.categoryMetadata.update({
      where: { id: parseInt(id) },
      data: {
        brands: brands.map(b => b.trim())
      }
    });

    // Write system audit log
    await prisma.systemAuditLog.create({
      data: {
        action: 'CATEGORY_BRANDS_UPDATED',
        details: `Brands for category ${updatedMeta.category} - ${updatedMeta.subCategory} updated to: ${brands.join(', ')}`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(updatedMeta);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tickets/categories/:id
// Delete category metadata by ID (ADMIN deletes immediately, AGENT creates an ApprovalRequest)
router.delete('/categories/:id', verifyToken, async (req, res, next) => {
  try {
    const { role, id: userId, name: userName, email: userEmail } = req.user;
    if (role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const { reason } = req.body;
    
    // Check if category metadata exists
    const meta = await prisma.categoryMetadata.findUnique({
      where: { id: parseInt(id) }
    });

    if (!meta) {
      return res.status(404).json({ error: 'Category metadata not found.' });
    }

    if (role === 'ADMIN') {
      await prisma.categoryMetadata.delete({
        where: { id: parseInt(id) }
      });

      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'CATEGORY_DELETED',
          details: `Category Metadata ${meta.category} - ${meta.subCategory} deleted directly by Admin.`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      res.json({ success: true, message: `Category mapping for ${meta.category} - ${meta.subCategory} deleted.` });
    } else {
      // AGENT: create approval request
      const request = await prisma.approvalRequest.create({
        data: {
          entityType: 'CATEGORY',
          entityId: id,
          entityName: `${meta.category} - ${meta.subCategory}`,
          reason: reason || 'No reason provided',
          requestedById: userId
        }
      });

      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'CATEGORY_DELETE_REQUESTED',
          details: `Delete approval requested for Category Metadata ${meta.category} - ${meta.subCategory}. Reason: ${reason || '-'}`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({ 
        success: true, 
        approvalPending: true, 
        message: 'Permintaan penghapusan sub-kategori telah diajukan ke Admin untuk persetujuan.',
        request 
      });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/tickets/open-count
// Returns count of OPEN status tickets for the authenticated user/agent
router.get('/open-count', verifyToken, async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;
    const where = { status: 'OPEN' };
    
    if (role === 'USER') {
      where.requesterId = userId;
    }
    
    const count = await prisma.ticket.count({ where });
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// POST /api/tickets/bulk-close
// Bulk close tickets that are currently in RESOLVED status
router.post('/bulk-close', verifyToken, async (req, res, next) => {
  try {
    const { role, name: currentUserName } = req.user;
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access forbidden. Only Admins can bulk close tickets.' });
    }

    const { ticketIds } = req.body;
    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({ error: 'Array of ticketIds is required.' });
    }

    // Fetch resolved tickets corresponding to the IDs
    const tickets = await prisma.ticket.findMany({
      where: {
        id: { in: ticketIds },
        status: 'RESOLVED'
      },
      include: {
        company: true,
        requester: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (tickets.length === 0) {
      return res.status(400).json({ error: 'Tidak ada tiket berstatus RESOLVED yang cocok untuk ditutup.' });
    }

    const closedTickets = [];

    // Perform database updates and email sending
    for (const ticket of tickets) {
      const updatedTicket = await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: 'CLOSED',
          auditLogs: {
            create: {
              action: 'STATUS_CHANGED',
              details: `Status tiket diubah dari RESOLVED ke CLOSED secara bulk oleh Admin ${currentUserName}.`,
              performedBy: currentUserName
            }
          }
        },
        include: {
          company: true,
          requester: true,
          assignedTo: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Send email notification to agent (non-blocking)
      sendTicketClosedToAgentEmail(updatedTicket);
      
      closedTickets.push(updatedTicket);
    }

    // Log the bulk close action in system audit logs
    await prisma.systemAuditLog.create({
      data: {
        action: 'TICKETS_BULK_CLOSED',
        details: `Bulk closed ${tickets.length} resolved tickets by Admin ${currentUserName}. Ticket IDs: ${tickets.map(t => t.id).join(', ')}`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log system audit event:", err));

    res.json({
      success: true,
      message: `${closedTickets.length} tiket berhasil dipindahkan ke status CLOSED.`,
      tickets: closedTickets
    });

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
    const { title, description, category, subCategory, priority, companyId, requesterId, createdAt, source } = req.body;
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
    const baseTime = createdAt ? new Date(createdAt) : new Date();
    const limits = SLA_LIMITS[targetPriority];
    const slaResponseLimit = new Date(baseTime.getTime() + limits.response);
    const slaResolutionLimit = new Date(baseTime.getTime() + limits.resolution);

    // Auto-upsert category metadata
    if (subCategory && subCategory.trim() !== '' && subCategory.trim() !== '-') {
      try {
        await prisma.categoryMetadata.upsert({
          where: {
            category_subCategory: {
              category,
              subCategory: subCategory.trim()
            }
          },
          update: {},
          create: {
            category,
            subCategory: subCategory.trim()
          }
        });
      } catch (metaErr) {
        console.error('Failed to auto-upsert category metadata:', metaErr.message);
      }
    }

    const ticketId = await generateNextTicketId();

    const ticket = await prisma.ticket.create({
      data: {
        id: ticketId,
        title,
        description,
        category,
        subCategory: subCategory || '-',
        source: source || 'Walk-in',
        priority: targetPriority,
        companyId: parseInt(companyId),
        requesterId,
        createdAt: baseTime,
        slaResponseLimit,
        slaResolutionLimit,
        auditLogs: {
          create: {
            action: 'TICKET_CREATED',
            details: `Tiket dibuat oleh ${currentUserName} (${role}) dengan prioritas ${targetPriority}${createdAt ? ` secara retroaktif untuk waktu kejadian ${baseTime.toLocaleString('en-US')}` : ''}.`,
            performedBy: currentUserName
          }
        }
      },
      include: {
        company: true,
        requester: true
      }
    });

    // Send email notification to requester (non-blocking)
    sendTicketCreatedEmail(ticket);

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
    const { status, comment } = req.body;
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

    // Append comment if provided
    if (comment && comment.trim()) {
      auditLogData.details += ` Catatan: "${comment.trim()}"`;
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
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Send email notification if status changed (non-blocking)
    if (newStatus !== ticket.status) {
      if (newStatus === 'CLOSED') {
        // Send email to assigned agent, not user
        sendTicketClosedToAgentEmail(updatedTicket);
      } else {
        // Send email to user (requester)
        sendTicketStatusChangedEmail(updatedTicket, ticket.status, newStatus, comment);
      }
    }

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

    // Retrieve current ticket to check existing assignment (takeover history)
    const currentTicket = await prisma.ticket.findUnique({
      where: { id },
      include: { assignedTo: true }
    });

    if (!currentTicket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Build history log details dynamically
    let logDetails = `Tiket ditugaskan kepada ${agent.name} oleh ${currentUserName}.`;
    let actionType = 'TICKET_ASSIGNED';

    if (currentTicket.assignedTo) {
      if (currentTicket.assignedTo.id === agent.id) {
        logDetails = `Penugasan tiket dikonfirmasi ulang kepada ${agent.name} oleh ${currentUserName}.`;
      } else {
        logDetails = `Tiket dialihkan (take over) dari ${currentTicket.assignedTo.name} ke ${agent.name} oleh ${currentUserName}.`;
        actionType = 'TICKET_TAKEOVER';
      }
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        assignedToId,
        auditLogs: {
          create: {
            action: actionType,
            details: logDetails,
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

    // Send email notification to IT Agent (non-blocking)
    sendTicketAssignedEmail(ticket, agent);

    res.json(ticket);
  } catch (err) {
    next(err);
  }
});

// POST /api/tickets/public
// Create a ticket from public sources (e.g. Google Form)
router.post('/public', async (req, res, next) => {
  try {
    const { email, name, company: companyName, title, description, category, subCategory, priority, source } = req.body;

    if (!email || !title || !description || !category) {
      return res.status(400).json({ error: 'Email, title, description, and category are required.' });
    }

    // Find employee by email
    let requester = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Fallback 1: If email has a typo but Name matches an existing user in the database
    if (!requester && name && name.trim() !== '') {
      requester = await prisma.user.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' } }
      });
    }

    // Fallback 2: If still not found, create a new user dynamically
    if (!requester) {
      try {
        // Resolve company branch ID from the companyName sent by Google Form
        let targetCompanyId = null;
        if (companyName && companyName.trim() !== '') {
          const matchedCompany = await prisma.company.findFirst({
            where: { name: { equals: companyName.trim(), mode: 'insensitive' } }
          });
          if (matchedCompany) {
            targetCompanyId = matchedCompany.id;
          }
        }

        // If no matching company, fallback to the default company
        if (!targetCompanyId) {
          const defaultCompany = await prisma.company.findFirst({
            where: { name: { contains: 'Mugi Rekso Abadi', mode: 'insensitive' } }
          }) || await prisma.company.findFirst();
          targetCompanyId = defaultCompany ? defaultCompany.id : 1;
        }

        // Hash default password for new users
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const defaultPasswordHash = await bcrypt.hash('Password123!', salt);

        // Generate a unique ID (e.g. PUB-12345678)
        const randomId = 'PUB-' + Math.floor(10000000 + Math.random() * 90000000);

        // Auto-create user record
        requester = await prisma.user.create({
          data: {
            id: randomId,
            email: email.toLowerCase(),
            password: defaultPasswordHash,
            name: name || email.split('@')[0],
            department: 'Public / Guest',
            jobPosition: 'External Requester',
            role: 'USER',
            companyId: targetCompanyId
          }
        });
      } catch (err) {
        console.error('Failed to auto-create user in public ticket creation:', err.message);
        return res.status(500).json({ error: 'Internal Server Error during user registration', message: err.message });
      }
    }

    const targetPriority = (priority || 'LOW').toUpperCase();
    if (!SLA_LIMITS[targetPriority]) {
      return res.status(400).json({ error: 'Invalid priority level.' });
    }

    // Calculate SLA Targets
    const now = new Date();
    const limits = SLA_LIMITS[targetPriority];
    const slaResponseLimit = new Date(now.getTime() + limits.response);
    const slaResolutionLimit = new Date(now.getTime() + limits.resolution);

    // Auto-upsert category metadata
    if (subCategory && subCategory.trim() !== '' && subCategory.trim() !== '-') {
      try {
        await prisma.categoryMetadata.upsert({
          where: {
            category_subCategory: {
              category,
              subCategory: subCategory.trim()
            }
          },
          update: {},
          create: {
            category,
            subCategory: subCategory.trim()
          }
        });
      } catch (metaErr) {
        console.error('Failed to auto-upsert category metadata in public route:', metaErr.message);
      }
    }

    const ticketId = await generateNextTicketId();

    const ticket = await prisma.ticket.create({
      data: {
        id: ticketId,
        title,
        description,
        category,
        subCategory: subCategory || '-',
        source: source || 'System Alert',
        priority: targetPriority,
        companyId: requester.companyId,
        requesterId: requester.id,
        slaResponseLimit,
        slaResolutionLimit,
        auditLogs: {
          create: {
            action: 'TICKET_CREATED_PUBLIC',
            details: `Tiket dibuat secara otomatis melalui integrasi (Google Form) dengan prioritas ${targetPriority}.`,
            performedBy: 'Google Form System'
          }
        }
      },
      include: {
        company: true,
        requester: {
          select: { name: true, email: true, department: true }
        }
      }
    });

    // Send email notification to requester (non-blocking)
    sendTicketCreatedEmail(ticket);

    res.status(201).json({
      message: 'Tiket berhasil dibuat melalui Google Form.',
      ticketId: ticket.id,
      ticket
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tickets/:id
// Delete a ticket and its associated audit logs (ADMIN only)
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { role } = req.user;
    const { id } = req.params;

    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Only administrators can delete tickets.' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    await prisma.$transaction([
      prisma.auditLog.deleteMany({ where: { ticketId: id } }),
      prisma.ticket.delete({ where: { id } })
    ]);

    res.json({ message: `Ticket ${id} has been deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/:id/sla-override
// Manually override SLA breach status (ADMIN only)
router.patch('/:id/sla-override', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { name: currentUserName } = req.user;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason for SLA override is required.' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Perform database updates
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        isSlaBreached: false,
        auditLogs: {
          create: {
            action: 'SLA_OVERRIDDEN',
            details: `SLA status manual di-override menjadi MET (Terpenuhi) oleh Admin ${currentUserName}. Alasan: "${reason.trim()}"`,
            performedBy: currentUserName
          }
        }
      },
      include: {
        company: true,
        requester: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tickets/:id/responded-at
// Manually update the first response timestamp (ADMIN only)
router.patch('/:id/responded-at', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { respondedAt, reason } = req.body;
    const { name: currentUserName } = req.user;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason for changing response time is required.' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    let parsedRespondedAt = null;
    if (respondedAt !== undefined && respondedAt !== null && respondedAt !== '') {
      parsedRespondedAt = new Date(respondedAt);
      if (isNaN(parsedRespondedAt.getTime())) {
        return res.status(400).json({ error: 'Invalid respondedAt date value.' });
      }

      // Ensure it is not before ticket creation date
      if (parsedRespondedAt < new Date(ticket.createdAt)) {
        return res.status(400).json({ error: 'First Responded At cannot be before ticket creation date.' });
      }
    }

    const formatTimestamp = (d) => {
      if (!d) return 'Not Set';
      // Format as DD/MM/YYYY, HH:MM
      const dateObj = new Date(d);
      return `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
    };

    const oldValStr = formatTimestamp(ticket.respondedAt);
    const newValStr = formatTimestamp(parsedRespondedAt);

    // Update ticket and create audit log
    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        respondedAt: parsedRespondedAt,
        auditLogs: {
          create: {
            action: 'FIRST_RESPONSE_TIME_UPDATED',
            details: `Waktu respon pertama (First Responded At) diubah secara manual dari ${oldValStr} ke ${newValStr} oleh Admin ${currentUserName}. Alasan: "${reason.trim()}"`,
            performedBy: currentUserName
          }
        }
      },
      include: {
        company: true,
        requester: true,
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json(updatedTicket);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
