const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/audit-logs
// Retrieve system audit logs with filtering & pagination (Agent & Admin)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { action, search, limit, skip } = req.query;

    const where = {};
    if (action) {
      where.action = action.toUpperCase();
    }
    if (search) {
      where.OR = [
        { details: { contains: search, mode: 'insensitive' } },
        { performedBy: { contains: search, mode: 'insensitive' } }
      ];
    }

    const parsedLimit = parseInt(limit) || 50;
    const parsedSkip = parseInt(skip) || 0;

    const [logs, total] = await prisma.$transaction([
      prisma.systemAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parsedLimit,
        skip: parsedSkip
      }),
      prisma.systemAuditLog.count({ where })
    ]);

    res.json({
      logs,
      total,
      limit: parsedLimit,
      skip: parsedSkip
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
