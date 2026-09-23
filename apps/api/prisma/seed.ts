import { prisma } from '../src/lib/prisma';

async function main(): Promise<void> {
  const demo = await prisma.user.upsert({
    where: { clerkUserId: 'demo-clerk-user' },
    update: { email: 'demo@remindme.local' },
    create: { clerkUserId: 'demo-clerk-user', email: 'demo@remindme.local' }
  });

  const existingPhone = await prisma.phoneNumber.findFirst({
    where: { userId: demo.id, e164: '+60123456789' }
  });
  if (!existingPhone) {
    await prisma.phoneNumber.create({
      data: { userId: demo.id, e164: '+60123456789', verified: false }
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded demo user ${demo.id} with unverified +60123456789`);
}

void main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });