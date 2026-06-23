const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find all assets with assetTag starting with RENT-
  const assets = await prisma.asset.findMany({
    where: {
      assetTag: {
        startsWith: 'RENT-'
      }
    }
  });

  console.log(`Found ${assets.length} assets with RENT- prefix.`);

  let updated = 0;
  for (const asset of assets) {
    const cleanTag = asset.assetTag.replace(/^RENT-/, '');
    
    // Check if cleanTag already exists
    const duplicate = await prisma.asset.findUnique({
      where: { assetTag: cleanTag }
    });

    if (duplicate) {
      console.log(`  Cannot update ${asset.assetTag} -> ${cleanTag} because target tag already exists.`);
      continue;
    }

    await prisma.asset.update({
      where: { id: asset.id },
      data: { assetTag: cleanTag }
    });
    console.log(`  Updated: ${asset.assetTag} -> ${cleanTag}`);
    updated++;
  }

  console.log(`Successfully cleaned ${updated} asset tags.`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
