const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all assets without vendor
  const assets = await prisma.asset.findMany({
    select: { id: true, vendorRef: true, vendor: true, brand: true, model: true, os: true, ram: true }
  });

  const noVendor = assets.filter(a => !a.vendor);
  console.log('Total assets:', assets.length);
  console.log('Without vendor:', noVendor.length);

  // Show current data
  noVendor.forEach(a => console.log(`  ${a.vendorRef || 'NULL'} | ${a.brand} ${a.model}`));

  // Update based on vendorRef prefix ASN = PT Teknologi Skoring Nusantara
  // Otherwise use the smartphone detection logic
  let updated = 0;
  for (const asset of noVendor) {
    let vendorName;
    
    if (asset.vendorRef && asset.vendorRef.startsWith('ASN')) {
      vendorName = 'PT Teknologi Skoring Nusantara';
    } else {
      // Smartphone detection fallback
      const brand = (asset.brand || '').toLowerCase();
      const model = (asset.model || '').toLowerCase();
      const os = (asset.os || '').toLowerCase();
      const ram = (asset.ram || '').toLowerCase();
      const isSmartphone = (brand === 'apple' && model.includes('iphone')) ||
                           os.includes('ios') || os.includes('android') ||
                           brand === 'samsung' || brand === 'oppo' ||
                           brand === 'vivo' || brand === 'xiaomi' ||
                           brand === 'realme' || brand === 'infinix' || brand === 'iqoo' ||
                           parseInt(ram, 10) === 4;

      if (isSmartphone) {
        vendorName = 'PT Permata Landmarq Abadi';
      } else {
        vendorName = 'PT Teknologi Skoring Nusantara';
      }
    }

    await prisma.asset.update({
      where: { id: asset.id },
      data: { vendor: vendorName }
    });
    updated++;
    console.log(`  Updated: ${asset.brand} ${asset.model} -> ${vendorName}`);
  }

  console.log(`\nDone! Updated ${updated} assets.`);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
