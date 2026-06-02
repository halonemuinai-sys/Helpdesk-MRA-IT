const express = require('express');
const prisma = require('../api/db');
const { verifyToken, checkRole } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/users
// Retrieve users with optional company filter
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { companyId, role, department, search } = req.query;
    const where = {};

    if (companyId && companyId !== 'undefined' && companyId !== 'null' && companyId !== '') {
      const parsedId = parseInt(companyId);
      if (!isNaN(parsedId)) {
        where.companyId = parsedId;
      }
    }
    if (role) {
      where.role = role.toUpperCase();
    }
    if (department) {
      where.department = {
        contains: department,
        mode: 'insensitive'
      };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } }
      ];
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

// POST /api/users
// Create a new user (ADMIN only)
router.post('/', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id, name, email, password, department, jobPosition, phone, companyId, role } = req.body;

    if (!id || !name || !email || !password || !department || !jobPosition || !companyId || !role) {
      return res.status(400).json({ error: 'All fields (Employee ID, Name, Email, Password, Department, Job Position, Company, and Role) are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Check if ID already exists
    const existingId = await prisma.user.findUnique({
      where: { id }
    });
    if (existingId) {
      return res.status(400).json({ error: 'Employee ID already exists.' });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        id,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        department,
        jobPosition,
        phone: phone || null,
        companyId: parseInt(companyId),
        role: role.toUpperCase()
      },
      include: {
        company: true
      }
    });

    const { password: _, ...safeUser } = newUser;
    res.status(201).json({
      message: `User ${safeUser.name} created successfully.`,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/password
// Reset user password (ADMIN only)
router.patch('/:id/password', verifyToken, checkRole(['ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ error: 'Password is required and must be at least 6 characters long.' });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id }
    });
    if (!userExists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    res.json({
      message: `Password for user ${userExists.name} (ID: ${id}) reset successfully.`
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/email
// Update user email (ADMIN and AGENT only)
router.patch('/:id/email', verifyToken, checkRole(['ADMIN', 'AGENT']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id }
    });
    if (!userExists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Restriction: IT Agents are not allowed to update the email address of Administrators
    if (userExists.role === 'ADMIN' && req.user.role === 'AGENT') {
      return res.status(403).json({ error: 'Access denied. IT Agents are not allowed to update the email address of an Administrator.' });
    }

    // Check if email already exists for another user
    const emailConflict = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        NOT: { id }
      }
    });
    if (emailConflict) {
      return res.status(400).json({ error: 'Email already in use by another user.' });
    }

    // Update email
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { email: email.toLowerCase() },
      include: { company: true }
    });

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'USER_EMAIL_UPDATED',
        details: `User "${userExists.name}" email updated from "${userExists.email}" to "${updatedUser.email}" by ${req.user.name}.`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    const { password, ...safeUser } = updatedUser;
    res.json({
      message: `Email for user ${safeUser.name} updated successfully.`,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/location
// Update user company/location (ADMIN and AGENT only)
router.patch('/:id/location', verifyToken, checkRole(['ADMIN', 'AGENT']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'Company/Location ID is required.' });
    }

    const parsedCompanyId = parseInt(companyId);
    if (isNaN(parsedCompanyId)) {
      return res.status(400).json({ error: 'Invalid Company/Location ID.' });
    }

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id },
      include: { company: true }
    });
    if (!userExists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Restriction: IT Agents are not allowed to update the location of Administrators
    if (userExists.role === 'ADMIN' && req.user.role === 'AGENT') {
      return res.status(403).json({ error: 'Access denied. IT Agents are not allowed to update the location of an Administrator.' });
    }

    // Verify company exists
    const companyExists = await prisma.company.findUnique({
      where: { id: parsedCompanyId }
    });
    if (!companyExists) {
      return res.status(404).json({ error: 'Company/Location branch not found.' });
    }

    // Update companyId
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { companyId: parsedCompanyId },
      include: { company: true }
    });

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'USER_LOCATION_UPDATED',
        details: `User "${userExists.name}" location updated from "${userExists.company.name} (${userExists.company.location})" to "${companyExists.name} (${companyExists.location})" by ${req.user.name}.`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    const { password, ...safeUser } = updatedUser;
    res.json({
      message: `Location for user ${safeUser.name} updated successfully.`,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
