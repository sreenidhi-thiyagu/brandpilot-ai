import { NextResponse } from "next/server";
import { ai, MODEL_NAME } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      return NextResponse.json({ error: "AI key not configured." }, { status: 400 });
    }

    const { goal, segmentName, channel, tone, offer } = await req.json();

    const systemInstruction = `You are an expert D2C copywriter for GlowCare Beauty, an upcoming premium beauty brand.
Generate a campaign message based on the inputs.
Channel constraints:
- SMS: Keep it short (under 160 chars), punchy.
- WhatsApp: Can use emojis, bold text (using *), slightly longer.
- Email: Can be a full paragraph, needs a clear subject line (include it in the message body).
- RCS: Similar to WhatsApp but focus on rich media feel.

Return a JSON object:
{
  "messageTemplate": "The generated message using {{name}} for personalization.",
  "suggestedName": "A catchy internal name for this campaign",
  "reasoning": "A short explanation of why this copy works."
}`;

    const prompt = `Goal: ${goal}
Segment: ${segmentName}
Channel: ${channel}
Tone: ${tone}
Offer: ${offer}`;

    const result = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const text = result.text || "";
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) data = JSON.parse(match[0]);
      else throw new Error("Failed to parse AI response");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("AI Gen Message error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
