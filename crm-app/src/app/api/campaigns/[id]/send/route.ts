import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || "http://localhost:4000";
const CRM_CALLBACK_URL = process.env.CRM_CALLBACK_URL || "http://localhost:3000/api/receipts/channel-callback";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: campaignId } = await params;
    console.log(`[Send] Campaign send started: ${campaignId}`);

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
    if (campaign.status !== 'draft') {
      return NextResponse.json({ error: "Campaign already sent or not in draft state" }, { status: 400 });
    }
    if (!campaign.segment_id) {
      return NextResponse.json({ error: "Campaign has no segment assigned" }, { status: 400 });
    }

    // 2. Get segment customers
    const segmentCustomers = await prisma.segmentCustomer.findMany({
      where: { segment_id: campaign.segment_id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } }
      }
    });

    if (!segmentCustomers || segmentCustomers.length === 0) {
      return NextResponse.json({ error: "No customers in this segment. Please re-create the segment after seeding data." }, { status: 400 });
    }

    console.log(`[Send] Dispatching to ${segmentCustomers.length} recipients`);

    // 3. Create campaign_recipients
    const recipients = segmentCustomers.map(sc => {
      const cust = sc.customer;
      const personalized = (campaign.message_template || "Hi {{name}}, check out our latest offers!")
        .replace(/\{\{name\}\}/g, cust.name || 'there');
      return {
        campaign_id: campaign.id,
        customer_id: sc.customer_id,
        personalized_message: personalized,
        status: 'pending'
      };
    });

    await prisma.campaignRecipient.createMany({
      data: recipients
    });

    // 4. Update campaign status
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'sent', sent_at: new Date() }
    });

    // 5. Fire and forget: send to Channel Service
    let channelSuccessCount = 0;
    for (const rec of recipients) {
      const cust = segmentCustomers.find(sc => sc.customer_id === rec.customer_id)?.customer;
      if (!cust) continue;

      const contact = campaign.channel === 'email' ? cust.email : cust.phone;

      fetch(`${CHANNEL_SERVICE_URL}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          customerId: rec.customer_id,
          recipient: contact,
          channel: campaign.channel,
          message: rec.personalized_message,
          callbackUrl: CRM_CALLBACK_URL
        })
      })
        .then(r => {
          if (r.ok) channelSuccessCount++;
          else console.warn(`[Send] Channel service non-OK for customer ${rec.customer_id}: ${r.status}`);
        })
        .catch(err => console.error(`[Send] Channel service unreachable for ${rec.customer_id}:`, err.message));
    }

    console.log(`[Send] Campaign ${campaignId} dispatched. ${recipients.length} recipients queued.`);
    return NextResponse.json({ success: true, sentCount: recipients.length });
  } catch (error: any) {
    console.error("[Send] Campaign send error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
