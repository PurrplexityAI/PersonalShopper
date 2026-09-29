import postgres from "@prisma/orm-postgres/runtime";
import type { H3Event } from "h3";
import type { Contract } from "~~/prisma/contract.d";
import contractJson from "~~/prisma/contract.json" with { type: "json" };

export interface CloudflareEnv {
  NUXT_DATABASE_URL?: string;
  DATABASE_URL?: string;
  [key: string]: unknown;
}

export interface CloudflareExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  [key: string]: unknown;
}

export interface CloudflareContext {
  env?: CloudflareEnv;
  context?: CloudflareExecutionContext;
  ctx?: CloudflareExecutionContext;
}

export function getCloudflareContext(event?: H3Event): {
  env?: CloudflareEnv;
  ctx?: CloudflareExecutionContext;
} {
  const cf = event?.context?.cloudflare as CloudflareContext | undefined;
  const env = cf?.env;
  const ctx = cf?.context || cf?.ctx;
  return { env, ctx };
}

export function getDatabaseUrl(event?: H3Event): string {
  const { env } = getCloudflareContext(event);
  if (env?.NUXT_DATABASE_URL) return env.NUXT_DATABASE_URL;
  if (env?.DATABASE_URL) return env.DATABASE_URL;
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NUXT_DATABASE_URL) return process.env.NUXT_DATABASE_URL;
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  }
  return "";
}

export function createPrismaClient(url?: string) {
  return postgres<Contract>({
    contractJson,
    url: url || getDatabaseUrl(),
  });
}

export type DbClient = ReturnType<typeof createPrismaClient>;

export function closeDb(db: DbClient, event?: H3Event): void {
  const { ctx } = getCloudflareContext(event);

  if (ctx && typeof ctx.waitUntil === "function") {
    try {
      ctx.waitUntil(
        db.close().catch((err) => {
          console.error("Error closing Prisma client in ctx.waitUntil:", err);
        })
      );
    } catch (err) {
      console.error("Failed to register db.close() with ctx.waitUntil:", err);
    }
    return;
  }

  const anyEvent = event as unknown as { waitUntil?: (p: Promise<unknown>) => void } | undefined;
  if (anyEvent && typeof anyEvent.waitUntil === "function") {
    try {
      anyEvent.waitUntil(
        db.close().catch((err) => {
          console.error("Error closing Prisma client in event.waitUntil:", err);
        })
      );
    } catch (err) {
      console.error("Failed to register db.close() with event.waitUntil:", err);
    }
    return;
  }

  // Fallback for non-Worker runtime environments (e.g. Node / Vitest)
  db.close().catch(() => {});
}

export function getDb(event?: H3Event): DbClient {
  return createPrismaClient(getDatabaseUrl(event));
}
