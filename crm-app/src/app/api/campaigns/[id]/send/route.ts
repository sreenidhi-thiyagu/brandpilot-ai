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

    // 5. Send to Channel Service with Batching, Retries, and Error Handling
    const CHUNK_SIZE = 20;
    const MAX_RETRIES = 3;

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const sendWithRetry = async (rec: any, cust: any, attempt = 1): Promise<boolean> => {
      const contact = campaign.channel === 'email' ? cust.email : cust.phone;
      
      try {
        const response = await fetch(`${CHANNEL_SERVICE_URL}/send`, {
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
        });

        if (response.ok) return true;
        
        // Handle 5xx errors by retrying
        if (response.status >= 500 && attempt <= MAX_RETRIES) {
          console.warn(`[Send] Channel service 5xx for ${rec.customer_id}, attempt ${attempt}`);
          throw new Error('Server Error');
        }
        
        // 4xx errors are permanent failures
        console.warn(`[Send] Permanent failure for ${rec.customer_id}: ${response.status}`);
        return false;
      } catch (err: any) {
        if (attempt <= MAX_RETRIES) {
          // Exponential backoff: 500ms, 1000ms, 2000ms
          await sleep(500 * Math.pow(2, attempt - 1));
          return sendWithRetry(rec, cust, attempt + 1);
        }
        console.error(`[Send] Exhausted retries for ${rec.customer_id}:`, err.message);
        return false;
      }
    };

    let channelSuccessCount = 0;
    let failedCount = 0;

    // Process in batches to prevent overwhelming the Node.js event loop or Channel Service
    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      
      const batchPromises = chunk.map(async (rec) => {
        const cust = segmentCustomers.find(sc => sc.customer_id === rec.customer_id)?.customer;
        if (!cust) return false;
        
        const success = await sendWithRetry(rec, cust);
        if (success) {
          channelSuccessCount++;
        } else {
          failedCount++;
          // Mark as failed in DB if permanently failed
          await prisma.campaignRecipient.update({
            where: {
              campaign_id_customer_id: {
                campaign_id: campaign.id,
                customer_id: rec.customer_id
              }
            },
            data: { status: 'failed', last_event_at: new Date() }
          });
        }
      });

      await Promise.all(batchPromises);
    }

    console.log(`[Send] Campaign ${campaignId} dispatched. ${recipients.length} recipients queued.`);
    return NextResponse.json({ success: true, sentCount: recipients.length });
  } catch (error: any) {
    console.error("[Send] Campaign send error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
