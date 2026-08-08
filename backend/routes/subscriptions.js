const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/subscriptions
// Lists all subscriptions, with filters and search query
router.get('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { category, status, companyMasterId, search, limit, skip } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (companyMasterId) {
      where.companyMasterId = parseInt(companyMasterId, 10);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { contractNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    const takeValue = limit ? parseInt(limit) : 50;
    const skipValue = skip ? parseInt(skip) : 0;

    const subscriptions = await prisma.iTSubscription.findMany({
      where,
      include: {
        companyMaster: {
          select: { name: true }
        },
        renewals: {
          orderBy: { renewedAt: 'desc' }
        },
        replacedSubscription: {
          select: { id: true, name: true, vendor: true }
        },
        replacedBySubscription: {
          select: { id: true, name: true, vendor: true }
        }
      },
      orderBy: { expiryDate: 'asc' },
      take: takeValue,
      skip: skipValue
    });

    res.json(subscriptions);
  } catch (err) {
    next(err);
  }
});

// POST /api/subscriptions
// Creates a new IT subscription record
router.post('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { 
      category, 
      vendor, 
      name,
      brand, 
      location,
      contractNumber,
      billingCycle, 
      cost, 
      startDate, 
      expiryDate, 
      status, 
      evidenceLink, 
      notes,
      companyMasterId,
      companyId,
      replacedSubscriptionId
    } = req.body;

    const targetCompanyMasterId = companyMasterId || companyId;

    if (!category || !vendor || !name || !billingCycle || cost === undefined || !startDate || !expiryDate || !targetCompanyMasterId) {
      return res.status(400).json({ error: 'Missing mandatory fields.' });
    }

    // If replacing an old contract, mark the old one as INACTIVE/ARCHIVED
    if (replacedSubscriptionId) {
      await prisma.iTSubscription.update({
        where: { id: replacedSubscriptionId },
        data: { status: 'INACTIVE' }
      });
    }

    const subscription = await prisma.iTSubscription.create({
      data: {
        category,
        vendor,
        name,
        brand: brand || null,
        location: location || null,
        contractNumber: contractNumber || null,
        billingCycle,
        cost: parseFloat(cost),
        startDate: new Date(startDate),
        expiryDate: new Date(expiryDate),
        status: status || 'ACTIVE',
        evidenceLink: evidenceLink || null,
        notes: notes || null,
        companyMasterId: parseInt(targetCompanyMasterId),
        replacedSubscriptionId: replacedSubscriptionId || null
      }
    });

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'SUBSCRIPTION_CREATED',
        details: `Subscription ${subscription.vendor} - ${subscription.name} created. Cost: Rp ${subscription.cost.toLocaleString('id-ID')}/${subscription.billingCycle}`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(subscription);
  } catch (err) {
    next(err);
  }
});

// PUT /api/subscriptions/:id
// Updates a subscription or logs a new renewal action
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const {
      category,
      vendor,
      name,
      brand,
      location,
      contractNumber,
      billingCycle,
      cost,
      startDate,
      expiryDate,
      status,
      evidenceLink,
      notes,
      companyMasterId,
      companyId,
      updateJourney
    } = req.body;

    // Find current state
    const current = await prisma.iTSubscription.findUnique({
      where: { id }
    });

    if (!current) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    const updateData = {};
    if (category !== undefined) updateData.category = category;
    if (vendor !== undefined) updateData.vendor = vendor;
    if (name !== undefined) updateData.name = name;
    if (brand !== undefined) updateData.brand = brand || null;
    if (location !== undefined) updateData.location = location || null;
    if (contractNumber !== undefined) updateData.contractNumber = contractNumber || null;
    if (billingCycle !== undefined) updateData.billingCycle = billingCycle;
    if (cost !== undefined) updateData.cost = parseFloat(cost);
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate);
    if (status !== undefined) updateData.status = status;
    if (evidenceLink !== undefined) updateData.evidenceLink = evidenceLink || null;
    if (notes !== undefined) updateData.notes = notes || null;
    
    const targetCompanyMasterId = companyMasterId !== undefined ? companyMasterId : companyId;
    if (targetCompanyMasterId !== undefined && targetCompanyMasterId !== null) {
      updateData.companyMasterId = parseInt(targetCompanyMasterId);
    }

    // If updateJourney text is provided, add it to journey log and insert RenewalHistory
    if (updateJourney && updateJourney.trim()) {
      const todayStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
      const cleanJourney = updateJourney.trim();
      const newJourneyLine = `[${todayStr}]: ${cleanJourney}`;
      updateData.journey = current.journey 
        ? `${current.journey}\n${newJourneyLine}`
        : newJourneyLine;

      // Add a history item
      await prisma.renewalHistory.create({
        data: {
          subscriptionId: id,
          cost: parseFloat(cost !== undefined ? cost : current.cost),
          period: billingCycle || current.billingCycle,
          notes: cleanJourney
        }
      });
    }

    const updated = await prisma.iTSubscription.update({
      where: { id },
      data: updateData
    });

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'SUBSCRIPTION_UPDATED',
        details: `Subscription ${updated.vendor} - ${updated.name} updated. Status: ${updated.status}`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subscriptions/:id
// Deletes a subscription record (ADMIN deletes immediately, AGENT creates an ApprovalRequest)
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { role, id: userId, name: userName, email: userEmail } = req.user;
    if (role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const { reason } = req.body;

    const sub = await prisma.iTSubscription.findUnique({ where: { id } });
    if (!sub) {
      return res.status(404).json({ error: 'Subscription not found.' });
    }

    if (role === 'ADMIN') {
      await prisma.iTSubscription.delete({
        where: { id }
      });
      
      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'SUBSCRIPTION_DELETED',
          details: `Subscription ${sub.vendor} - ${sub.name} deleted directly by Admin.`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({ success: true, message: 'Subscription deleted successfully.' });
    } else {
      // AGENT: create approval request
      const request = await prisma.approvalRequest.create({
        data: {
          entityType: 'SUBSCRIPTION',
          entityId: id,
          entityName: `${sub.vendor} - ${sub.name}`,
          reason: reason || 'No reason provided',
          requestedById: userId
        }
      });

      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'SUBSCRIPTION_DELETE_REQUESTED',
          details: `Delete approval requested for Subscription ${sub.vendor} - ${sub.name}. Reason: ${reason || '-'}`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({ 
        success: true, 
        approvalPending: true, 
        message: 'Permintaan penghapusan subskripsi telah diajukan ke Admin untuk persetujuan.',
        request 
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
