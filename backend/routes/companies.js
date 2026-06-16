const express = require('express');
const prisma = require('../api/db');
const { verifyToken, checkRole } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/companies/master
// Returns all master companies (unique legal entities)
router.get('/master', verifyToken, async (req, res, next) => {
  try {
    const masters = await prisma.companyMaster.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(masters);
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/public
// Returns list of unique company names for public dropdowns (no auth needed)
router.get('/public', async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      select: { name: true },
      orderBy: { name: 'asc' }
    });
    // Extract unique company names
    const uniqueNames = Array.from(new Set(companies.map(c => c.name))).sort();
    res.json(uniqueNames);
  } catch (err) {
    next(err);
  }
});

// GET /api/companies
// Returns all company branches (name, location, sector)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: [
        { name: 'asc' },
        { location: 'asc' }
      ]
    });
    res.json(companies);
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:companyId/employees
// Returns all employees working at a specific company branch
router.get('/:companyId/employees', verifyToken, async (req, res, next) => {
  try {
    const companyId = parseInt(req.params.companyId);
    if (isNaN(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID.' });
    }

    const employees = await prisma.user.findMany({
      where: { companyId: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        jobPosition: true,
        role: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(employees);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// ADMIN WRITE OPERATIONS
// ==========================================

// POST /api/companies/master
// Creates a new CompanyMaster (Grup Entitas Induk)
router.post('/master', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const { name, sector, sharedBudget } = req.body;
    if (!name || !sector) {
      return res.status(400).json({ error: 'Name and sector are required.' });
    }

    const master = await prisma.companyMaster.create({
      data: {
        name: name.trim(),
        sector: sector.toUpperCase().trim(),
        sharedBudget: parseFloat(sharedBudget) || 0
      }
    });

    res.status(201).json(master);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Company master name already exists.' });
    }
    next(err);
  }
});

// PUT /api/companies/master/:id
// Updates a CompanyMaster
router.put('/master/:id', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid master ID.' });
    }

    const { name, sector, sharedBudget } = req.body;
    if (!name || !sector) {
      return res.status(400).json({ error: 'Name and sector are required.' });
    }

    const master = await prisma.companyMaster.update({
      where: { id },
      data: {
        name: name.trim(),
        sector: sector.toUpperCase().trim(),
        sharedBudget: parseFloat(sharedBudget) || 0
      }
    });

    res.json(master);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Company master name already exists.' });
    }
    next(err);
  }
});

// DELETE /api/companies/master/:id
// Deletes a CompanyMaster
router.delete('/master/:id', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid master ID.' });
    }

    // Check if there are branches linked
    const linkedBranches = await prisma.company.count({
      where: { companyMasterId: id }
    });

    if (linkedBranches > 0) {
      return res.status(400).json({ error: 'Cannot delete master company because it is still linked to branches.' });
    }

    await prisma.companyMaster.delete({ where: { id } });
    res.json({ message: 'Master company deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies
// Creates a new Company branch (Cabang Fisik)
router.post('/', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const { name, location, sector, companyMasterId } = req.body;
    if (!name || !location || !sector) {
      return res.status(400).json({ error: 'Name, location, and sector are required.' });
    }

    const branch = await prisma.company.create({
      data: {
        name: name.trim(),
        location: location.trim(),
        sector: sector.toUpperCase().trim(),
        companyMasterId: companyMasterId ? parseInt(companyMasterId) : null
      }
    });

    res.status(201).json(branch);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'A branch with this name and location already exists.' });
    }
    next(err);
  }
});

// PUT /api/companies/:id
// Updates a Company branch
router.put('/:id', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid branch ID.' });
    }

    const { name, location, sector, companyMasterId } = req.body;
    if (!name || !location || !sector) {
      return res.status(400).json({ error: 'Name, location, and sector are required.' });
    }

    const branch = await prisma.company.update({
      where: { id },
      data: {
        name: name.trim(),
        location: location.trim(),
        sector: sector.toUpperCase().trim(),
        companyMasterId: companyMasterId ? parseInt(companyMasterId) : null
      }
    });

    res.json(branch);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'A branch with this name and location already exists.' });
    }
    next(err);
  }
});

// DELETE /api/companies/:id
// Deletes a Company branch
router.delete('/:id', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid branch ID.' });
    }

    // Check if there are employees, tickets, or assets linked
    const linkedUsers = await prisma.user.count({ where: { companyId: id } });
    const linkedTickets = await prisma.ticket.count({ where: { companyId: id } });
    const linkedAssets = await prisma.asset.count({ where: { companyId: id } });

    if (linkedUsers > 0 || linkedTickets > 0 || linkedAssets > 0) {
      return res.status(400).json({
        error: `Cannot delete branch because it is still linked to: ` +
               `${linkedUsers > 0 ? `${linkedUsers} Karyawan ` : ''}` +
               `${linkedTickets > 0 ? `${linkedTickets} Tiket ` : ''}` +
               `${linkedAssets > 0 ? `${linkedAssets} Perangkat ` : ''}`.trim()
      });
    }

    await prisma.company.delete({ where: { id } });
    res.json({ message: 'Branch deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
