const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const campaigns = await prisma.campaign.findMany({
    include: { campaignRecipients: true }
  });
  
  for (const campaign of campaigns) {
    // Only simulate if they are currently all pending
    const allPending = campaign.campaignRecipients.every(r => r.status === 'pending');
    if (!allPending || campaign.campaignRecipients.length === 0) continue;

    console.log(`Simulating for: ${campaign.name} (${campaign.campaignRecipients.length} recipients)`);
    for (const rec of campaign.campaignRecipients) {
      await fetch('https://brandpilot-ai-nu.vercel.app/api/receipts/channel-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, customerId: rec.customer_id, status: 'sent' })
      });
      await fetch('https://brandpilot-ai-nu.vercel.app/api/receipts/channel-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: campaign.id, customerId: rec.customer_id, status: 'delivered' })
      });
      if (Math.random() > 0.6) {
        await fetch('https://brandpilot-ai-nu.vercel.app/api/receipts/channel-callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaignId: campaign.id, customerId: rec.customer_id, status: 'opened' })
        });
      }
    }
  }
  console.log('Finished simulating all campaigns!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
