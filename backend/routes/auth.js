const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../api/db');
const { verifyToken, JWT_SECRET } = require('../api/authMiddleware');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { company: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Only allow AGENT and ADMIN roles to login to the dashboard
    if (user.role === 'USER') {
      return res.status(403).json({ error: 'Akses ditolak. Karyawan biasa tidak diperbolehkan masuk ke dashboard IT.' });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        companyName: user.company.name,
        companyLocation: user.company.location,
        department: user.department
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user info and token (excluding password)
    const { password: _, ...userData } = user;
    res.json({
      token,
      user: userData
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { company: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { password: _, ...userData } = user;
    res.json(userData);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/forgot-password
// Initiate password reset flow (prints token in console for local dev, sends email in production via SMTP)
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { company: true }
    });

    // For security, don't disclose user existence
    if (!user) {
      return res.json({
        message: 'If the email is registered in our system, a password reset instruction has been sent.'
      });
    }

    // Generate token valid for 1 hour
    const resetToken = jwt.sign(
      { id: user.id, email: user.email, action: 'RESET_PASSWORD' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Dynamic reset link depending on environment (falls back to local port)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

    console.log('====================================');
    console.log('PASSWORD RESET REQUESTED FOR:', user.email);
    console.log('RESET LINK:', resetLink);
    console.log('====================================');

    // Send SMTP email if configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: `"IT Helpdesk MRA" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: 'IT Helpdesk - Password Reset Request',
          html: `
            <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 500px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <h2 style="color: #4f46e5; margin-top: 0;">Password Reset Request</h2>
              <p>Hi ${user.name},</p>
              <p>We received a request to reset your password. Click the button below to set a new password. This link is valid for 1 hour.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: bold;">Reset Password</a>
              </div>
              <p style="color: #64748b; font-size: 13px;">If you did not request this, please ignore this email. Your password will remain unchanged.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 24px;" />
              <p style="color: #94a3b8; font-size: 11px; margin-bottom: 0;">PT MRA Group Corporate IT Helpdesk System</p>
            </div>
          `
        });
      } catch (mailErr) {
        console.error("Failed to send reset email:", mailErr);
      }
    }

    res.json({
      message: 'If the email is registered in our system, a password reset instruction has been sent.'
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/reset-password
// Performs password update using valid reset token
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    if (decoded.action !== 'RESET_PASSWORD') {
      return res.status(400).json({ error: 'Invalid token action.' });
    }

    // Check user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    if (!user) {
      return res.status(404).json({ error: 'User no longer exists.' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password has been reset successfully. You can now login.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
