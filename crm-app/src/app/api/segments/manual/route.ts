import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, description, rules } = await req.json();

    if (!name || !rules || !Array.isArray(rules)) {
      return NextResponse.json({ error: "Name and rules array are required" }, { status: 400 });
    }

    const where: any = {};

    // Build the Prisma where clause from the manual rules
    for (const rule of rules) {
      const { field, operator, value } = rule;
      if (!field || !operator || value === undefined || value === "") continue;

      if (field === "city" || field === "preferred_category" || field === "gender") {
        if (operator === "equals") {
          where[field] = { equals: value, mode: 'insensitive' };
        } else if (operator === "contains") {
          where[field] = { contains: value, mode: 'insensitive' };
        }
      } else if (field === "age" || field === "total_spent") {
        const numValue = Number(value);
        if (isNaN(numValue)) continue;
        
        if (operator === "equals") {
          where[field] = numValue;
        } else if (operator === "greater_than") {
          where[field] = { ...where[field], gt: numValue };
        } else if (operator === "less_than") {
          where[field] = { ...where[field], lt: numValue };
        }
      } else if (field === "last_purchase_date") {
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) continue;

        if (operator === "before") {
          where[field] = { ...where[field], lt: dateValue };
        } else if (operator === "after") {
          where[field] = { ...where[field], gt: dateValue };
        }
      }
    }

    const matchedCustomers = await prisma.customer.findMany({
      where,
      select: { id: true }
    });

    const finalCustomers = matchedCustomers || [];

    // Save segment
    const segment = await prisma.segment.create({
      data: {
        name,
        description: description || "Manually created segment",
        rules_json: JSON.stringify(rules),
        created_by_ai: false,
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
    console.error("Manual Segment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
