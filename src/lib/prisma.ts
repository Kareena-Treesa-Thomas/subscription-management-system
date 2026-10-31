import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
<<<<<<< HEAD

export type Tx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];
=======
>>>>>>> 9d94d5b124606e296a74351ec4aebede17456d55
