const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/assets
// Lists all assets with search query and filters
router.get('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { category, status, search, companyMasterId, limit, skip } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (companyMasterId) {
      where.companyMasterId = parseInt(companyMasterId);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
        { deviceRef: { contains: search, mode: 'insensitive' } },
        { vendorRef: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const takeValue = limit ? parseInt(limit) : 50;
    const skipValue = skip ? parseInt(skip) : 0;

    const assets = await prisma.asset.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, department: true }
        },
        company: {
          select: { id: true, name: true, location: true }
        },
        companyMaster: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: takeValue,
      skip: skipValue
    });

    res.json(assets);
  } catch (err) {
    next(err);
  }
});

// POST /api/assets
// Creates a new asset record
router.post('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { 
      assetTag, 
      deviceRef, 
      vendorRef, 
      brand, 
      model, 
      processor, 
      ram, 
      storage, 
      os, 
      office, 
      ownershipType,
      status, 
      rentalCost, 
      rentalStart, 
      rentalEnd, 
      notes, 
      userId, 
      companyId, 
      companyMasterId 
    } = req.body;

    if (!assetTag || !brand || !model || rentalCost === undefined || !rentalStart || !rentalEnd) {
      return res.status(400).json({ error: 'Missing mandatory fields.' });
    }

    // Check if assetTag or deviceRef already exists
    const duplicateTag = await prisma.asset.findUnique({
      where: { assetTag }
    });
    if (duplicateTag) {
      return res.status(400).json({ error: `Asset Tag '${assetTag}' sudah digunakan.` });
    }

    if (deviceRef) {
      const duplicateRef = await prisma.asset.findUnique({
        where: { deviceRef }
      });
      if (duplicateRef) {
        return res.status(400).json({ error: `Device Ref '${deviceRef}' sudah digunakan.` });
      }
    }

    // Default status & ownershipType
    const finalStatus = status || 'AVAILABLE';
    const finalOwnershipType = ownershipType || 'RENTAL';

    // Initial journey entry
    const todayStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const agentName = req.user ? req.user.name : 'IT Support';
    const displayOwnership = finalOwnershipType === 'RENTAL' ? 'sewa' : 'milik sendiri';
    let journeyLog = `[${todayStr}]: Aset ${displayOwnership} didaftarkan di sistem oleh IT Agent: ${agentName} (Status: ${finalStatus})`;
    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      if (u) {
        journeyLog += ` dan diserahkan kepada ${u.name}`;
      }
    }

    const asset = await prisma.asset.create({
      data: {
        assetTag,
        deviceRef: deviceRef || null,
        vendorRef: vendorRef || null,
        brand,
        model,
        processor: processor || null,
        ram: ram || null,
        storage: storage || null,
        os: os || null,
        office: office || null,
        ownershipType: finalOwnershipType,
        status: finalStatus,
        rentalCost: parseFloat(rentalCost),
        rentalStart: new Date(rentalStart),
        rentalEnd: new Date(rentalEnd),
        notes: notes || null,
        journey: journeyLog,
        userId: userId || null,
        companyId: companyId ? parseInt(companyId) : null,
        companyMasterId: companyMasterId ? parseInt(companyMasterId) : null
      }
    });

    res.json(asset);
  } catch (err) {
    next(err);
  }
});

// PUT /api/assets/:id
// Updates an asset or logs handovers/status changes
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const {
      assetTag,
      deviceRef,
      vendorRef,
      brand,
      model,
      processor,
      ram,
      storage,
      os,
      office,
      ownershipType,
      status,
      rentalCost,
      rentalStart,
      rentalEnd,
      notes,
      userId,
      companyId,
      companyMasterId,
      updateJourney
    } = req.body;

    const current = await prisma.asset.findUnique({
      where: { id }
    });

    if (!current) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    // Check unique constraints for tag and ref if changed
    if (assetTag && assetTag !== current.assetTag) {
      const duplicateTag = await prisma.asset.findUnique({ where: { assetTag } });
      if (duplicateTag) {
        return res.status(400).json({ error: `Asset Tag '${assetTag}' sudah digunakan.` });
      }
    }

    if (deviceRef && deviceRef !== current.deviceRef) {
      const duplicateRef = await prisma.asset.findUnique({ where: { deviceRef } });
      if (duplicateRef) {
        return res.status(400).json({ error: `Device Ref '${deviceRef}' sudah digunakan.` });
      }
    }

    const updateData = {};
    if (assetTag !== undefined) updateData.assetTag = assetTag;
    if (deviceRef !== undefined) updateData.deviceRef = deviceRef || null;
    if (vendorRef !== undefined) updateData.vendorRef = vendorRef || null;
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model;
    if (processor !== undefined) updateData.processor = processor || null;
    if (ram !== undefined) updateData.ram = ram || null;
    if (storage !== undefined) updateData.storage = storage || null;
    if (os !== undefined) updateData.os = os || null;
    if (office !== undefined) updateData.office = office || null;
    if (ownershipType !== undefined) updateData.ownershipType = ownershipType;
    if (status !== undefined) updateData.status = status;
    if (rentalCost !== undefined) updateData.rentalCost = parseFloat(rentalCost);
    if (rentalStart !== undefined) updateData.rentalStart = new Date(rentalStart);
    if (rentalEnd !== undefined) updateData.rentalEnd = new Date(rentalEnd);
    if (notes !== undefined) updateData.notes = notes || null;
    
    // Assignee and location mapping
    if (userId !== undefined) updateData.userId = userId || null;
    if (companyId !== undefined) updateData.companyId = companyId ? parseInt(companyId) : null;
    if (companyMasterId !== undefined) updateData.companyMasterId = companyMasterId ? parseInt(companyMasterId) : null;

    // Automatic journey logger for assignments & status changes
    const todayStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
    let autoJourneyLines = [];

    // 1. Status change
    if (status && status !== current.status) {
      autoJourneyLines.push(`Status berubah dari ${current.status} menjadi ${status}`);
    }

    // 2. User assignment change
    if (userId !== undefined && userId !== current.userId) {
      const agentName = req.user ? req.user.name : 'IT Support';
      if (userId) {
        const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        if (u) {
          autoJourneyLines.push(`Diserahkan/dipakai oleh Karyawan: ${u.name} (Diserahkan oleh IT Agent: ${agentName})`);
        }
      } else {
        autoJourneyLines.push(`Dilepas dari Karyawan (dikembalikan ke IT Inventory) oleh IT Agent: ${agentName}`);
      }
    }

    // Combine automatic journey lines with any manual input
    let finalJourney = current.journey || '';
    
    autoJourneyLines.forEach(line => {
      finalJourney += finalJourney ? `\n[${todayStr}]: ${line}` : `[${todayStr}]: ${line}`;
    });

    if (updateJourney && updateJourney.trim()) {
      const cleanManual = updateJourney.trim();
      finalJourney += finalJourney ? `\n[${todayStr}]: ${cleanManual}` : `[${todayStr}]: ${cleanManual}`;
    }

    updateData.journey = finalJourney;

    const updatedAsset = await prisma.asset.update({
      where: { id },
      data: updateData
    });

    res.json(updatedAsset);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/assets/:id
// Deletes an asset record
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    await prisma.asset.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
