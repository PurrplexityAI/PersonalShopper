import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "~~/prisma/contract.d";
import contractJson from "~~/prisma/contract.json" with { type: "json" };

export function createPrismaClient(url?: string) {
  return postgres<Contract>({
    contractJson,
    url: url || process.env.NUXT_DATABASE_URL || "",
  });
}

export type DbClient = ReturnType<typeof createPrismaClient>;

let defaultDb: DbClient | null = null;
export function getDb(): DbClient {
  if (!defaultDb) {
    defaultDb = createPrismaClient();
  }
  return defaultDb;
}
