const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { name: 'HighValueThankYouWhatsApp' },
    include: { campaignRecipients: true }
  });
  if (!campaign) return console.log('Not found');
  console.log('Campaign:', campaign.name);
  const stats = campaign.campaignRecipients.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});
  console.log('Stats:', stats);
}
main().catch(console.error).finally(() => prisma.$disconnect());
