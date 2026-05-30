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
    const { category, status, search, limit, skip } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { vendor: { contains: search, mode: 'insensitive' } }
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

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subscriptions/:id
// Deletes a subscription record
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    await prisma.iTSubscription.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
