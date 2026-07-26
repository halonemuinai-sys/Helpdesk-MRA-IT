const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');
const { syncAssetToGA, deleteAssetFromGA } = require('../api/gaSync');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

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
        { vendor: { contains: search, mode: 'insensitive' } },
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
             parseInt(ram, 10) === 4;
    };

    const isPrinter = (asset) => {
      const brand = (asset.brand || '').toLowerCase();
      const model = (asset.model || '').toLowerCase();
      const os = (asset.os || '').toLowerCase();
      const deviceRef = (asset.deviceRef || '').toLowerCase();
      return os === 'printer os' || deviceRef.startsWith('prn') || model.includes('printer') || brand.includes('epson') || brand.includes('canon') || brand.includes('fuji') || brand.includes('brother') || brand.includes('hp laserjet') || brand.includes('smart tank');
    };

    let filteredAssets = allMatchingAssets;
    if (category) {
      const upperCategory = category.toUpperCase();
      if (upperCategory === 'LAPTOP') {
        filteredAssets = allMatchingAssets.filter(a => !isSmartphone(a) && !isPrinter(a));
      } else if (upperCategory === 'SMARTPHONE') {
        filteredAssets = allMatchingAssets.filter(a => isSmartphone(a));
      } else if (upperCategory === 'PRINTER') {
        filteredAssets = allMatchingAssets.filter(a => isPrinter(a));
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

// GET /api/assets/:id
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') return res.status(403).json({ error: 'Access denied.' });
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, department: true } },
        company: { select: { id: true, name: true, location: true } },
        companyMaster: { select: { id: true, name: true } }
      }
    });
    if (!asset) return res.status(404).json({ error: 'Asset not found.' });
    res.json(asset);
  } catch (err) {
    next(err);
  }
});

// POST /api/assets/bulk-import
// Accepts multipart Excel file, parses rows, detects duplicates.
// ?dryRun=true → preview only (no DB write)
// ?mode=skip|overwrite → how to handle duplicates (default: skip)
router.post('/bulk-import', verifyToken, upload.single('file'), async (req, res, next) => {
  try {
    if (req.user.role === 'USER') return res.status(403).json({ error: 'Access denied.' });
    if (!req.file) return res.status(400).json({ error: 'File tidak ditemukan.' });

    const dryRun = req.query.dryRun === 'true';
    const mode = req.query.mode === 'overwrite' ? 'overwrite' : 'skip';
    const { name: performedBy } = req.user;

    // Parse Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rows.length) return res.status(400).json({ error: 'File kosong atau format tidak sesuai.' });

    // Normalize & validate each row
    const VALID_OWNERSHIP = ['RENTAL', 'OWNED'];
    const parsed = rows.map((row, i) => {
      const assetTag = String(row['Asset Tag'] || '').trim();
      const brand    = String(row['Brand'] || '').trim();
      const model    = String(row['Model'] || '').trim();
      const ownership = String(row['Ownership Type'] || 'RENTAL').trim().toUpperCase();
      const rentalCost = parseFloat(String(row['Rental Cost'] || '0').replace(/[^0-9.]/g, '')) || 0;

      const parseDate = (val) => {
        if (!val) return null;
        if (val instanceof Date) return val;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
      };

      const rentalStart = parseDate(row['Rental Start']);
      const rentalEnd   = parseDate(row['Rental End']);

      const errors = [];
      if (!assetTag) errors.push('Asset Tag kosong');
      if (!brand)    errors.push('Brand kosong');
      if (!model)    errors.push('Model kosong');
      if (!rentalStart) errors.push('Rental Start tidak valid');
      if (!rentalEnd)   errors.push('Rental End tidak valid');
      if (!VALID_OWNERSHIP.includes(ownership)) errors.push(`Ownership Type tidak valid: ${ownership}`);

      return {
        _row: i + 2,
        assetTag,
        deviceRef:     String(row['Device Ref'] || '').trim() || null,
        vendorRef:     String(row['Vendor Ref'] || '').trim() || null,
        vendor:        String(row['Vendor'] || '').trim() || null,
        brand,
        model,
        processor:     String(row['Processor'] || '').trim() || null,
        ram:           String(row['RAM'] || '').trim() || null,
        storage:       String(row['Storage'] || '').trim() || null,
        os:            String(row['OS'] || '').trim() || null,
        office:        String(row['Office'] || '').trim() || null,
        ownershipType: ownership,
        rentalCost,
        rentalStart,
        rentalEnd,
        notes:         String(row['Notes'] || '').trim() || null,
        _errors: errors,
      };
    });

    // Batch dedup check
    const validRows = parsed.filter(r => r._errors.length === 0);
    const tagsToCheck = validRows.map(r => r.assetTag);
    const existing = await prisma.asset.findMany({
      where: { assetTag: { in: tagsToCheck } },
      select: { assetTag: true, id: true },
    });
    const existingMap = new Map(existing.map(e => [e.assetTag, e.id]));

    const preview = parsed.map(r => {
      const isDupe = existingMap.has(r.assetTag);
      let status = r._errors.length > 0 ? 'error' : isDupe ? 'duplicate' : 'new';
      return { ...r, status, _existingId: existingMap.get(r.assetTag) || null };
    });

    if (dryRun) return res.json({ preview, summary: buildSummary(preview) });

    // Execute import
    const results = { created: 0, updated: 0, skipped: 0, errors: 0 };
    for (const row of preview) {
      if (row.status === 'error') { results.errors++; continue; }

      const { _row, _errors, _existingId, status, ...data } = row;

      if (status === 'duplicate') {
        if (mode === 'overwrite' && _existingId) {
          await prisma.asset.update({ where: { id: _existingId }, data: {
            ...data,
            auditLogs: undefined,
          }});
          results.updated++;
        } else {
          results.skipped++;
        }
        continue;
      }

      await prisma.asset.create({ data: {
        ...data,
        status: 'AVAILABLE',
        gaSyncStatus: 'PENDING',
        auditLogs: undefined,
      }});
      results.created++;
    }

    res.json({ success: true, results, summary: buildSummary(preview) });
  } catch (err) {
    next(err);
  }
});

function buildSummary(preview) {
  return {
    total:     preview.length,
    new:       preview.filter(r => r.status === 'new').length,
    duplicate: preview.filter(r => r.status === 'duplicate').length,
    error:     preview.filter(r => r.status === 'error').length,
  };
}

// POST /api/assets
// Creates a new asset record
router.post('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    let { assetTag, deviceRef } = req.body;
    const {
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
      vendor
    } = req.body;

    if (!assetTag || !brand || !model || rentalCost === undefined || !rentalStart || !rentalEnd) {
      return res.status(400).json({ error: 'Missing mandatory fields.' });
    }

    // Trim defensively — stray leading/trailing whitespace on assetTag/deviceRef has
    // previously caused GA sync to treat the same physical device as two different ones.
    assetTag = assetTag.trim();
    if (deviceRef) deviceRef = deviceRef.trim();

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
        companyMasterId: companyMasterId && !isNaN(parseInt(companyMasterId)) ? parseInt(companyMasterId) : null,
        vendor: vendor || null
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

    await syncAssetToGA(asset.id);

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
    let { assetTag, deviceRef } = req.body;
    const {
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
      updateJourney,
      vendor
    } = req.body;

    const current = await prisma.asset.findUnique({
      where: { id }
    });

    if (!current) {
      return res.status(404).json({ error: 'Asset not found.' });
    }

    // Trim defensively — stray whitespace has previously caused GA sync to treat the
    // same physical device as two different ones.
    if (assetTag !== undefined && assetTag !== null) assetTag = assetTag.trim();
    if (deviceRef !== undefined && deviceRef !== null) deviceRef = deviceRef.trim();

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
    if (vendor !== undefined) updateData.vendor = vendor || null;
    
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

    // Fire-and-forget — gaSync is best-effort and has its own try/catch
    syncAssetToGA(updatedAsset.id, current.assetTag);
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

      await deleteAssetFromGA(asset.assetTag, [asset.deviceRef]);

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
