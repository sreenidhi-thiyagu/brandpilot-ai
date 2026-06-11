const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const campaigns = await prisma.campaign.findMany({
    include: { campaignRecipients: true },
    orderBy: { created_at: 'desc' },
    take: 1
  });
  if (campaigns.length === 0) return;
  const campaign = campaigns[0];
  console.log('Campaign:', campaign.name);
  for (const rec of campaign.campaignRecipients) {
    // Simulate Sent
    await fetch('https://brandpilot-ai-nu.vercel.app/api/receipts/channel-callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: campaign.id, customerId: rec.customer_id, status: 'sent' })
    });
    // Simulate Delivered
    await fetch('https://brandpilot-ai-nu.vercel.app/api/receipts/channel-callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId: campaign.id, customerId: rec.customer_id, status: 'delivered' })
    });
    // Simulate Opened (only 40% of them)
    if (Math.random() > 0.6) {
      await fetch('https://brandpilot-ai-nu.vercel.app/api/receipts/channel-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, customerId: rec.customer_id, status: 'opened' })
      });
    }
  }
  console.log('Simulated Render callback for', campaign.campaignRecipients.length, 'recipients');
}
main().catch(console.error).finally(() => prisma.$disconnect());
