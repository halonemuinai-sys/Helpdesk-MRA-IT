const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

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
