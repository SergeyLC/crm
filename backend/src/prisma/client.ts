import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prismaInstance: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    prismaInstance = new PrismaClient({ adapter } as any);
  }

  return prismaInstance;
}

const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const client = getPrismaClient();
    return (client as any)[prop];
  }
});

export default prisma;
