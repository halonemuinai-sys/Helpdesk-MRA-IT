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
    const actual = parseFloat(actualCost) || 0;

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
        actualCost: actual,
        remainingBudget: alloc - actual,
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

    const alloc = allocatedBudget !== undefined ? parseFloat(allocatedBudget) : undefined;
    const actual = actualCost !== undefined ? parseFloat(actualCost) : undefined;

    const existing = await prisma.iTProjectBudget.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Anggaran proyek tidak ditemukan.' });

    const finalAlloc = alloc !== undefined ? alloc : existing.allocatedBudget;
    const finalActual = actual !== undefined ? actual : existing.actualCost;

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
        actualCost: finalActual,
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

// 5. POST Auto-Generate Baseline 2027 from Active Subscriptions, ISP, and Rentals
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
        status: 'PAID'
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

// 9. POST Tag Subskripsi Aktif ke Budget Item
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
        status: 'PAID'
      }
    });

    const updatedBudget = await recalculateBudgetActualCost(id);
    res.status(201).json(updatedBudget);
  } catch (err) {
    console.error('Error tagging subscription:', err);
    res.status(500).json({ error: 'Gagal me-tag subskripsi ke item anggaran.' });
  }
});

module.exports = router;

