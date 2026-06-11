import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customersCount = await prisma.customer.count();
    const ordersCount = await prisma.order.count();
    const campaignsCount = await prisma.campaign.count();
    const messagesSent = await prisma.campaignRecipient.count();

    const recipients = await prisma.campaignRecipient.findMany({ select: { status: true } });
    
    let delivered = 0, opened = 0, clicked = 0, converted = 0;
    
    if (recipients) {
      recipients.forEach(r => {
        if (['delivered', 'opened', 'clicked', 'converted'].includes(r.status)) delivered++;
        if (['opened', 'clicked', 'converted'].includes(r.status)) opened++;
        if (['clicked', 'converted'].includes(r.status)) clicked++;
        if (r.status === 'converted') converted++;
      });
    }

    const total = recipients?.length || 1; // avoid div by 0

    return NextResponse.json({
      customers: customersCount || 0,
      orders: ordersCount || 0,
      campaigns: campaignsCount || 0,
      messages: messagesSent || 0,
      deliveryRate: ((delivered / total) * 100).toFixed(1),
      openRate: ((opened / total) * 100).toFixed(1),
      clickRate: ((clicked / total) * 100).toFixed(1),
      conversionRate: ((converted / total) * 100).toFixed(1),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
