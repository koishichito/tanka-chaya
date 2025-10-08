import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tanka-chaya.com' },
    update: {},
    create: {
      email: 'admin@tanka-chaya.com',
      password: hashedPassword,
      displayName: '管理者',
      isAdmin: true,
      totalPoints: 0
    }
  });

  console.log('✅ Created admin user:', {
    email: admin.email,
    displayName: admin.displayName,
    isAdmin: admin.isAdmin
  });

  console.log('\n📋 Admin Login Credentials:');
  console.log('Email: admin@tanka-chaya.com');
  console.log('Password: admin123');
  console.log('\n⚠️  Please change the password after first login!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });