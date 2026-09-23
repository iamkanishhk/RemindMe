import { PrismaClient } from '@prisma/client';
import { env } from '../config';

export const prisma = new PrismaClient({
  datasources: env.DATABASE_URL ? { db: { url: env.DATABASE_URL } } : undefined
});