// One-way sync: Helpdesk Asset (RENTAL) -> GLC Apps (GA) device_rentals.
// Both apps share the same Postgres database, just different schemas ("helpdesk" vs
// "glc_mra"), so this talks to glc_mra directly via raw SQL through the existing
// Prisma connection. Best-effort: failures are logged but never block the caller's
// Asset create/update/delete flow.
const prisma = require('./db');

function normalizeName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\bpt\.?\s*/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSmartphoneAsset(asset) {
  const brand = (asset.brand || '').toLowerCase();
  const model = (asset.model || '').toLowerCase();
  const os = (asset.os || '').toLowerCase();
  const ram = (asset.ram || '').toLowerCase();
  return (brand === 'apple' && model.includes('iphone')) ||
    os.includes('ios') || os.includes('android') ||
    ['samsung', 'oppo', 'vivo', 'xiaomi', 'realme', 'infinix', 'iqoo'].includes(brand) ||
    ram.includes('4 gb') || ram.includes('4gb');
}

function monthsBetween(start, end) {
  const diffMs = new Date(end) - new Date(start);
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.44)));
}

async function resolveOrCreateCompanyMaster(masterName, sector) {
  if (!masterName) return null;
  const target = normalizeName(masterName);
  const all = await prisma.$queryRawUnsafe(`SELECT id, name FROM glc_mra.m_company_master`);
  const match = all.find(m => normalizeName(m.name) === target);
  if (match) return match.id;

  const inserted = await prisma.$queryRawUnsafe(
    `INSERT INTO glc_mra.m_company_master (name, sector, created_at) VALUES ($1, $2, NOW()) RETURNING id`,
    masterName, sector || 'GENERAL'
  );
  return inserted[0].id;
}

async function resolveOrCreateCompany(branchName, masterId) {
  if (!branchName) return null;
  const target = normalizeName(branchName);
  const all = await prisma.$queryRawUnsafe(`SELECT id, name FROM glc_mra.m_company`);
  const match = all.find(m => normalizeName(m.name) === target);
  if (match) return match.id;

  const inserted = await prisma.$queryRawUnsafe(
    `INSERT INTO glc_mra.m_company (name, company_master_id, is_active, created_at) VALUES ($1, $2, true, NOW()) RETURNING id`,
    branchName, masterId
  );
  return inserted[0].id;
}

async function resolveOrCreateVendor(vendorName) {
  if (!vendorName) return null;
  const target = normalizeName(vendorName);
  const all = await prisma.$queryRawUnsafe(`SELECT id, vendor_name FROM glc_mra.vendors`);
  const match = all.find(v => normalizeName(v.vendor_name) === target);
  if (match) return match.id;

  const inserted = await prisma.$queryRawUnsafe(
    `INSERT INTO glc_mra.vendors (vendor_name) VALUES ($1) RETURNING id`,
    vendorName
  );
  return inserted[0].id;
}

async function resolveUserId(email) {
  if (!email) return null;
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id FROM glc_mra.m_user WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    email
  );
  return rows.length > 0 ? rows[0].id : null;
}

// Pushes/updates one Helpdesk Asset into GA's device_rentals. No-op for OWNED assets
// (GA's device_rentals concept is rental-only) and for assets without a valid asset id.
async function syncAssetToGA(assetId) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { company: true, companyMaster: true, user: true }
    });
    if (!asset || asset.ownershipType !== 'RENTAL') return;

    if (asset.status === 'DISPOSED') {
      await deleteAssetFromGA(asset.assetTag);
      return;
    }

    const masterId = await resolveOrCreateCompanyMaster(asset.companyMaster?.name, asset.companyMaster?.sector);
    const companyId = await resolveOrCreateCompany(asset.company?.name || asset.companyMaster?.name, masterId);
    const vendorId = await resolveOrCreateVendor(asset.vendor);
    const userId = await resolveUserId(asset.user?.email);

    const deviceType = isSmartphoneAsset(asset) ? 'Smartphone' : 'Laptop';
    const itemName = `${asset.brand} ${asset.model}`.trim();
    const durationMonths = monthsBetween(asset.rentalStart, asset.rentalEnd);
    const department = asset.user?.department || null;
    const orderId = asset.vendorRef || asset.deviceRef || null;

    if (!companyId) {
      console.error(`GA sync skipped for asset ${asset.assetTag}: no resolvable company.`);
      return;
    }

    const existing = await prisma.$queryRawUnsafe(
      `SELECT id FROM glc_mra.device_rentals WHERE LOWER(TRIM(unit_code)) = LOWER(TRIM($1)) LIMIT 1`,
      asset.assetTag
    );

    if (existing.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE glc_mra.device_rentals SET
           company_id = $1, vendor_id = $2, device_type = $3, order_id = $4, item_name = $5,
           price = $6, duration_months = $7, start_rent = $8, end_rent = $9, user_id = $10,
           department = $11, status = $12
         WHERE id = $13`,
        companyId, vendorId, deviceType, orderId, itemName, asset.rentalCost, durationMonths,
        asset.rentalStart, asset.rentalEnd, userId, department, 'Active', existing[0].id
      );
    } else {
      await prisma.$executeRawUnsafe(
        `INSERT INTO glc_mra.device_rentals
           (company_id, vendor_id, device_type, order_id, item_name, price, unit_code, duration_months, start_rent, end_rent, user_id, department, status, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())`,
        companyId, vendorId, deviceType, orderId, itemName, asset.rentalCost, asset.assetTag, durationMonths,
        asset.rentalStart, asset.rentalEnd, userId, department, 'Active'
      );
    }
  } catch (err) {
    console.error(`GA sync failed for asset ${assetId}:`, err.message);
  }
}

async function deleteAssetFromGA(assetTag) {
  try {
    if (!assetTag) return;
    await prisma.$executeRawUnsafe(
      `DELETE FROM glc_mra.device_rentals WHERE LOWER(TRIM(unit_code)) = LOWER(TRIM($1))`,
      assetTag
    );
  } catch (err) {
    console.error(`GA delete-sync failed for assetTag ${assetTag}:`, err.message);
  }
}

module.exports = { syncAssetToGA, deleteAssetFromGA };
