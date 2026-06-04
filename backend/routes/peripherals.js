const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/peripherals/stats
// Returns global stats and list of unique categories in use
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const [
      totalsAgg,
      stockAgg,
      inUseAgg,
      damagedAgg,
      categoriesList
    ] = await Promise.all([
      // 1. Total records, total quantity, total budget spent
      prisma.peripheralAsset.aggregate({
        _sum: { quantity: true, totalCost: true },
        _count: { id: true }
      }),
      // 2. Quantity in STOCK status
      prisma.peripheralAsset.aggregate({
        where: { status: 'STOCK' },
        _sum: { quantity: true }
      }),
      // 3. Quantity in IN_USE status
      prisma.peripheralAsset.aggregate({
        where: { status: 'IN_USE' },
        _sum: { quantity: true }
      }),
      // 4. Quantity in DAMAGED or RETIRED status
      prisma.peripheralAsset.aggregate({
        where: {
          status: { in: ['DAMAGED', 'RETIRED'] }
        },
        _sum: { quantity: true }
      }),
      // 5. Unique categories
      prisma.peripheralAsset.findMany({
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' }
      })
    ]);

    res.json({
      totalCount: totalsAgg._count.id || 0,
      totalQuantity: totalsAgg._sum.quantity || 0,
      totalBudget: totalsAgg._sum.totalCost || 0,
      stockQuantity: stockAgg._sum.quantity || 0,
      inUseQuantity: inUseAgg._sum.quantity || 0,
      damagedQuantity: damagedAgg._sum.quantity || 0,
      categories: categoriesList.map(c => c.category)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/peripherals
// Lists all peripheral purchases with filters & search
router.get('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { category, status, search, companyId, companyMasterId, limit, skip } = req.query;

    const where = {};
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (companyId) {
      where.companyId = parseInt(companyId);
    }
    if (companyMasterId) {
      where.companyMasterId = parseInt(companyMasterId);
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { invoiceRef: { contains: search, mode: 'insensitive' } },
        { poRef: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const takeValue = limit ? parseInt(limit) : 200;
    const skipValue = skip ? parseInt(skip) : 0;

    const peripherals = await prisma.peripheralAsset.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true, location: true }
        },
        companyMaster: {
          select: { id: true, name: true }
        }
      },
      orderBy: { purchaseDate: 'desc' },
      take: takeValue,
      skip: skipValue
    });

    res.json(peripherals);
  } catch (err) {
    next(err);
  }
});

// POST /api/peripherals
// Create a new peripheral purchase record
router.post('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      purchaseCost,
      quantity,
      purchaseDate,
      warrantyExpiry,
      supplier,
      invoiceRef,
      poRef,
      status,
      notes,
      companyId,
      companyMasterId
    } = req.body;

    if (!name || !category || !brand || purchaseCost === undefined || !quantity || !purchaseDate) {
      return res.status(400).json({ error: 'Missing mandatory fields.' });
    }

    const parsedCost = parseFloat(purchaseCost);
    const parsedQty = parseInt(quantity);
    const totalCost = parsedCost * parsedQty;

    const newPeripheral = await prisma.peripheralAsset.create({
      data: {
        name,
        category,
        brand,
        model: model || null,
        serialNumber: serialNumber || null,
        purchaseCost: parsedCost,
        quantity: parsedQty,
        totalCost,
        purchaseDate: new Date(purchaseDate),
        warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : null,
        supplier: supplier || null,
        invoiceRef: invoiceRef || null,
        poRef: poRef || null,
        status: status || 'STOCK',
        notes: notes || null,
        companyId: companyId ? parseInt(companyId) : null,
        companyMasterId: companyMasterId ? parseInt(companyMasterId) : null
      }
    });

    // Write system audit log
    await prisma.systemAuditLog.create({
      data: {
        action: 'PERIPHERAL_CREATED',
        details: `Peripheral ${newPeripheral.brand} ${newPeripheral.model || ''} (${newPeripheral.name}, Qty: ${newPeripheral.quantity}) registered by IT staff.`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(newPeripheral);
  } catch (err) {
    next(err);
  }
});

// PUT /api/peripherals/:id
// Update peripheral details
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      purchaseCost,
      quantity,
      purchaseDate,
      warrantyExpiry,
      supplier,
      invoiceRef,
      poRef,
      status,
      notes,
      companyId,
      companyMasterId
    } = req.body;

    const current = await prisma.peripheralAsset.findUnique({
      where: { id }
    });

    if (!current) {
      return res.status(404).json({ error: 'Peripheral record not found.' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (brand !== undefined) updateData.brand = brand;
    if (model !== undefined) updateData.model = model || null;
    if (serialNumber !== undefined) updateData.serialNumber = serialNumber || null;
    if (purchaseCost !== undefined) updateData.purchaseCost = parseFloat(purchaseCost);
    if (quantity !== undefined) updateData.quantity = parseInt(quantity);
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate);
    if (warrantyExpiry !== undefined) updateData.warrantyExpiry = warrantyExpiry ? new Date(warrantyExpiry) : null;
    if (supplier !== undefined) updateData.supplier = supplier || null;
    if (invoiceRef !== undefined) updateData.invoiceRef = invoiceRef || null;
    if (poRef !== undefined) updateData.poRef = poRef || null;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes || null;
    if (companyId !== undefined) updateData.companyId = companyId ? parseInt(companyId) : null;
    if (companyMasterId !== undefined) updateData.companyMasterId = companyMasterId ? parseInt(companyMasterId) : null;

    // Recalculate totalCost if cost or qty changed
    if (updateData.purchaseCost !== undefined || updateData.quantity !== undefined) {
      const finalCost = updateData.purchaseCost !== undefined ? updateData.purchaseCost : current.purchaseCost;
      const finalQty = updateData.quantity !== undefined ? updateData.quantity : current.quantity;
      updateData.totalCost = finalCost * finalQty;
    }

    const updatedPeripheral = await prisma.peripheralAsset.update({
      where: { id },
      data: updateData
    });

    // Write system audit log
    await prisma.systemAuditLog.create({
      data: {
        action: 'PERIPHERAL_UPDATED',
        details: `Peripheral ${updatedPeripheral.brand} ${updatedPeripheral.model || ''} (${updatedPeripheral.name}) details updated by IT staff.`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(updatedPeripheral);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/peripherals/:id
// Delete a peripheral purchase record (ADMIN deletes directly, AGENT creates an ApprovalRequest)
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { role, id: userId, name: userName, email: userEmail } = req.user;
    if (role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const { reason } = req.body;

    const peripheral = await prisma.peripheralAsset.findUnique({
      where: { id }
    });

    if (!peripheral) {
      return res.status(404).json({ error: 'Peripheral record not found.' });
    }

    if (role === 'ADMIN') {
      await prisma.peripheralAsset.delete({
        where: { id }
      });

      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'PERIPHERAL_DELETED',
          details: `IT Peripheral ${peripheral.brand} ${peripheral.model || ''} (${peripheral.name}) deleted directly by Admin.`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({ success: true, message: 'Peripheral deleted successfully.' });
    } else {
      // AGENT: create approval request
      const request = await prisma.approvalRequest.create({
        data: {
          entityType: 'PERIPHERAL',
          entityId: id,
          entityName: `${peripheral.brand} ${peripheral.model || ''} (${peripheral.name})`,
          reason: reason || 'No reason provided',
          requestedById: userId
        }
      });

      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'PERIPHERAL_DELETE_REQUESTED',
          details: `Delete approval requested for Peripheral ${peripheral.brand} ${peripheral.model || ''} (${peripheral.name}). Reason: ${reason || '-'}`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({
        success: true,
        approvalPending: true,
        message: 'Permintaan penghapusan periferal telah diajukan ke Admin untuk persetujuan.',
        request
      });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/peripherals/categories
// Returns all peripheral categories and their associated brands
router.get('/categories', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const categories = await prisma.peripheralCategory.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/peripherals/categories
// Create a new peripheral category
router.post('/categories', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const newCat = await prisma.peripheralCategory.upsert({
      where: { name: name.trim() },
      update: {},
      create: {
        name: name.trim()
      }
    });

    res.status(201).json(newCat);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/peripherals/categories/:id
// Update brands list of a peripheral category
router.patch('/categories/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const { brands } = req.body;

    if (!Array.isArray(brands)) {
      return res.status(400).json({ error: 'Brands must be an array of strings.' });
    }

    const updatedCat = await prisma.peripheralCategory.update({
      where: { id: parseInt(id) },
      data: {
        brands: brands.map(b => b.trim())
      }
    });

    // Write system audit log
    await prisma.systemAuditLog.create({
      data: {
        action: 'PERIPHERAL_CATEGORY_BRANDS_UPDATED',
        details: `Brands for Peripheral Category ${updatedCat.name} updated to: ${brands.join(', ')}`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(updatedCat);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/peripherals/categories/:id
// Delete a peripheral category (ADMIN deletes directly, AGENT creates an ApprovalRequest)
router.delete('/categories/:id', verifyToken, async (req, res, next) => {
  try {
    const { role, id: userId, name: userName, email: userEmail } = req.user;
    if (role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const { reason } = req.body;

    const category = await prisma.peripheralCategory.findUnique({
      where: { id: parseInt(id) }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    if (role === 'ADMIN') {
      await prisma.peripheralCategory.delete({
        where: { id: parseInt(id) }
      });

      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'PERIPHERAL_CATEGORY_DELETED',
          details: `Peripheral Category ${category.name} deleted directly by Admin.`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({ success: true, message: 'Category deleted successfully.' });
    } else {
      // AGENT: create approval request
      const request = await prisma.approvalRequest.create({
        data: {
          entityType: 'PERIPHERAL_CATEGORY',
          entityId: id,
          entityName: category.name,
          reason: reason || 'No reason provided',
          requestedById: userId
        }
      });

      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'PERIPHERAL_CATEGORY_DELETE_REQUESTED',
          details: `Delete approval requested for Peripheral Category ${category.name}. Reason: ${reason || '-'}`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({
        success: true,
        approvalPending: true,
        message: 'Permintaan penghapusan kategori periferal telah diajukan ke Admin untuk persetujuan.',
        request
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
