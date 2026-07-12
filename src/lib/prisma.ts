import type { PrismaClient as PrismaClientType } from "@prisma/client";

const { PrismaClient } = require("@prisma/client");

const globalForPrisma = global as unknown as { prisma: PrismaClientType };

export const prisma: PrismaClientType =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
