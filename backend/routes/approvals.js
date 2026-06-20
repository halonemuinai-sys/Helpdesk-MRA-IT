const express = require('express');
const prisma = require('../api/db');
const { verifyToken, checkRole } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/approvals
// Get all approvals (ADMIN and AUDITOR only)
router.get('/', verifyToken, checkRole(['ADMIN', 'AUDITOR']), async (req, res, next) => {
  try {
    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    const approvals = await prisma.approvalRequest.findMany({
      where,
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        handledBy: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedApprovals = [];
    for (const req of approvals) {
      const plainReq = { ...req };
      if (req.entityType === 'ASSET_ALLOCATION' && req.reason && req.reason.startsWith('ALLOCATE_TO:')) {
        const employeeId = req.reason.replace('ALLOCATE_TO:', '').trim();
        const targetUser = await prisma.user.findUnique({
          where: { id: employeeId },
          select: { 
            id: true, 
            name: true, 
            email: true, 
            department: true, 
            jobPosition: true, 
            company: { select: { name: true, location: true } } 
          }
        });
        plainReq.targetUser = targetUser || { id: employeeId, name: 'Unknown User', error: true };
      }
      enrichedApprovals.push(plainReq);
    }

    res.json(enrichedApprovals);
  } catch (err) {
    next(err);
  }
});

// POST /api/approvals/:id/approve
// Approve a delete request (ADMIN and AUDITOR only)
router.post('/:id/approve', verifyToken, checkRole(['ADMIN', 'AUDITOR']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminUser = req.user;

    const request = await prisma.approvalRequest.findUnique({
      where: { id },
      include: { requestedBy: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Approval request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot approve request with status: ${request.status}` });
    }

    // Execute actual deletion based on entityType
    let deleteMessage = '';
    const { entityType, entityId, entityName } = request;

    try {
      if (entityType === 'ASSET') {
        const asset = await prisma.asset.findUnique({ where: { id: entityId } });
        if (asset) {
          await prisma.asset.delete({ where: { id: entityId } });
          deleteMessage = `Asset Tag ${asset.assetTag} (${asset.brand} ${asset.model}) deleted.`;
        } else {
          deleteMessage = `Asset with ID ${entityId} was already deleted or not found.`;
        }
      } else if (entityType === 'SUBSCRIPTION') {
        const sub = await prisma.iTSubscription.findUnique({ where: { id: entityId } });
        if (sub) {
          await prisma.iTSubscription.delete({ where: { id: entityId } });
          deleteMessage = `IT Subscription ${sub.vendor} - ${sub.name} deleted.`;
        } else {
          deleteMessage = `Subscription with ID ${entityId} was already deleted or not found.`;
        }
      } else if (entityType === 'WIFI_AP') {
        const ap = await prisma.wifiAccessPoint.findUnique({ where: { id: entityId } });
        if (ap) {
          await prisma.wifiAccessPoint.delete({ where: { id: entityId } });
          deleteMessage = `Wifi Access Point SSID ${ap.ssid} (${ap.location}) deleted.`;
        } else {
          deleteMessage = `Wifi AP with ID ${entityId} was already deleted or not found.`;
        }
      } else if (entityType === 'CATEGORY') {
        const catId = parseInt(entityId);
        const cat = await prisma.categoryMetadata.findUnique({ where: { id: catId } });
        if (cat) {
          await prisma.categoryMetadata.delete({ where: { id: catId } });
          deleteMessage = `Category Metadata ${cat.category} - ${cat.subCategory} deleted.`;
        } else {
          deleteMessage = `Category Metadata with ID ${entityId} was already deleted or not found.`;
        }
      } else if (entityType === 'PERIPHERAL') {
        const peri = await prisma.peripheralAsset.findUnique({ where: { id: entityId } });
        if (peri) {
          await prisma.peripheralAsset.delete({ where: { id: entityId } });
          deleteMessage = `IT Peripheral ${peri.brand} ${peri.model || ''} (${peri.name}) deleted.`;
        } else {
          deleteMessage = `Peripheral with ID ${entityId} was already deleted or not found.`;
        }
      } else if (entityType === 'PERIPHERAL_CATEGORY') {
        const catId = parseInt(entityId);
        const cat = await prisma.peripheralCategory.findUnique({ where: { id: catId } });
        if (cat) {
          await prisma.peripheralCategory.delete({ where: { id: catId } });
          deleteMessage = `Peripheral Category ${cat.name} deleted.`;
        } else {
          deleteMessage = `Peripheral Category with ID ${entityId} was already deleted or not found.`;
        }
      } else if (entityType === 'ASSET_ALLOCATION') {
        const { reason } = request;
        if (!reason || !reason.startsWith('ALLOCATE_TO:')) {
          return res.status(400).json({ error: 'Invalid reason format for ASSET_ALLOCATION. Expected "ALLOCATE_TO:<employee_id>"' });
        }
        const employeeId = reason.replace('ALLOCATE_TO:', '').trim();

        // Query data User target
        const userTarget = await prisma.user.findUnique({
          where: { id: employeeId },
          include: { company: true }
        });

        if (!userTarget) {
          return res.status(404).json({ error: `Karyawan dengan ID ${employeeId} tidak ditemukan di database IT Helpdesk.` });
        }

        // Query data Asset target
        const asset = await prisma.asset.findUnique({ where: { id: entityId } });
        if (!asset) {
          return res.status(404).json({ error: `Asset/Perangkat dengan ID ${entityId} tidak ditemukan.` });
        }

        // Update Asset
        await prisma.asset.update({
          where: { id: entityId },
          data: {
            userId: employeeId,
            companyId: userTarget.companyId,
            companyMasterId: userTarget.company?.companyMasterId || null,
            status: 'ASSIGNED',
            updatedAt: new Date()
          }
        });

        deleteMessage = `Alokasi perangkat ${asset.brand} ${asset.model} (Tag: ${asset.assetTag}) disetujui untuk ${userTarget.name} (${employeeId}).`;
      } else {
        return res.status(400).json({ error: `Unknown entity type: ${entityType}` });
      }
    } catch (dbErr) {
      console.error(`DB error executing approval delete:`, dbErr);
      return res.status(500).json({ error: `Database failed to process target item: ${dbErr.message}` });
    }

    // Update approval request status
    const updatedRequest = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        adminNotes: adminNotes || 'Approved by admin.',
        handledById: adminUser.id
      }
    });

    // Write to system audit logs
    const logDetails = `${deleteMessage} (Requested by: ${request.requestedBy ? request.requestedBy.name : 'GA System'}, Approved by: ${adminUser.name}). Notes: ${adminNotes || '-'}`;
    
    let logAction = `${entityType}_DELETED`;
    if (entityType === 'ASSET_ALLOCATION') {
      logAction = 'ASSET_ALLOCATED';
    }

    await prisma.systemAuditLog.create({
      data: {
        action: logAction,
        details: logDetails,
        performedBy: `${adminUser.name} (${adminUser.email})`
      }
    });

    res.json({
      message: entityType === 'ASSET_ALLOCATION' ? 'Alokasi perangkat berhasil disetujui.' : 'Deletion approved and item successfully deleted.',
      request: updatedRequest
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/approvals/:id/reject
// Reject a delete request (ADMIN and AUDITOR only)
router.post('/:id/reject', verifyToken, checkRole(['ADMIN', 'AUDITOR']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminUser = req.user;

    if (!adminNotes || adminNotes.trim().length === 0) {
      return res.status(400).json({ error: 'Notes / reason for rejection is required.' });
    }

    const request = await prisma.approvalRequest.findUnique({
      where: { id },
      include: { requestedBy: true }
    });

    if (!request) {
      return res.status(404).json({ error: 'Approval request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ error: `Cannot reject request with status: ${request.status}` });
    }

    // Update status
    const updatedRequest = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        adminNotes,
        handledById: adminUser.id
      }
    });

    // Write to system audit logs
    let logDetails = `Deletion request for ${request.entityType} "${request.entityName}" rejected by ${adminUser.name}. Reason: ${adminNotes}`;
    let logAction = `${request.entityType}_DELETE_REJECTED`;
    
    if (request.entityType === 'ASSET_ALLOCATION') {
      logAction = 'ASSET_ALLOCATION_REJECTED';
      logDetails = `Asset allocation request for "${request.entityName}" (Asset ID: ${request.entityId}) rejected by ${adminUser.name}. Reason: ${adminNotes}`;
    }

    await prisma.systemAuditLog.create({
      data: {
        action: logAction,
        details: logDetails,
        performedBy: `${adminUser.name} (${adminUser.email})`
      }
    });

    res.json({
      message: request.entityType === 'ASSET_ALLOCATION' ? 'Permintaan alokasi perangkat ditolak.' : 'Deletion request rejected.',
      request: updatedRequest
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
