import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ai, MODEL_NAME } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json({ error: "AI key not configured." }, { status: 400 });
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const systemInstruction = `You are an AI assistant for a Mini CRM. Your job is to convert natural language queries into a JSON object representing segment rules.
Available rules:
- city (string)
- preferred_category (string)
- min_total_spent (number)
- inactive_days (number)

Output pure JSON matching this structure:
{
  "name": "Short descriptive name",
  "description": "Short explanation",
  "rules": {
     // include only the rules that apply
  }
}
Do not include markdown blocks or any other text. Only valid JSON.`;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    });

    const text = result.text || "";
    let aiResponse;
    try {
      aiResponse = JSON.parse(text);
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        aiResponse = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    const { name, description, rules } = aiResponse;

    const where: any = {};
    if (rules.city) {
      where.city = { contains: rules.city, mode: 'insensitive' };
    }
    if (rules.preferred_category) {
      where.preferred_category = { contains: rules.preferred_category, mode: 'insensitive' };
    }
    if (rules.min_total_spent !== undefined) {
      where.total_spent = { gte: rules.min_total_spent };
    }

    const matchedCustomers = await prisma.customer.findMany({
      where,
      select: { id: true, last_purchase_date: true, total_spent: true }
    });

    let finalCustomers = matchedCustomers || [];
    if (rules.inactive_days !== undefined) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - rules.inactive_days);
      finalCustomers = finalCustomers.filter(c => {
        if (!c.last_purchase_date) return false;
        return new Date(c.last_purchase_date) <= cutoffDate;
      });
    }

    // Save segment
    const segment = await prisma.segment.create({
      data: {
        name,
        description,
        rules_json: JSON.stringify(rules),
        customer_count: finalCustomers.length
      }
    });

    // Save segment_customers
    if (finalCustomers.length > 0) {
      const scInserts = finalCustomers.map(c => ({
        segment_id: segment.id,
        customer_id: c.id
      }));
      await prisma.segmentCustomer.createMany({
        data: scInserts
      });
    }

    return NextResponse.json({
      segment,
      matchedCount: finalCustomers.length,
      rules
    });
  } catch (error: any) {
    console.error("AI Segment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
