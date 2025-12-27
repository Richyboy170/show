import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env file');
    process.exit(1);
  }

  console.log('Setting up admin user...');

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      password: hashedPassword,
    },
    create: {
      email,
      password: hashedPassword,
      name: 'Admin',
    },
  });

  console.log('✅ Admin user created/updated:', admin.email);

  // Setup channel monitor if YouTube channel ID is provided
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (channelId) {
    const channelMonitor = await prisma.channelMonitor.upsert({
      where: { channelId },
      update: {},
      create: {
        channelId,
        channelHandle: '@josietso',
      },
    });
    console.log('✅ Channel monitor created for:', channelMonitor.channelHandle);
  }

  console.log('\n✨ Setup complete! You can now login with:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
