import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const category = searchParams.get('category');

    const where: any = {};
    if (city) {
      where.city = { contains: city }; // SQLite doesn't support mode: 'insensitive' natively without raw queries, contains is case-sensitive or insensitive depending on SQLite version/PRAGMA. We'll use contains.
    }
    if (category) {
      where.preferred_category = { contains: category };
    }

    const data = await prisma.customer.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
