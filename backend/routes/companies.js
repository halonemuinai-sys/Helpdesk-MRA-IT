const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

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

module.exports = router;
