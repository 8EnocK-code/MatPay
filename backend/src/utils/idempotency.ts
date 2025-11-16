import { PrismaClient } from '@prisma/client';
import { prisma } from '../prismaClient';

export async function checkIdempotency(
  key: string
): Promise<any | null> {
  const record = await prisma.idempotency.findUnique({
    where: { key },
  });

  if (!record) {
    return null;
  }

  if (new Date() > record.expiresAt) {
    await prisma.idempotency.delete({
      where: { key },
    });
    return null;
  }

  return record.response;
}

export async function storeIdempotency(
  key: string,
  response: any,
  ttlSeconds: number = 3600
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await prisma.idempotency.upsert({
    where: { key },
    update: {
      response,
      expiresAt,
    },
    create: {
      key,
      response,
      expiresAt,
    },
  });
}

