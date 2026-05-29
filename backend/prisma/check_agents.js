require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.user.findMany({
    where: { role: 'AGENT' },
    select: {
      id: true,
      name: true,
      jobPosition: true,
      department: true,
      company: { select: { name: true } }
    }
  });

  console.log(`Currently there are ${agents.length} agents in the database:`);
  agents.forEach((ag, i) => {
    console.log(`${i+1}. ${ag.name} - ${ag.jobPosition} (${ag.department} di ${ag.company.name}) [ID: ${ag.id}]`);
  });
}

main().finally(() => prisma.$disconnect());
