const express = require('express');
const prisma = require('../api/db');
const { verifyToken, checkRole } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/users
// Retrieve users with optional company filter
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const where = {};

    if (companyId) {
      where.companyId = parseInt(companyId);
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        company: true
      },
      orderBy: { name: 'asc' }
    });

    // Exclude password hashes from response
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    res.json(safeUsers);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/role
// Update user role (ADMIN only)
router.patch('/:id/role', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['USER', 'AGENT', 'ADMIN'].includes(role.toUpperCase())) {
      return res.status(400).json({ error: 'Invalid or missing role. Must be USER, AGENT, or ADMIN.' });
    }

    const targetRole = role.toUpperCase();

    // Check if target user exists
    const userExists = await prisma.user.findUnique({
      where: { id }
    });
    if (!userExists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: targetRole },
      include: { company: true }
    });

    const { password, ...safeUser } = updatedUser;
    res.json({
      message: `User ${safeUser.name} role updated to ${targetRole} successfully.`,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
