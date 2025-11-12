import { PrismaClient, AppointmentType, DealStage } from '../generated/prisma-client';
import * as bcrypt from 'bcrypt';

// DATABASE_URL is loaded via dotenv-cli from package.json seed script
// The seed script in package.json uses dotenv-cli to load environment files in priority order:
// Example: dotenv -e .env.production.local -e .env.local -e .env -- node temp/seed.js
//
// If DATABASE_URL is not found, it will print an error and exit
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not found!');
  console.error('Please ensure one of these files exists in db/ directory:');
  console.error('  - .env.production.local');
  console.error('  - .env.local');
  console.error('  - .env');
  process.exit(1);
}

console.log('Starting seed.ts...');

const prisma = new PrismaClient();

console.log('PrismaClient created');

async function main() {
  try {
    console.log('Entering main function...');
    
    // Test database connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Hash the password "1" for all users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('1', salt);

    console.log('Password hashed successfully');

    console.log('Starting seeding process...');

    // Create admins user
    const admins: any[] = [];
    ["admin@loya.care", "admin@beispiel.de", "admin@example.com"].forEach(
      async (email, index) => {
        const admin = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: `Administrator ${index + 1}`,
            role: "ADMIN",
            password: hashedPassword,
          },
        });
        admins.push(admin);
        console.log("Admin users:", admin.email);
      }
    );


    // Create 10 employee users
    const employees: any[] = [];
    for (let i = 1; i <= 10; i++) {
      const employee = await prisma.user.upsert({
        where: { email: `v${i}@loya.care` },
        update: {},
        create: {
          email: `v${i}@loya.care`,
          name: `Mitarbeiter ${i}`,
          role: 'EMPLOYEE',
          password: hashedPassword,
        }
      });
      employees.push(employee);
      console.log('Employee user:', employee.email);
    }

    console.log('Creating leads and deals...');

    // For each employee, create 5 Leads and 6 Deals
    const dealStages: DealStage[] = ['QUALIFIED', 'CONTACTED', 'DEMO_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION'];

    for (const employee of employees) {
      // Create 5 Leads
      for (let i = 0; i < 5; i++) {
        await createLead(employee.id);
      }

      // Create 6 Deals with different stages
      for (let i = 0; i < 6; i++) {
        await createDeal(employee.id, dealStages[i % dealStages.length]);
      }
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

async function createLead(creatorId: string) {
  try {
    // Create unique contact
    const germanNames = ['Hans Müller', 'Anna Schmidt', 'Klaus Wagner', 'Maria Becker', 'Peter Schulz', 'Lisa Hoffmann', 'Thomas Richter', 'Sabine Bauer', 'Michael Koch', 'Julia Neumann'];
    const germanOrgs = ['GmbH', 'AG', 'KG', 'OHG', 'e.V.', 'Stiftung', 'Institut', 'Verein', 'Gesellschaft', 'Unternehmen'];
    const randomName = germanNames[Math.floor(Math.random() * germanNames.length)];
    const randomOrg = germanOrgs[Math.floor(Math.random() * germanOrgs.length)];
    const contact = await prisma.contact.create({
      data: {
        name: randomName,
        organization: `${randomOrg} ${Math.random().toString(36).substring(7)}`,
        email: `kontakt${Math.random().toString(36).substring(7)}@beispiel.de`,
        phone: `+4912345678${Math.floor(Math.random() * 100)}`,
      }
    });

    const title = `Titel ${contact.organization}`;
    const potentialValue = Math.round((Math.random() * (2500000 - 10) + 10) * 100) / 100;

    const deal = await prisma.deal.create({
      data: {
        title,
        contactId: contact.id,
        creatorId,
        assigneeId: creatorId,
        productInterest: 'Produktinteresse',
        potentialValue,
        stage: 'LEAD',
        status: 'ACTIVE',
      }
    });

    // Create 2-4 appointments
    const numAppointments = Math.floor(Math.random() * 3) + 2;
    const appointmentTypes: AppointmentType[] = ['CALL', 'MEETING', 'LUNCH'];

    for (let i = 0; i < numAppointments; i++) {
      await prisma.appointment.create({
        data: {
          datetime: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random future date within 30 days
          type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
          note: `Terminnotiz ${i + 1} für Lead`,
          dealId: deal.id,
        }
      });
    }

    console.log(`Created lead: ${title}`);
  } catch (error) {
    console.error('Error creating lead:', error);
  }
}

async function createDeal(creatorId: string, stage: DealStage) {
  try {
    // Create unique contact
    const germanNames = ['Hans Müller', 'Anna Schmidt', 'Klaus Wagner', 'Maria Becker', 'Peter Schulz', 'Lisa Hoffmann', 'Thomas Richter', 'Sabine Bauer', 'Michael Koch', 'Julia Neumann'];
    const germanOrgs = ['GmbH', 'AG', 'KG', 'OHG', 'e.V.', 'Stiftung', 'Institut', 'Verein', 'Gesellschaft', 'Unternehmen'];
    const randomName = germanNames[Math.floor(Math.random() * germanNames.length)];
    const randomOrg = germanOrgs[Math.floor(Math.random() * germanOrgs.length)];
    const contact = await prisma.contact.create({
      data: {
        name: randomName,
        organization: `${randomOrg} ${Math.random().toString(36).substring(7)}`,
        email: `kontakt${Math.random().toString(36).substring(7)}@beispiel.de`,
        phone: `+4912345678${Math.floor(Math.random() * 100)}`,
      }
    });

    const title = `Titel ${contact.organization}`;
    const potentialValue = Math.round((Math.random() * (2500000 - 10) + 10) * 100) / 100;

    const deal = await prisma.deal.create({
      data: {
        title,
        contactId: contact.id,
        creatorId,
        assigneeId: creatorId,
        productInterest: 'Produktinteresse',
        potentialValue,
        stage,
        status: 'ACTIVE',
      }
    });

    // Create 2-4 appointments
    const numAppointments = Math.floor(Math.random() * 3) + 2;
    const appointmentTypes: AppointmentType[] = ['CALL', 'MEETING', 'LUNCH'];

    for (let i = 0; i < numAppointments; i++) {
      await prisma.appointment.create({
        data: {
          datetime: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000), // Random future date within 30 days
          type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
          note: `Terminnotiz ${i + 1} für Deal`,
          dealId: deal.id,
        }
      });
    }

    console.log(`Created deal: ${title} (${stage})`);
  } catch (error) {
    console.error('Error creating deal:', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
