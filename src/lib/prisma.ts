import { PrismaClient } from "@prisma/client";

// Единый экземпляр Prisma (чтобы в dev-режиме не плодить подключения при hot-reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
