import type { H3Event } from "h3";
import { PrismaPantryRepository } from "./prismaRepository";
import type { PantryRepository } from "./repository";
import {
  createPrismaClient,
  getDatabaseUrl,
  closeDb,
  type DbClient,
} from "./prismaClient";

/**
 * Executes a callback with a request-scoped repository.
 * The client is created per request with the connection string from env,
 * and closed after the response with ctx.waitUntil(db.close()) on Cloudflare Workers.
 */
export async function withRepository<T>(
  event: H3Event,
  fn: (repo: PantryRepository) => Promise<T>
): Promise<T> {
  const url = getDatabaseUrl(event);
  const db = createPrismaClient(url);
  const repo = new PrismaPantryRepository(db);
  try {
    return await fn(repo);
  } finally {
    closeDb(db, event);
  }
}

/**
 * Executes a callback with a request-scoped database client.
 * The client is created per request with the connection string from env,
 * and closed after the response with ctx.waitUntil(db.close()) on Cloudflare Workers.
 */
export async function withDb<T>(
  event: H3Event,
  fn: (db: DbClient) => Promise<T>
): Promise<T> {
  const url = getDatabaseUrl(event);
  const db = createPrismaClient(url);
  try {
    return await fn(db);
  } finally {
    closeDb(db, event);
  }
}

/**
 * Creates a request-scoped repository and cleanup callback.
 */
export function createRequestRepository(event: H3Event): {
  repo: PantryRepository;
  db: DbClient;
  close: () => void;
} {
  const url = getDatabaseUrl(event);
  const db = createPrismaClient(url);
  const repo = new PrismaPantryRepository(db);
  return {
    repo,
    db,
    close: () => closeDb(db, event),
  };
}
