const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/assets/stats
// Returns global statistics for KPI cards
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Run parallel counts and aggregations using prisma
    const [
      totalCount,
      assignedCount,
      availableCount,
      maintenanceCount,
      rentalAgg,
      expiredCount,
      nearExpiryCount,
      rentalCount,
      ownedCount
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: 'ASSIGNED' } }),
      prisma.asset.count({ where: { status: 'AVAILABLE' } }),
      prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
      prisma.asset.aggregate({
        where: { ownershipType: 'RENTAL' },
        _sum: { rentalCost: true }
      }),
      prisma.asset.count({
        where: {
          ownershipType: 'RENTAL',
          rentalEnd: { lt: now }
        }
      }),
      prisma.asset.count({
        where: {
          ownershipType: 'RENTAL',
          rentalEnd: {
            gte: now,
            lte: thirtyDaysLater
          }
        }
      }),
      prisma.asset.count({ where: { ownershipType: 'RENTAL' } }),
      prisma.asset.count({ where: { ownershipType: 'OWNED' } })
    ]);

    res.json({
      totalAssets: totalCount,
      assignedCount,
      availableCount,
      maintenanceCount,
      totalMonthlyRental: rentalAgg._sum.rentalCost || 0,
      expiredLeasesCount: expiredCount,
      nearExpiryLeasesCount: nearExpiryCount,
      rentalCount,
      ownedCount
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/assets
// Lists all assets with search query and filters
router.get('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { category, status, search, companyMasterId, limit, skip } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (companyMasterId) {
      where.companyMasterId = parseInt(companyMasterId);
    }
    if (search) {
      where.OR = [
        { assetTag: { contains: search, mode: 'insensitive' } },
        { deviceRef: { contains: search, mode: 'insensitive' } },
        { vendorRef: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Since category is not a direct column, we fetch first, filter in memory, then paginate
    const allMatchingAssets = await prisma.asset.findMany({
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
      orderBy: { createdAt: 'desc' }
    });

    const isSmartphone = (asset) => {
      const brand = (asset.brand || '').toLowerCase();
      const model = (asset.model || '').toLowerCase();
      const os = (asset.os || '').toLowerCase();
      const ram = (asset.ram || '').toLowerCase();

      return (brand === 'apple' && model.includes('iphone')) ||
             os.includes('ios') ||
             os.includes('android') ||
             brand === 'samsung' ||
             brand === 'oppo' ||
             brand === 'vivo' ||
             brand === 'xiaomi' ||
             brand === 'realme' ||
             brand === 'infinix' ||
             brand === 'iqoo' ||
             ram.includes('4 gb') ||
             ram.includes('4gb');
    };

    let filteredAssets = allMatchingAssets;
    if (category) {
      const upperCategory = category.toUpperCase();
      if (upperCategory === 'LAPTOP') {
        filteredAssets = allMatchingAssets.filter(a => !isSmartphone(a));
      } else if (upperCategory === 'SMARTPHONE') {
        filteredAssets = allMatchingAssets.filter(a => isSmartphone(a));
      }
    }

    const takeValue = limit ? parseInt(limit) : 200; // default to a larger value like 200
    const skipValue = skip ? parseInt(skip) : 0;

    const paginatedAssets = filteredAssets.slice(skipValue, skipValue + takeValue);

    res.json(paginatedAssets);
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
        companyId: companyId && !isNaN(parseInt(companyId)) ? parseInt(companyId) : null,
        companyMasterId: companyMasterId && !isNaN(parseInt(companyMasterId)) ? parseInt(companyMasterId) : null
      }
    });

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'ASSET_CREATED',
        details: `Asset Tag ${asset.assetTag} (${asset.brand} ${asset.model}) created by IT Agent. Status: ${asset.status}`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

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
    if (companyId !== undefined) updateData.companyId = companyId && !isNaN(parseInt(companyId)) ? parseInt(companyId) : null;
    if (companyMasterId !== undefined) updateData.companyMasterId = companyMasterId && !isNaN(parseInt(companyMasterId)) ? parseInt(companyMasterId) : null;

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

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'ASSET_UPDATED',
        details: `Asset Tag ${updatedAsset.assetTag} (${updatedAsset.brand} ${updatedAsset.model}) updated. Status: ${updatedAsset.status}`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(updatedAsset);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/assets/:id
// Deletes an asset record (ADMIN deletes immediately, AGENT creates an ApprovalRequest)
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { role, id: userId, name: userName, email: userEmail } = req.user;
    if (role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const { reason } = req.body;

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    if (role === 'ADMIN') {
      await prisma.asset.delete({
        where: { id }
      });
      
      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'ASSET_DELETED',
          details: `Asset Tag ${asset.assetTag} (${asset.brand} ${asset.model}) deleted directly by Admin.`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({ success: true, message: 'Asset deleted successfully.' });
    } else {
      // AGENT: create approval request
      const request = await prisma.approvalRequest.create({
        data: {
          entityType: 'ASSET',
          entityId: id,
          entityName: `${asset.assetTag} (${asset.brand} ${asset.model})`,
          reason: reason || 'No reason provided',
          requestedById: userId
        }
      });

      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'ASSET_DELETE_REQUESTED',
          details: `Delete approval requested for Asset Tag ${asset.assetTag} (${asset.brand} ${asset.model}). Reason: ${reason || '-'}`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({ 
        success: true, 
        approvalPending: true, 
        message: 'Permintaan penghapusan aset telah diajukan ke Admin untuk persetujuan.',
        request 
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
