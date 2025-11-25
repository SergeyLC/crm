import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

// NOTE: Currently, the WebAssembly version of query engine with the adapter
// does not yet support all features of Prisma Client. Most notably, it does not support
// interactive transactions. We recommend reviewing the list of supported features:
// https://github.com/prisma/prisma/blob/main/packages/adapter-pg/README.md#supported-features
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
