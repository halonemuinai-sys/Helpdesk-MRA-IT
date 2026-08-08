const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCompanyMasters() {
  try {
    console.log('Seeding 4 main MRA Company Masters...');

    const mainCompanies = [
      { code: 'MOGEMS', name: 'PT Mogems Putri Int', description: 'Entitas Ritel Perhiasan Luxury (Bvlgari)' },
      { code: 'PERMATA', name: 'PT Permata Landmarq Abadi', description: 'Entitas Pengelola Properti & Aset Sewa Group MRA' },
      { code: 'JEMMA', name: 'PT Jemma Putri Int', description: 'Entitas Ritel Lifestyle (Wiggle Wiggle)' },
      { code: 'AMANDA', name: 'PT Amanda Arumdhani', description: 'Entitas Media, Majalah & Penyiaran (Cosmopolitan, Harper\'s Bazaar)' }
    ];

    for (const comp of mainCompanies) {
      const existing = await prisma.companyMaster.findFirst({
        where: {
          name: { contains: comp.name.split(' ')[1], mode: 'insensitive' }
        }
      });

      if (!existing) {
        await prisma.companyMaster.create({
          data: comp
        });
        console.log(`✓ Ditambahkan: ${comp.name}`);
      } else {
        console.log(`- Sudah ada: ${existing.name}`);
      }
    }

    console.log('Selesai menyelaraskan 4 PT MRA Company Masters!');
  } catch (err) {
    console.error('Error seeding company masters:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedCompanyMasters();
