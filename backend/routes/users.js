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
// Create a new user (ADMIN and AGENT only)
router.post('/', verifyToken, checkRole(['ADMIN', 'AGENT']), async (req, res, next) => {
  try {
    const { id, name, email, password, department, jobPosition, phone, companyId, role } = req.body;

    if (!id || !name || !email || !department || !jobPosition || !companyId) {
      return res.status(400).json({ error: 'All fields (Employee ID, Name, Email, Department, Job Position, and Company) are required.' });
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

    // Determine default role & password
    const userRole = req.user.role === 'ADMIN' ? (role || 'USER').toUpperCase() : 'USER';
    const rawPassword = password || 'Password123!';

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

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
        role: userRole
      },
      include: {
        company: true
      }
    });

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'USER_CREATED',
        details: `User "${newUser.name}" (ID: ${newUser.id}, Role: ${newUser.role}) created at location "${newUser.company.name} (${newUser.company.location})" by ${req.user.name}.`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

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

// PUT /api/users/:id or PATCH /api/users/:id/profile
// Update user profile details (Employee ID, Name, Department, Job Position)
const updateUserProfileHandler = async (req, res, next) => {
  try {
    const currentId = req.params.id;
    const { newId, name, department, jobPosition } = req.body;

    if (!name || !name.trim() || !department || !department.trim() || !jobPosition || !jobPosition.trim()) {
      return res.status(400).json({ error: 'Full Name, Department, and Job Position are required fields.' });
    }

    const targetId = (newId && newId.trim()) ? newId.trim() : currentId;

    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: currentId },
      include: { company: true }
    });
    if (!userExists) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Restriction: IT Agents are not allowed to update Administrators
    if (userExists.role === 'ADMIN' && req.user.role === 'AGENT') {
      return res.status(403).json({ error: 'Access denied. IT Agents are not allowed to update details of an Administrator.' });
    }

    // If Employee ID is changing, check if new ID is already taken
    if (targetId !== currentId) {
      const duplicateId = await prisma.user.findUnique({
        where: { id: targetId }
      });
      if (duplicateId) {
        return res.status(400).json({ error: `Employee ID '${targetId}' is already in use by another user.` });
      }
    }

    let updatedUser;
    if (targetId !== currentId) {
      // Use transaction to update FKs and User ID
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`UPDATE glc_mra.marketing_plans SET creator_id = $1 WHERE creator_id = $2`, targetId, currentId).catch(() => {});
        await tx.$executeRawUnsafe(`UPDATE glc_mra.payment_requests SET creator_id = $1 WHERE creator_id = $2`, targetId, currentId).catch(() => {});
        await tx.$executeRawUnsafe(`UPDATE glc_mra.approval_history SET approver_id = $1 WHERE approver_id = $2`, targetId, currentId).catch(() => {});
        await tx.$executeRawUnsafe(`UPDATE glc_mra.marketing_plan_amendments SET creator_id = $1 WHERE creator_id = $2`, targetId, currentId).catch(() => {});
        await tx.$executeRawUnsafe(`UPDATE glc_mra.device_rentals SET user_id = $1 WHERE user_id = $2`, targetId, currentId).catch(() => {});

        // Update User row
        await tx.$executeRawUnsafe(
          `UPDATE "User" SET id = $1, name = $2, department = $3, "jobPosition" = $4 WHERE id = $5`,
          targetId, name.trim(), department.trim(), jobPosition.trim(), currentId
        );
      });

      updatedUser = await prisma.user.findUnique({
        where: { id: targetId },
        include: { company: true }
      });
    } else {
      updatedUser = await prisma.user.update({
        where: { id: currentId },
        data: {
          name: name.trim(),
          department: department.trim(),
          jobPosition: jobPosition.trim()
        },
        include: { company: true }
      });
    }

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'USER_PROFILE_UPDATED',
        details: `User profile updated for "${updatedUser.name}" (ID: ${currentId}${targetId !== currentId ? ` -> ${targetId}` : ''}, Dept: "${updatedUser.department}", Position: "${updatedUser.jobPosition}") by ${req.user.name}.`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    const { password, ...safeUser } = updatedUser;
    res.json({
      message: `User ${safeUser.name} profile updated successfully.`,
      user: safeUser
    });
  } catch (err) {
    next(err);
  }
};

router.put('/:id', verifyToken, checkRole(['ADMIN', 'AGENT']), updateUserProfileHandler);
router.patch('/:id/profile', verifyToken, checkRole(['ADMIN', 'AGENT']), updateUserProfileHandler);

// GET /api/users/:id
// Get user by ID (verifyToken)
router.get('/:id', verifyToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const userTarget = await prisma.user.findUnique({
      where: { id },
      include: { company: true }
    });
    if (!userTarget) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const { password, ...safeUser } = userTarget;
    res.json(safeUser);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

