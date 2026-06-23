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
      categoriesList,
      invoiceAgg
    ] = await Promise.all([
      // 1. Total records, total quantity, total budget spent of items
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
      }),
      // 6. Invoices stats: total count, total service costs, and total invoice costs
      prisma.peripheralInvoice.aggregate({
        _sum: { serviceCost: true, totalCost: true },
        _count: { id: true }
      })
    ]);

    res.json({
      totalCount: totalsAgg._count.id || 0,
      totalQuantity: totalsAgg._sum.quantity || 0,
      totalBudget: totalsAgg._sum.totalCost || 0, // items budget
      stockQuantity: stockAgg._sum.quantity || 0,
      inUseQuantity: inUseAgg._sum.quantity || 0,
      damagedQuantity: damagedAgg._sum.quantity || 0,
      categories: categoriesList.map(c => c.category),
      
      // Invoice stats
      totalInvoices: invoiceAgg._count.id || 0,
      totalInvoiceBudget: invoiceAgg._sum.totalCost || 0,
      totalServiceBudget: invoiceAgg._sum.serviceCost || 0
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/peripherals
// Lists all individual peripheral assets with filters & search
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
        },
        peripheralInvoice: {
          select: { id: true, invoiceRef: true, supplier: true, purchaseDate: true, serviceCost: true, totalCost: true }
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

// GET /api/peripherals/invoices
// Lists all invoices with filters & search
router.get('/invoices', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { search, companyMasterId, limit, skip } = req.query;

    const where = {};
    if (companyMasterId) {
      where.companyMasterId = parseInt(companyMasterId);
    }
    if (search) {
      where.OR = [
        { invoiceRef: { contains: search, mode: 'insensitive' } },
        { poRef: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    const takeValue = limit ? parseInt(limit) : 200;
    const skipValue = skip ? parseInt(skip) : 0;

    const invoices = await prisma.peripheralInvoice.findMany({
      where,
      include: {
        companyMaster: {
          select: { id: true, name: true }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { purchaseDate: 'desc' },
      take: takeValue,
      skip: skipValue
    });

    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

// GET /api/peripherals/invoices/:id
// Get detail of a single invoice and all its items
router.get('/invoices/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;

    const invoice = await prisma.peripheralInvoice.findUnique({
      where: { id },
      include: {
        companyMaster: {
          select: { id: true, name: true }
        },
        items: {
          include: {
            company: {
              select: { id: true, name: true, location: true }
            }
          },
          orderBy: { name: 'asc' }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice tidak ditemukan.' });
    }

    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// POST /api/peripherals/invoices
// Create a new invoice and bulk insert its peripheral items in a transaction
router.post('/invoices', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const {
      invoiceRef,
      poRef,
      supplier,
      purchaseDate,
      serviceCost,
      deliveryCost,
      taxCost,
      notes,
      companyMasterId,
      items
    } = req.body;

    if (!invoiceRef || !supplier || !purchaseDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Nomor invoice, supplier, tanggal beli, dan minimal 1 barang wajib diisi.' });
    }

    // Verify invoiceRef uniqueness
    const existing = await prisma.peripheralInvoice.findUnique({
      where: { invoiceRef: invoiceRef.trim() }
    });
    if (existing) {
      return res.status(400).json({ error: `Nomor invoice "${invoiceRef}" sudah terdaftar di sistem.` });
    }

    const parsedService = parseFloat(serviceCost) || 0;
    const parsedDelivery = parseFloat(deliveryCost) || 0;
    const parsedTax = parseFloat(taxCost) || 0;

    // Calculate total cost
    let itemsTotal = 0;
    const processedItems = items.map(item => {
      const purchaseCost = parseFloat(item.purchaseCost) || 0;
      const quantity = parseInt(item.quantity) || 1;
      const totalCost = purchaseCost * quantity;
      itemsTotal += totalCost;

      return {
        name: item.name,
        category: item.category,
        brand: item.brand,
        model: item.model || null,
        serialNumber: item.serialNumber || null,
        purchaseCost,
        quantity,
        totalCost,
        purchaseDate: new Date(purchaseDate),
        supplier: supplier.trim(),
        invoiceRef: invoiceRef.trim(),
        poRef: poRef || null,
        status: item.status || 'STOCK',
        notes: item.notes || null,
        companyId: item.companyId ? parseInt(item.companyId) : null,
        companyMasterId: companyMasterId ? parseInt(companyMasterId) : null
      };
    });

    const totalCost = itemsTotal + parsedService + parsedDelivery + parsedTax;

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.peripheralInvoice.create({
        data: {
          invoiceRef: invoiceRef.trim(),
          poRef: poRef || null,
          supplier: supplier.trim(),
          purchaseDate: new Date(purchaseDate),
          serviceCost: parsedService,
          deliveryCost: parsedDelivery,
          taxCost: parsedTax,
          totalCost,
          notes: notes || null,
          companyMasterId: companyMasterId ? parseInt(companyMasterId) : null,
          items: {
            create: processedItems
          }
        },
        include: {
          items: true
        }
      });

      return invoice;
    });

    // Write system audit log
    await prisma.systemAuditLog.create({
      data: {
        action: 'PERIPHERAL_INVOICE_CREATED',
        details: `Invoice ${result.invoiceRef} from ${result.supplier} (Total Cost: Rp ${result.totalCost.toLocaleString()}, Items Count: ${result.items.length}) registered by IT staff.`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /api/peripherals/invoices/:id
// Update invoice and sync its items (add, update, delete) in a transaction
router.put('/invoices/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const {
      invoiceRef,
      poRef,
      supplier,
      purchaseDate,
      serviceCost,
      deliveryCost,
      taxCost,
      notes,
      companyMasterId,
      items
    } = req.body;

    const currentInvoice = await prisma.peripheralInvoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!currentInvoice) {
      return res.status(404).json({ error: 'Invoice tidak ditemukan.' });
    }

    if (!invoiceRef || !supplier || !purchaseDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Nomor invoice, supplier, tanggal beli, dan minimal 1 barang wajib diisi.' });
    }

    if (invoiceRef.trim() !== currentInvoice.invoiceRef) {
      const existing = await prisma.peripheralInvoice.findUnique({
        where: { invoiceRef: invoiceRef.trim() }
      });
      if (existing) {
        return res.status(400).json({ error: `Nomor invoice "${invoiceRef}" sudah terdaftar.` });
      }
    }

    const parsedService = parseFloat(serviceCost) || 0;
    const parsedDelivery = parseFloat(deliveryCost) || 0;
    const parsedTax = parseFloat(taxCost) || 0;

    let itemsTotal = 0;
    const currentItemIds = currentInvoice.items.map(item => item.id);
    const updatedItemIds = items.filter(item => item.id).map(item => item.id);

    const itemsToDelete = currentItemIds.filter(itemId => !updatedItemIds.includes(itemId));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete removed items
      if (itemsToDelete.length > 0) {
        await tx.peripheralAsset.deleteMany({
          where: { id: { in: itemsToDelete } }
        });
      }

      // 2. Add / Update items
      for (const item of items) {
        const purchaseCost = parseFloat(item.purchaseCost) || 0;
        const quantity = parseInt(item.quantity) || 1;
        const totalCost = purchaseCost * quantity;
        itemsTotal += totalCost;

        const itemData = {
          name: item.name,
          category: item.category,
          brand: item.brand,
          model: item.model || null,
          serialNumber: item.serialNumber || null,
          purchaseCost,
          quantity,
          totalCost,
          purchaseDate: new Date(purchaseDate),
          supplier: supplier.trim(),
          invoiceRef: invoiceRef.trim(),
          poRef: poRef || null,
          status: item.status || 'STOCK',
          notes: item.notes || null,
          companyId: item.companyId ? parseInt(item.companyId) : null,
          companyMasterId: companyMasterId ? parseInt(companyMasterId) : null
        };

        if (item.id) {
          await tx.peripheralAsset.update({
            where: { id: item.id },
            data: itemData
          });
        } else {
          await tx.peripheralAsset.create({
            data: {
              ...itemData,
              peripheralInvoiceId: id
            }
          });
        }
      }

      // 3. Update Invoice
      const totalCost = itemsTotal + parsedService + parsedDelivery + parsedTax;
      const updatedInvoice = await tx.peripheralInvoice.update({
        where: { id },
        data: {
          invoiceRef: invoiceRef.trim(),
          poRef: poRef || null,
          supplier: supplier.trim(),
          purchaseDate: new Date(purchaseDate),
          serviceCost: parsedService,
          deliveryCost: parsedDelivery,
          taxCost: parsedTax,
          totalCost,
          notes: notes || null,
          companyMasterId: companyMasterId ? parseInt(companyMasterId) : null
        },
        include: { items: true }
      });

      return updatedInvoice;
    });

    // Write system audit log
    await prisma.systemAuditLog.create({
      data: {
        action: 'PERIPHERAL_INVOICE_UPDATED',
        details: `Invoice ${result.invoiceRef} updated by IT staff. Total cost: Rp ${result.totalCost.toLocaleString()}.`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/peripherals/invoices/:id
// Delete an invoice (cascades and deletes linked items automatically due to DB constraints)
router.delete('/invoices/:id', verifyToken, async (req, res, next) => {
  try {
    const { role, name: userName, email: userEmail } = req.user;
    if (role !== 'ADMIN') {
      return res.status(403).json({ error: 'Hanya Admin yang dapat menghapus data Invoice secara langsung.' });
    }
    const { id } = req.params;

    const invoice = await prisma.peripheralInvoice.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice tidak ditemukan.' });
    }

    await prisma.peripheralInvoice.delete({
      where: { id }
    });

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'PERIPHERAL_INVOICE_DELETED',
        details: `Invoice ${invoice.invoiceRef} (Supplier: ${invoice.supplier}, Items Count: ${invoice.items.length}) deleted directly by Admin.`,
        performedBy: `${userName} (${userEmail})`
      }
    });

    res.json({ success: true, message: 'Invoice dan seluruh barang terkait berhasil dihapus dari database.' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/peripherals/:id
// Delete a single peripheral item record (ADMIN deletes directly, AGENT creates an ApprovalRequest)
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

      // Recalculate linked invoice cost if any
      if (peripheral.peripheralInvoiceId) {
        const remainingItems = await prisma.peripheralAsset.findMany({
          where: { peripheralInvoiceId: peripheral.peripheralInvoiceId }
        });
        const itemsTotal = remainingItems.reduce((sum, item) => sum + item.totalCost, 0);
        
        const invoice = await prisma.peripheralInvoice.findUnique({
          where: { id: peripheral.peripheralInvoiceId }
        });
        if (invoice) {
          const totalCost = itemsTotal + invoice.serviceCost + invoice.deliveryCost + invoice.taxCost;
          await prisma.peripheralInvoice.update({
            where: { id: invoice.id },
            data: { totalCost }
          });
        }
      }

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
