const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const openpyxl = require('xlsx');

const storage = multer.memoryStorage();
const upload = multer({ storage });

// 1. GET all project budgets with filtering
router.get('/', async (req, res) => {
  try {
    const { fiscalYear, companyMasterId, category, status, budgetType, search } = req.query;

    const where = {
      ...(fiscalYear ? { fiscalYear: parseInt(fiscalYear) } : {}),
      ...(companyMasterId ? { companyMasterId: parseInt(companyMasterId) } : {}),
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
      ...(budgetType ? { budgetType } : {}),
      ...(search ? {
        OR: [
          { projectCode: { contains: search, mode: 'insensitive' } },
          { projectName: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
          { vendor: { contains: search, mode: 'insensitive' } }
        ]
      } : {})
    };

    const budgets = await prisma.iTProjectBudget.findMany({
      where,
      include: {
        companyMaster: { select: { id: true, name: true } },
        expenses: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(budgets);
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ error: 'Gagal mengambil data anggaran proyek.' });
  }
});

// 2. POST create new project budget item
router.post('/', async (req, res) => {
  try {
    const {
      projectName,
      category,
      description,
      companyMasterId,
      brand,
      department,
      fiscalYear,
      allocatedBudget,
      actualCost,
      budgetType,
      accountType,
      timeline,
      priority,
      status,
      projectManager,
      vendor,
      notes
    } = req.body;

    if (!projectName || !allocatedBudget || !fiscalYear) {
      return res.status(400).json({ error: 'Nama proyek, pagu anggaran, dan tahun fiskal wajib diisi.' });
    }

    const year = parseInt(fiscalYear) || new Date().getFullYear();
    const count = await prisma.iTProjectBudget.count({ where: { fiscalYear: year } });
    const projectCode = `PRJ-${year}-${String(count + 1).padStart(3, '0')}`;

    const alloc = parseFloat(allocatedBudget) || 0;

    const budget = await prisma.iTProjectBudget.create({
      data: {
        projectCode,
        projectName,
        category: category || 'DIGITAL_TRANSFORMATION',
        description,
        companyMasterId: companyMasterId ? parseInt(companyMasterId) : null,
        brand,
        department,
        fiscalYear: year,
        allocatedBudget: alloc,
        actualCost: 0,
        remainingBudget: alloc,
        budgetType: budgetType || 'CAPEX',
        accountType,
        timeline,
        priority: priority || 'MEDIUM',
        status: status || 'PROPOSED',
        projectManager,
        vendor,
        notes
      },
      include: { companyMaster: { select: { id: true, name: true } } }
    });

    res.status(201).json(budget);
  } catch (err) {
    console.error('Error creating budget:', err);
    res.status(500).json({ error: 'Gagal menambahkan anggaran proyek.' });
  }
});

// 3. PUT update existing project budget
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      projectName,
      category,
      description,
      companyMasterId,
      brand,
      department,
      fiscalYear,
      allocatedBudget,
      budgetType,
      accountType,
      timeline,
      priority,
      status,
      projectManager,
      vendor,
      notes
    } = req.body;

    const alloc = allocatedBudget !== undefined ? parseFloat(allocatedBudget) : undefined;

    const existing = await prisma.iTProjectBudget.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Anggaran proyek tidak ditemukan.' });

    const finalAlloc = alloc !== undefined ? alloc : existing.allocatedBudget;
    // actualCost hanya dihitung dari expenses yang di-tag, tidak dari form
    const finalActual = existing.actualCost;

    const updated = await prisma.iTProjectBudget.update({
      where: { id },
      data: {
        ...(projectName ? { projectName } : {}),
        ...(category ? { category } : {}),
        description,
        ...(companyMasterId !== undefined ? { companyMasterId: companyMasterId ? parseInt(companyMasterId) : null } : {}),
        brand,
        department,
        ...(fiscalYear ? { fiscalYear: parseInt(fiscalYear) } : {}),
        allocatedBudget: finalAlloc,
        remainingBudget: finalAlloc - finalActual,
        ...(budgetType ? { budgetType } : {}),
        accountType,
        timeline,
        ...(priority ? { priority } : {}),
        ...(status ? { status } : {}),
        projectManager,
        vendor,
        notes
      },
      include: { companyMaster: { select: { id: true, name: true } } }
    });

    res.json(updated);
  } catch (err) {
    console.error('Error updating budget:', err);
    res.status(500).json({ error: 'Gagal memperbarui anggaran proyek.' });
  }
});

// 4. DELETE project budget item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.iTProjectBudget.delete({ where: { id } });
    res.json({ message: 'Anggaran proyek berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting budget:', err);
    res.status(500).json({ error: 'Gagal menghapus anggaran proyek.' });
  }
});

// 5a. GET Rollover Preview — show source year items with proposed target year budget
router.get('/rollover-preview', async (req, res) => {
  try {
    const { fromYear, toYear, companyMasterId } = req.query;
    const fy = parseInt(fromYear) || 2026;
    const ty = parseInt(toYear) || 2027;

    const sourceItems = await prisma.iTProjectBudget.findMany({
      where: {
        fiscalYear: fy,
        ...(companyMasterId ? { companyMasterId: parseInt(companyMasterId) } : {})
      },
      include: {
        companyMaster: { select: { id: true, name: true } },
        expenses: { select: { sourceType: true, sourceCategory: true, amount: true } }
      },
      orderBy: [{ budgetType: 'asc' }, { accountType: 'asc' }]
    });

    const existingInTarget = await prisma.iTProjectBudget.findMany({
      where: {
        fiscalYear: ty,
        ...(companyMasterId ? { companyMasterId: parseInt(companyMasterId) } : {})
      },
      select: { projectName: true, companyMasterId: true }
    });
    const existingKeys = new Set(
      existingInTarget.map(e => `${e.projectName}__${e.companyMasterId}`)
    );

    const preview = sourceItems.map(item => {
      // Build expense source breakdown from actual tagged transactions
      const sourceBreakdown = {};
      for (const exp of item.expenses) {
        const key = exp.sourceType === 'ASSET'
          ? `ASSET_${(exp.sourceCategory || 'OTHER').toUpperCase()}`
          : (exp.sourceType || 'MANUAL');
        sourceBreakdown[key] = (sourceBreakdown[key] || 0) + (exp.amount || 0);
      }

      // Derive primary device category from actual expense records
      const assetCategories = item.expenses
        .filter(e => e.sourceType === 'ASSET')
        .map(e => (e.sourceCategory || '').toUpperCase());
      const deviceCategory = assetCategories.includes('SMARTPHONE') ? 'SMARTPHONE'
        : assetCategories.includes('LAPTOP') ? 'LAPTOP'
        : assetCategories.includes('PRINTER') ? 'PRINTER'
        : null;

      return {
        sourceId: item.id,
        projectCode: item.projectCode,
        projectName: item.projectName,
        company: item.companyMaster?.name || '-',
        companyMasterId: item.companyMasterId,
        brand: item.brand,
        department: item.department,
        category: item.category,
        budgetType: item.budgetType,
        accountType: item.accountType || '-',
        priority: item.priority,
        fromYearAllocated: item.allocatedBudget,
        fromYearActual: item.actualCost,
        proposedBase: item.actualCost > 0 ? item.actualCost : item.allocatedBudget,
        sourceBreakdown,
        deviceCategory,
        isDuplicate: existingKeys.has(`${item.projectName}__${item.companyMasterId}`)
      };
    });

    res.json({ preview, fromYear: fy, toYear: ty });
  } catch (err) {
    console.error('Error fetching rollover preview:', err);
    res.status(500).json({ error: 'Gagal mengambil preview rollover.' });
  }
});

// 5b. POST Rollover — bulk-create target year budget items from source year history
router.post('/rollover', async (req, res) => {
  try {
    const { toYear, adjustmentFactor = 1, items } = req.body;
    const ty = parseInt(toYear);

    if (!ty || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'toYear dan items diperlukan.' });
    }

    const selectedItems = items.filter(i => i.include);
    if (selectedItems.length === 0) {
      return res.status(400).json({ error: 'Tidak ada item yang dipilih.' });
    }

    const sourceIds = selectedItems.map(i => i.sourceId);
    const sourceBudgets = await prisma.iTProjectBudget.findMany({
      where: { id: { in: sourceIds } }
    });

    let countCreated = 0;
    let countSkipped = 0;

    for (const sel of selectedItems) {
      const src = sourceBudgets.find(b => b.id === sel.sourceId);
      if (!src) continue;

      const existing = await prisma.iTProjectBudget.findFirst({
        where: { fiscalYear: ty, projectName: src.projectName, companyMasterId: src.companyMasterId }
      });
      if (existing) { countSkipped++; continue; }

      const base = src.actualCost > 0 ? src.actualCost : src.allocatedBudget;
      const allocatedBudget = sel.customBudget != null && sel.customBudget !== ''
        ? parseFloat(sel.customBudget)
        : Math.round(base * parseFloat(adjustmentFactor));

      const existingCount = await prisma.iTProjectBudget.count({ where: { fiscalYear: ty } });
      const projectCode = `PRJ-${ty}-${String(existingCount + 1).padStart(3, '0')}`;

      await prisma.iTProjectBudget.create({
        data: {
          projectCode,
          projectName: src.projectName,
          category: src.category,
          description: `Rollover dari ${src.projectCode} — realisasi ${ty - 1}: ${src.actualCost > 0 ? src.actualCost.toFixed(0) : 'N/A'}`,
          companyMasterId: src.companyMasterId,
          brand: src.brand,
          department: src.department,
          fiscalYear: ty,
          allocatedBudget,
          actualCost: 0,
          remainingBudget: allocatedBudget,
          budgetType: src.budgetType,
          accountType: src.accountType,
          priority: src.priority,
          status: 'PROPOSED',
          vendor: src.vendor,
          notes: `Estimasi rollover dari ${src.projectCode} (${ty - 1} → ${ty})`
        }
      });
      countCreated++;
    }

    res.json({
      message: `Berhasil membuat ${countCreated} item estimasi anggaran ${ty}.${countSkipped > 0 ? ` ${countSkipped} item dilewati karena sudah ada.` : ''}`,
      countCreated,
      countSkipped
    });
  } catch (err) {
    console.error('Error rolling over budgets:', err);
    res.status(500).json({ error: 'Gagal membuat rollover anggaran.' });
  }
});

// 5c. POST Auto-Generate Baseline 2027 from Active Subscriptions, ISP, and Rentals
router.post('/generate-baseline-2027', async (req, res) => {
  try {
    const year = 2027;
    const rangeStart = new Date('2027-01-01T00:00:00.000Z');
    const rangeEnd = new Date('2027-12-31T23:59:59.999Z');

    let countAdded = 0;

    // A. Subscriptions & ISP
    const subscriptions = await prisma.iTSubscription.findMany({
      where: {
        startDate: { lte: rangeEnd },
        expiryDate: { gte: rangeStart }
      },
      include: { companyMaster: true }
    });

    for (const sub of subscriptions) {
      let annualCost = sub.cost;
      if (sub.billingCycle === '1 Bulan') {
        annualCost = sub.cost * 12;
      }

      const existingCount = await prisma.iTProjectBudget.count({ where: { fiscalYear: year } });
      const projectCode = `PRJ-${year}-${String(existingCount + 1).padStart(3, '0')}`;
      const isISP = sub.category === 'ISP';

      await prisma.iTProjectBudget.create({
        data: {
          projectCode,
          projectName: `${isISP ? 'Koneksi Internet ISP' : 'Subskripsi Rutin'} - ${sub.providerName || sub.name}`,
          category: isISP ? 'INFRASTRUCTURE' : 'SOFTWARE_DEVELOPMENT',
          description: `Auto-generated baseline dari kontrak ${sub.providerName} (${sub.billingCycle})`,
          companyMasterId: sub.companyMasterId,
          brand: sub.brand,
          fiscalYear: year,
          allocatedBudget: annualCost,
          actualCost: 0,
          remainingBudget: annualCost,
          budgetType: 'OPEX',
          accountType: isISP ? 'Utilities' : 'License & Permit',
          priority: 'HIGH',
          status: 'APPROVED',
          notes: `Circuit ID / Ref: ${sub.contractNumber || '-'}`
        }
      });
      countAdded++;
    }

    res.json({ message: `Berhasil meng-generate ${countAdded} item baseline operasional rutin untuk tahun ${year}.` });
  } catch (err) {
    console.error('Error generating baseline 2027:', err);
    res.status(500).json({ error: 'Gagal me-generate baseline anggaran 2027.' });
  }
});

// Helper function to recalculate actualCost for a budget item
async function recalculateBudgetActualCost(projectId) {
  const expenses = await prisma.iTProjectExpense.findMany({
    where: { projectId }
  });
  const totalActual = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const budget = await prisma.iTProjectBudget.findUnique({ where: { id: projectId } });
  if (budget) {
    return await prisma.iTProjectBudget.update({
      where: { id: projectId },
      data: {
        actualCost: totalActual,
        remainingBudget: budget.allocatedBudget - totalActual
      },
      include: {
        companyMaster: { select: { id: true, name: true } },
        expenses: { orderBy: { expenseDate: 'desc' } }
      }
    });
  }
  return null;
}

// 6. GET expenses for a specific project budget
router.get('/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;
    const expenses = await prisma.iTProjectExpense.findMany({
      where: { projectId: id },
      orderBy: { expenseDate: 'desc' }
    });
    res.json(expenses);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Gagal mengambil data rincian transaksi realisasi.' });
  }
});

// 7. POST add/tag new expense transaction to budget
router.post('/:id/expenses', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, expenseDate, invoiceNumber, vendor, receiptLink } = req.body;

    if (!description || amount === undefined) {
      return res.status(400).json({ error: 'Deskripsi transaksi dan nominal wajib diisi.' });
    }

    const budget = await prisma.iTProjectBudget.findUnique({ where: { id } });
    if (!budget) return res.status(404).json({ error: 'Anggaran proyek tidak ditemukan.' });

    await prisma.iTProjectExpense.create({
      data: {
        projectId: id,
        description,
        amount: parseFloat(amount) || 0,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        invoiceNumber,
        vendor,
        receiptLink,
        status: 'PAID',
        sourceType: 'MANUAL',
        sourceCategory: 'Manual'
      }
    });

    const updatedBudget = await recalculateBudgetActualCost(id);
    res.status(201).json(updatedBudget);
  } catch (err) {
    console.error('Error creating expense:', err);
    res.status(500).json({ error: 'Gagal mencatat rincian transaksi realisasi.' });
  }
});

// 8. DELETE tagged expense transaction from budget
router.delete('/:id/expenses/:expenseId', async (req, res) => {
  try {
    const { id, expenseId } = req.params;
    await prisma.iTProjectExpense.delete({
      where: { id: expenseId }
    });

    const updatedBudget = await recalculateBudgetActualCost(id);
    res.json(updatedBudget);
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: 'Gagal menghapus rincian transaksi.' });
  }
});

// 9. POST Reset actualCost semua item yang tidak punya expenses ke 0
router.post('/reset-actual-costs', async (req, res) => {
  try {
    const budgets = await prisma.iTProjectBudget.findMany({
      include: { expenses: true }
    });
    let fixed = 0;
    for (const b of budgets) {
      const trueActual = b.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      if (b.actualCost !== trueActual) {
        await prisma.iTProjectBudget.update({
          where: { id: b.id },
          data: { actualCost: trueActual, remainingBudget: b.allocatedBudget - trueActual }
        });
        fixed++;
      }
    }
    res.json({ message: `Reset selesai. ${fixed} item diperbaiki.` });
  } catch (err) {
    console.error('Error resetting actual costs:', err);
    res.status(500).json({ error: 'Gagal reset actual costs.' });
  }
});

// 10. POST Tag Subskripsi Aktif ke Budget Item
router.post('/:id/tag-subscription', async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionId } = req.body;

    const sub = await prisma.iTSubscription.findUnique({
      where: { id: subscriptionId },
      include: { companyMaster: true }
    });
    if (!sub) return res.status(404).json({ error: 'Subskripsi tidak ditemukan.' });

    const description = `[Subskripsi ${sub.category}] ${sub.name || sub.providerName} (${sub.billingCycle})`;
    let amount = sub.cost;
    if (sub.billingCycle === '1 Bulan') {
      amount = sub.cost * 12; // Tag annual total
    }

    await prisma.iTProjectExpense.create({
      data: {
        projectId: id,
        description,
        amount,
        expenseDate: sub.startDate || new Date(),
        invoiceNumber: sub.contractNumber || `SUB-${sub.id.substring(0, 6)}`,
        vendor: sub.providerName || sub.brand,
        receiptLink: sub.evidenceLink,
        status: 'PAID',
        sourceType: 'SUBSCRIPTION',
        sourceCategory: sub.category || 'License',
        sourceRefId: sub.id
      }
    });

    const updatedBudget = await recalculateBudgetActualCost(id);
    res.status(201).json(updatedBudget);
  } catch (err) {
    console.error('Error tagging subscription:', err);
    res.status(500).json({ error: 'Gagal me-tag subskripsi ke item anggaran.' });
  }
});

// 10. POST Tag Aset Sewa ke Budget Item
router.post('/:id/tag-rental', async (req, res) => {
  try {
    const { id } = req.params;
    const { assetId, overrideMonths } = req.body;

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { companyMaster: { select: { name: true } } }
    });
    if (!asset) return res.status(404).json({ error: 'Aset tidak ditemukan.' });
    if (asset.ownershipType !== 'RENTAL') {
      return res.status(400).json({ error: 'Aset ini bukan tipe sewa (RENTAL).' });
    }

    // Ambil fiscalYear dari budget untuk prorate
    const budgetItem = await prisma.iTProjectBudget.findUnique({ where: { id }, select: { fiscalYear: true } });
    const fiscalYear = budgetItem?.fiscalYear || new Date().getFullYear();

    const yearStart = new Date(fiscalYear, 0, 1);   // 1 Jan
    const yearEnd   = new Date(fiscalYear, 11, 31);  // 31 Des

    const rentalStart = asset.rentalStart ? new Date(asset.rentalStart) : yearStart;
    const rentalEnd   = asset.rentalEnd   ? new Date(asset.rentalEnd)   : yearEnd;

    const effectiveStart = rentalStart > yearStart ? rentalStart : yearStart;
    const effectiveEnd   = rentalEnd   < yearEnd   ? rentalEnd   : yearEnd;

    // Hitung bulan aktif dalam tahun fiskal (minimal 1 bulan)
    let autoMonths = 0;
    if (effectiveEnd >= effectiveStart) {
      autoMonths = (effectiveEnd.getFullYear() - effectiveStart.getFullYear()) * 12
        + (effectiveEnd.getMonth() - effectiveStart.getMonth()) + 1;
    }
    autoMonths = Math.min(Math.max(autoMonths, 1), 12);

    // Gunakan override jika dikirim dari frontend, fallback ke auto
    const activeMonths = (overrideMonths && overrideMonths >= 1 && overrideMonths <= 12)
      ? Math.round(overrideMonths)
      : autoMonths;

    const proratedCost = Math.round((asset.rentalCost || 0) * activeMonths);
    const customLabel = overrideMonths && overrideMonths !== autoMonths ? ' ✎' : '';
    const description = `[Sewa Aset] ${asset.brand} ${asset.model} — ${asset.assetTag}${asset.vendor ? ` (${asset.vendor})` : ''} (${activeMonths} bln di ${fiscalYear}${customLabel})`;

    await prisma.iTProjectExpense.create({
      data: {
        projectId: id,
        description,
        amount: proratedCost,
        expenseDate: asset.rentalStart || new Date(),
        invoiceNumber: asset.vendorRef || asset.assetTag,
        vendor: asset.vendor || null,
        status: 'PAID',
        sourceType: 'ASSET',
        sourceCategory: asset.deviceCategory || 'Laptop',
        sourceRefId: asset.id
      }
    });

    const updatedBudget = await recalculateBudgetActualCost(id);
    res.status(201).json(updatedBudget);
  } catch (err) {
    console.error('Error tagging rental asset:', err);
    res.status(500).json({ error: 'Gagal me-tag aset sewa ke item anggaran.' });
  }
});

// 12. POST Tag Invoice Peripheral ke Budget Item
router.post('/:id/tag-peripheral', async (req, res) => {
  try {
    const { id } = req.params;
    const { peripheralInvoiceId } = req.body;

    const invoice = await prisma.peripheralInvoice.findUnique({
      where: { id: peripheralInvoiceId },
      include: { items: true }
    });
    if (!invoice) return res.status(404).json({ error: 'Invoice peripheral tidak ditemukan.' });

    const description = `[Periferal] ${invoice.invoiceRef} — ${invoice.supplier} (${invoice.items.length} item)`;

    await prisma.iTProjectExpense.create({
      data: {
        projectId: id,
        description,
        amount: invoice.totalCost,
        expenseDate: invoice.purchaseDate || new Date(),
        invoiceNumber: invoice.invoiceRef,
        vendor: invoice.supplier,
        receiptLink: invoice.fileLink,
        status: 'PAID',
        sourceType: 'PERIPHERAL',
        sourceCategory: 'Peripheral',
        sourceRefId: invoice.id
      }
    });

    const updatedBudget = await recalculateBudgetActualCost(id);
    res.status(201).json(updatedBudget);
  } catch (err) {
    console.error('Error tagging peripheral invoice:', err);
    res.status(500).json({ error: 'Gagal me-tag invoice peripheral ke item anggaran.' });
  }
});

module.exports = router;

