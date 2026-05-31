const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'cleaned_assets_for_import.json');

async function main() {
  console.log('Starting cleaned lease assets import...');

  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: JSON file not found at ${jsonPath}`);
    process.exit(1);
  }

  const assets = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Loaded ${assets.length} assets to import.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (const asset of assets) {
    const startRentDate = new Date(asset.rentalStart);
    const endRentDate = new Date(asset.rentalEnd);

    // Prepare data object
    const data = {
      assetTag: asset.assetTag,
      deviceRef: asset.deviceRef,
      vendorRef: asset.vendorRef,
      brand: asset.brand,
      model: asset.model,
      processor: asset.processor,
      ram: asset.ram,
      storage: asset.storage,
      os: asset.os,
      office: asset.office,
      ownershipType: asset.ownershipType,
      status: asset.status,
      rentalCost: asset.rentalCost,
      rentalStart: startRentDate,
      rentalEnd: endRentDate,
      notes: asset.notes,
      journey: asset.notes ? `${new Date().toISOString().split('T')[0]}: ${asset.notes}` : "",
      // Connect relations
      user: asset.userId ? { connect: { id: asset.userId } } : undefined,
      company: asset.companyId ? { connect: { id: asset.companyId } } : undefined,
      companyMaster: asset.companyMasterId ? { connect: { id: asset.companyMasterId } } : undefined,
    };

    // Find if it exists to classify as created or updated by assetTag or deviceRef
    const existing = await prisma.asset.findFirst({
      where: {
        OR: [
          { assetTag: asset.assetTag },
          ...(asset.deviceRef ? [{ deviceRef: asset.deviceRef }] : [])
        ]
      }
    });

    if (existing) {
      // Update by unique ID to prevent unique constraint failures
      await prisma.asset.update({
        where: { id: existing.id },
        data: {
          assetTag: existing.assetTag.startsWith('RENT-') ? existing.assetTag : data.assetTag,
          deviceRef: data.deviceRef,
          vendorRef: data.vendorRef,
          brand: data.brand,
          model: data.model,
          processor: data.processor,
          ram: data.ram,
          storage: data.storage,
          os: data.os,
          office: data.office,
          ownershipType: data.ownershipType,
          status: data.status,
          rentalCost: data.rentalCost,
          rentalStart: data.rentalStart,
          rentalEnd: data.rentalEnd,
          notes: data.notes,
          user: asset.userId ? { connect: { id: asset.userId } } : { disconnect: true },
          company: asset.companyId ? { connect: { id: asset.companyId } } : { disconnect: true },
          companyMaster: asset.companyMasterId ? { connect: { id: asset.companyMasterId } } : { disconnect: true },
        }
      });
      updatedCount++;
    } else {
      await prisma.asset.create({
        data: data
      });
      createdCount++;
    }
  }

  console.log('--- Import Summary ---');
  console.log(`Total processed: ${assets.length}`);
  console.log(`Assets created: ${createdCount}`);
  console.log(`Assets updated: ${updatedCount}`);
  console.log('✅ Import completed successfully!');
}

main()
  .catch(e => {
    console.error('Error importing assets:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
