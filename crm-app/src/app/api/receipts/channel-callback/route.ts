import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Status progression order — only allow upgrades, not downgrades
const STATUS_ORDER = ['pending', 'sent', 'delivered', 'opened', 'clicked', 'converted', 'failed'];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { campaignId, customerId, status, timestamp } = body;

    if (!campaignId || !customerId || !status) {
      return NextResponse.json({ error: "Missing required fields: campaignId, customerId, status" }, { status: 400 });
    }

    console.log(`[Callback] Received: campaign=${campaignId}, customer=${customerId}, status=${status}`);

    // 1. Always insert a communication_event (full audit log)
    try {
      await prisma.communicationEvent.create({
        data: {
          campaign_id: campaignId,
          customer_id: customerId,
          event_type: status,
          event_time: new Date(timestamp || Date.now())
        }
      });
      console.log(`[Callback] Event saved: ${status} for customer ${customerId}`);
    } catch (eventError: any) {
      console.error("[Callback] Event insert error:", eventError.message);
    }

    // 2. Update campaign_recipients status — only upgrade, never downgrade
    try {
      const existing = await prisma.campaignRecipient.findUnique({
        where: {
          campaign_id_customer_id: {
            campaign_id: campaignId,
            customer_id: customerId
          }
        },
        select: { status: true }
      });

      if (existing) {
        const currentIdx = STATUS_ORDER.indexOf(existing.status);
        const newIdx = STATUS_ORDER.indexOf(status);

        // Only update if new status is a progression
        if (newIdx > currentIdx && status !== 'failed') {
          await prisma.campaignRecipient.update({
            where: {
              campaign_id_customer_id: {
                campaign_id: campaignId,
                customer_id: customerId
              }
            },
            data: {
              status,
              last_event_at: new Date(timestamp || Date.now())
            }
          });
          console.log(`[Callback] Status updated: ${existing.status} → ${status} for customer ${customerId}`);
        } else if (status === 'failed' && existing.status === 'pending') {
          // Only mark failed if still pending
          await prisma.campaignRecipient.update({
            where: {
              campaign_id_customer_id: {
                campaign_id: campaignId,
                customer_id: customerId
              }
            },
            data: { status: 'failed', last_event_at: new Date(timestamp || Date.now()) }
          });
        } else {
          console.log(`[Callback] Skipping status update (${existing.status} → ${status}) — no progression`);
        }
      } else {
        console.warn(`[Callback] No recipient found for campaign=${campaignId}, customer=${customerId}`);
      }
    } catch (updateError: any) {
      console.error("[Callback] Status update error:", updateError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Callback] Endpoint error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
