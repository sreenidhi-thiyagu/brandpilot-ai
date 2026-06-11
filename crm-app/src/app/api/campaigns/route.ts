import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, goal, segment_id, channel, message_template } = body;

    if (!name) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }

    // If a segment_id was provided, verify it exists first to avoid FK crash
    if (segment_id) {
      const seg = await prisma.segment.findUnique({ where: { id: segment_id }, select: { id: true } });
      if (!seg) {
        return NextResponse.json({ error: `Segment '${segment_id}' not found. Please select a valid segment.` }, { status: 400 });
      }
    }

    const data = await prisma.campaign.create({
      data: {
        name,
        goal: goal || null,
        segment_id: segment_id || null,
        channel: channel || 'whatsapp',
        message_template: message_template || null,
        status: 'draft'
      }
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Campaign Create] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const data = await prisma.campaign.findMany({
      include: {
        segment: {
          select: { name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Remap to match previous Supabase shape `segments(name)`
    const remappedData = data.map(c => ({
      ...c,
      segments: c.segment ? { name: c.segment.name } : null
    }));

    return NextResponse.json(remappedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
