const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDummySegment() {
  try {
    const segment = await prisma.segment.create({
      data: {
        name: 'Manual Test Segment (Skincare)',
        description: 'Created manually to bypass AI network timeout',
        rules_json: JSON.stringify([{ field: 'category', operator: 'equals', value: 'Skincare' }]),
        created_by_ai: false,
        customer_count: 5
      }
    });

    const customers = await prisma.customer.findMany({
      where: { preferred_category: { contains: 'Skincare' } },
      take: 5
    });

    const links = customers.map(c => ({
      segment_id: segment.id,
      customer_id: c.id
    }));

    await prisma.segmentCustomer.createMany({
      data: links
    });

    console.log('Successfully created segment:', segment.name);
    console.log('Linked customers:', links.length);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

createDummySegment();
