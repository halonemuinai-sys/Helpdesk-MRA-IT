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

    res.json(approvals);
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
      } else {
        return res.status(400).json({ error: `Unknown entity type: ${entityType}` });
      }
    } catch (dbErr) {
      console.error(`DB error executing approval delete:`, dbErr);
      return res.status(500).json({ error: `Database failed to delete the target item: ${dbErr.message}` });
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
    const logDetails = `${deleteMessage} (Requested by: ${request.requestedBy.name}, Approved by: ${adminUser.name}). Notes: ${adminNotes || '-'}`;
    await prisma.systemAuditLog.create({
      data: {
        action: `${entityType}_DELETED`,
        details: logDetails,
        performedBy: `${adminUser.name} (${adminUser.email})`
      }
    });

    res.json({
      message: 'Deletion approved and item successfully deleted.',
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
    const logDetails = `Deletion request for ${request.entityType} "${request.entityName}" rejected by ${adminUser.name}. Reason: ${adminNotes}`;
    await prisma.systemAuditLog.create({
      data: {
        action: `${request.entityType}_DELETE_REJECTED`,
        details: logDetails,
        performedBy: `${adminUser.name} (${adminUser.email})`
      }
    });

    res.json({
      message: 'Deletion request rejected.',
      request: updatedRequest
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
