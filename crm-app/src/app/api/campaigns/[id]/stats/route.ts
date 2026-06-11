import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const recipients = await prisma.campaignRecipient.findMany({
      where: { campaign_id: campaignId },
      select: { status: true }
    });

    // Funnel model: each status implies all upstream statuses
    // pending < sent < delivered < opened < clicked < converted
    const FUNNEL_ORDER = ['pending', 'sent', 'delivered', 'opened', 'clicked', 'converted'];
    const counts: Record<string, number> = {
      total: recipients.length,
      pending: 0, sent: 0, delivered: 0, failed: 0,
      opened: 0, clicked: 0, converted: 0
    };

    recipients.forEach(r => {
      const status = r.status;
      if (status === 'failed') { counts.failed++; counts.sent++; return; }
      // Add to all stages up to and including the current stage
      const idx = FUNNEL_ORDER.indexOf(status);
      if (idx >= 0) {
        for (let i = 1; i <= idx; i++) { // skip 'pending'
          const s = FUNNEL_ORDER[i];
          if (counts[s] !== undefined) counts[s]++;
        }
      }
    });

    console.log(`[Stats] Campaign ${campaignId}: total=${counts.total}, sent=${counts.sent}, delivered=${counts.delivered}, opened=${counts.opened}, clicked=${counts.clicked}, converted=${counts.converted}`);

    return NextResponse.json({ campaign, stats: counts });
  } catch (error: any) {
    console.error("[Stats] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
