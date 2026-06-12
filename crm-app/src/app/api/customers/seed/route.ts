import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CATEGORIES = ["Skincare", "Haircare", "Makeup", "Fragrance"];
const CITIES = ["Chennai", "Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Kolkata", "Ahmedabad"];
const GENDERS = ["Female", "Male", "Other"];

const FIRST_NAMES = ["Priya", "Rahul", "Sneha", "Amit", "Neha", "Rohan", "Pooja", "Vikram", "Anjali", "Karan", "Riya", "Aditya", "Kavya", "Arjun", "Ishita", "Siddharth", "Aisha", "Kabir", "Meera", "Aarav"];
const LAST_NAMES = ["Sharma", "Verma", "Singh", "Patel", "Reddy", "Kumar", "Gupta", "Das", "Iyer", "Nair", "Menon", "Joshi", "Desai", "Rao", "Bhat"];

const PRODUCTS: Record<string, string[]> = {
  Skincare: ["Vitamin C Serum", "Hydrating Face Wash", "Retinol Night Cream", "Sunscreen SPF 50", "Hyaluronic Acid", "Niacinamide Serum", "Aloe Vera Gel"],
  Haircare: ["Argan Oil Shampoo", "Keratin Hair Mask", "Hair Fall Control Serum", "Anti-Dandruff Conditioner", "Scalp Scrub", "Leave-in Conditioner"],
  Makeup: ["Matte Liquid Lipstick", "Waterproof Foundation", "Lengthening Mascara", "Blush Palette", "Makeup Fixer", "Eyeliner Pen", "Compact Powder"],
  Fragrance: ["Oud Wood Perfume", "Floral Body Mist", "Musk Eau De Parfum", "Citrus Cologne", "Rose Roll-on", "Lavender Essential Oil"],
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function POST() {
  try {
    // 1. Clear all data in order (reverse dependency)
    await prisma.communicationEvent.deleteMany();
    await prisma.campaignRecipient.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.segmentCustomer.deleteMany();
    await prisma.segment.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customer.deleteMany();

    // 2. Build customers in memory
    const NUM_CUSTOMERS = 100;
    const NUM_ORDERS = 260;

    const customerData = Array.from({ length: NUM_CUSTOMERS }).map((_, i) => {
      const firstName = randomChoice(FIRST_NAMES);
      const lastName = randomChoice(LAST_NAMES);
      return {
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@glowcarebeauty.com`,
        phone: `+919876${String(i).padStart(6, '0')}`,
        city: randomChoice(CITIES),
        gender: randomChoice(GENDERS),
        age: randomInt(18, 60),
        preferred_category: randomChoice(CATEGORIES),
        total_spent: randomInt(500, 50000), // Assigned instantly to prevent Vercel timeout
        last_purchase_date: daysAgo(randomInt(1, 100)),
      };
    });

    // 3. Bulk insert customers
    await prisma.customer.createMany({ data: customerData });
    const customers = await prisma.customer.findMany({ select: { id: true } });

    // 4. Build random orders
    const orderData = Array.from({ length: NUM_ORDERS }).map(() => {
      const customer = randomChoice(customers);
      const category = randomChoice(CATEGORIES);
      const productName = randomChoice(PRODUCTS[category]);
      const orderValue = randomInt(500, 5000);

      return {
        customer_id: customer.id,
        product_name: productName,
        category: category,
        order_value: orderValue,
        order_date: daysAgo(randomInt(1, 100)),
      };
    });

    // 5. Bulk insert orders
    await prisma.order.createMany({ data: orderData });

    console.log(`[Seed] Seeded ${NUM_CUSTOMERS} customers and ${NUM_ORDERS} orders`);

    return NextResponse.json({
      success: true,
      message: `Seeded ${NUM_CUSTOMERS} customers and ${NUM_ORDERS} orders.`
    });
  } catch (error: any) {
    console.error("[Seed] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
