const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const recent = await prisma.campaign.findMany({
    include: { campaignRecipients: true },
    orderBy: { created_at: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(recent.map(c => ({
    name: c.name,
    time: c.created_at,
    stats: c.campaignRecipients.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {})
  })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
