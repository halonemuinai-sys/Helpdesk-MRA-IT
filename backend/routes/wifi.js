const express = require('express');
const prisma = require('../api/db');
const { verifyToken } = require('../api/authMiddleware');

const router = express.Router();

// GET /api/wifi
// Lists all registered Wi-Fi APs, optionally filtered by companyId
router.get('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { companyId } = req.query;
    const where = {};
    if (companyId && companyId !== 'undefined' && companyId !== 'null' && companyId !== '') {
      const parsedId = parseInt(companyId);
      if (!isNaN(parsedId)) {
        where.companyId = parsedId;
      }
    }
    const wifiAPs = await prisma.wifiAccessPoint.findMany({
      where,
      include: {
        company: {
          select: { name: true, location: true }
        }
      },
      orderBy: { ssid: 'asc' }
    });
    res.json(wifiAPs);
  } catch (err) {
    next(err);
  }
});

// POST /api/wifi
// Creates a new Wi-Fi AP manual record
router.post('/', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { bssid, ssid, password, location, companyId, ipAddress, vendor, modelName, frequency, channel, securityType, status } = req.body;
    
    if (!bssid || !ssid || !location || !companyId) {
      return res.status(400).json({ error: 'BSSID, SSID, Location, and Company are required.' });
    }

    // Clean and validate MAC Address (BSSID) format
    const cleanedBssid = bssid.trim().toLowerCase();
    const macRegex = /^([0-9a-f]{2}[:-]){5}([0-9a-f]{2})$/;
    if (!macRegex.test(cleanedBssid)) {
      return res.status(400).json({ error: 'Invalid MAC Address (BSSID) format. Standard format: xx:xx:xx:xx:xx:xx' });
    }

    // Check if BSSID exists
    const existing = await prisma.wifiAccessPoint.findUnique({
      where: { bssid: cleanedBssid }
    });
    if (existing) {
      return res.status(400).json({ error: 'MAC Address (BSSID) already registered in database.' });
    }

    const ap = await prisma.wifiAccessPoint.create({
      data: {
        bssid: cleanedBssid,
        ssid,
        password: password ? password.trim() : "",
        location,
        companyId: parseInt(companyId),
        ipAddress: ipAddress ? ipAddress.trim() : null,
        vendor: vendor ? vendor.trim() : null,
        modelName: modelName ? modelName.trim() : null,
        frequency: frequency || '5GHz',
        channel: channel ? parseInt(channel) : null,
        securityType: securityType || 'WPA2-Enterprise',
        status: status || 'ACTIVE'
      }
    });

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'WIFI_AP_CREATED',
        details: `Wi-Fi AP SSID: ${ap.ssid} (BSSID: ${ap.bssid}) created at location ${ap.location}.`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(ap);
  } catch (err) {
    next(err);
  }
});

// PUT /api/wifi/:id
// Updates an existing Wi-Fi AP record
router.put('/:id', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const { bssid, ssid, password, location, companyId, ipAddress, vendor, modelName, frequency, channel, securityType, status } = req.body;

    const updateData = {};
    if (ssid !== undefined) updateData.ssid = ssid;
    if (password !== undefined) updateData.password = password ? password.trim() : "";
    if (location !== undefined) updateData.location = location;
    if (companyId !== undefined) updateData.companyId = parseInt(companyId);
    if (ipAddress !== undefined) updateData.ipAddress = ipAddress ? ipAddress.trim() : null;
    if (vendor !== undefined) updateData.vendor = vendor ? vendor.trim() : null;
    if (modelName !== undefined) updateData.modelName = modelName ? modelName.trim() : null;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (channel !== undefined) updateData.channel = channel ? parseInt(channel) : null;
    if (securityType !== undefined) updateData.securityType = securityType;
    if (status !== undefined) updateData.status = status;

    if (bssid !== undefined) {
      const cleanedBssid = bssid.trim().toLowerCase();
      const macRegex = /^([0-9a-f]{2}[:-]){5}([0-9a-f]{2})$/;
      if (!macRegex.test(cleanedBssid)) {
        return res.status(400).json({ error: 'Invalid MAC Address (BSSID) format. Standard format: xx:xx:xx:xx:xx:xx' });
      }
      
      // Check if BSSID is used by another record
      const existing = await prisma.wifiAccessPoint.findUnique({
        where: { bssid: cleanedBssid }
      });
      if (existing && existing.id !== id) {
        return res.status(400).json({ error: 'MAC Address (BSSID) is already registered under another record.' });
      }
      updateData.bssid = cleanedBssid;
    }

    const ap = await prisma.wifiAccessPoint.update({
      where: { id },
      data: updateData
    });

    // Write system log
    await prisma.systemAuditLog.create({
      data: {
        action: 'WIFI_AP_UPDATED',
        details: `Wi-Fi AP SSID: ${ap.ssid} (BSSID: ${ap.bssid}) updated. Status: ${ap.status}`,
        performedBy: `${req.user.name} (${req.user.email})`
      }
    }).catch(err => console.error("Failed to log audit event:", err));

    res.json(ap);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/wifi/:id
// Deletes a Wi-Fi AP record (ADMIN deletes immediately, AGENT creates an ApprovalRequest)
router.delete('/:id', verifyToken, async (req, res, next) => {
  try {
    const { role, id: userId, name: userName, email: userEmail } = req.user;
    if (role === 'USER') {
      return res.status(403).json({ error: 'Access denied.' });
    }
    const { id } = req.params;
    const { reason } = req.body;

    const ap = await prisma.wifiAccessPoint.findUnique({ where: { id } });
    if (!ap) {
      return res.status(404).json({ error: 'Wifi AP not found.' });
    }

    if (role === 'ADMIN') {
      await prisma.wifiAccessPoint.delete({
        where: { id }
      });
      
      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'WIFI_AP_DELETED',
          details: `Wi-Fi AP SSID ${ap.ssid} (${ap.location}) deleted directly by Admin.`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({ success: true, message: 'Wifi AP deleted successfully.' });
    } else {
      // AGENT: create approval request
      const request = await prisma.approvalRequest.create({
        data: {
          entityType: 'WIFI_AP',
          entityId: id,
          entityName: `${ap.ssid} (${ap.location})`,
          reason: reason || 'No reason provided',
          requestedById: userId
        }
      });

      // Write system log
      await prisma.systemAuditLog.create({
        data: {
          action: 'WIFI_AP_DELETE_REQUESTED',
          details: `Delete approval requested for Wi-Fi AP SSID ${ap.ssid} (${ap.location}). Reason: ${reason || '-'}`,
          performedBy: `${userName} (${userEmail})`
        }
      });

      return res.json({ 
        success: true, 
        approvalPending: true, 
        message: 'Permintaan penghapusan AP Wi-Fi telah diajukan ke Admin untuk persetujuan.',
        request 
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
