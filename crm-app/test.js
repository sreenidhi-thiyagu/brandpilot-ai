const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const campaigns = await prisma.campaign.findMany({
    include: { campaignRecipients: true },
    orderBy: { created_at: 'desc' },
    take: 3
  });
  console.log(JSON.stringify(campaigns.map(c => ({ name: c.name, recipients: c.campaignRecipients.map(r => r.status) })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
