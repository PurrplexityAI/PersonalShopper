import { describe, it, expect, vi, beforeEach } from "vitest";
import type { H3Event } from "h3";
import {
  getCloudflareContext,
  getDatabaseUrl,
  closeDb,
  type DbClient,
} from "~~/server/utils/prismaClient";
import { withRepository, withDb, createRequestRepository } from "~~/server/utils/db";

describe("Cloudflare Workers Database Lifecycle & Edge Compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("extracts env and ctx from event.context.cloudflare with context.waitUntil", () => {
    const mockWaitUntil = vi.fn();
    const mockEvent = {
      context: {
        cloudflare: {
          env: { NUXT_DATABASE_URL: "postgres://edge-user:pass@edge-host/db" },
          context: { waitUntil: mockWaitUntil },
        },
      },
    } as unknown as H3Event;

    const { env, ctx } = getCloudflareContext(mockEvent);
    expect(env?.NUXT_DATABASE_URL).toBe("postgres://edge-user:pass@edge-host/db");
    expect(ctx?.waitUntil).toBe(mockWaitUntil);
  });

  it("extracts env and ctx when using ctx alias", () => {
    const mockWaitUntil = vi.fn();
    const mockEvent = {
      context: {
        cloudflare: {
          env: { DATABASE_URL: "postgres://edge-fallback/db" },
          ctx: { waitUntil: mockWaitUntil },
        },
      },
    } as unknown as H3Event;

    const { env, ctx } = getCloudflareContext(mockEvent);
    expect(env?.DATABASE_URL).toBe("postgres://edge-fallback/db");
    expect(ctx?.waitUntil).toBe(mockWaitUntil);
  });

  it("resolves database url prioritizing Cloudflare Worker env over process.env", () => {
    const mockEvent = {
      context: {
        cloudflare: {
          env: {
            NUXT_DATABASE_URL: "postgres://worker-env-url/db",
          },
        },
      },
    } as unknown as H3Event;

    const originalProcessEnv = process.env.NUXT_DATABASE_URL;
    try {
      process.env.NUXT_DATABASE_URL = "postgres://process-env-url/db";
      const resolved = getDatabaseUrl(mockEvent);
      expect(resolved).toBe("postgres://worker-env-url/db");
    } finally {
      process.env.NUXT_DATABASE_URL = originalProcessEnv;
    }
  });

  it("falls back to process.env when event has no Cloudflare env", () => {
    const mockEvent = {
      context: {},
    } as unknown as H3Event;

    const originalProcessEnv = process.env.NUXT_DATABASE_URL;
    try {
      process.env.NUXT_DATABASE_URL = "postgres://process-env-url/db";
      const resolved = getDatabaseUrl(mockEvent);
      expect(resolved).toBe("postgres://process-env-url/db");
    } finally {
      process.env.NUXT_DATABASE_URL = originalProcessEnv;
    }
  });

  it("schedules db.close() via ctx.waitUntil on Cloudflare Workers", async () => {
    const waitUntilPromises: Promise<unknown>[] = [];
    const mockWaitUntil = vi.fn((p: Promise<unknown>) => {
      waitUntilPromises.push(p);
    });

    const mockEvent = {
      context: {
        cloudflare: {
          context: { waitUntil: mockWaitUntil },
        },
      },
    } as unknown as H3Event;

    const mockClose = vi.fn().mockResolvedValue(undefined);
    const mockDb = { close: mockClose } as unknown as DbClient;

    closeDb(mockDb, mockEvent);

    expect(mockWaitUntil).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);

    await Promise.all(waitUntilPromises);
  });

  it("handles db.close() errors in ctx.waitUntil gracefully without uncaught rejection", async () => {
    const waitUntilPromises: Promise<unknown>[] = [];
    const mockWaitUntil = vi.fn((p: Promise<unknown>) => {
      waitUntilPromises.push(p);
    });

    const mockEvent = {
      context: {
        cloudflare: {
          context: { waitUntil: mockWaitUntil },
        },
      },
    } as unknown as H3Event;

    const mockClose = vi.fn().mockRejectedValue(new Error("socket already closed"));
    const mockDb = { close: mockClose } as unknown as DbClient;

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      closeDb(mockDb, mockEvent);
      expect(mockWaitUntil).toHaveBeenCalledTimes(1);
      await Promise.all(waitUntilPromises);
      expect(consoleSpy).toHaveBeenCalled();
    } finally {
      consoleSpy.mockRestore();
    }
  });

  it("withRepository executes callback and ensures db.close() is scheduled via ctx.waitUntil", async () => {
    const waitUntilPromises: Promise<unknown>[] = [];
    const mockWaitUntil = vi.fn((p: Promise<unknown>) => {
      waitUntilPromises.push(p);
    });

    const mockEvent = {
      context: {
        cloudflare: {
          context: { waitUntil: mockWaitUntil },
        },
      },
    } as unknown as H3Event;

    let callbackRepo: unknown = null;
    const result = await withRepository(mockEvent, async (repo) => {
      callbackRepo = repo;
      return "success-result";
    });

    expect(result).toBe("success-result");
    expect(callbackRepo).toBeDefined();
    expect(mockWaitUntil).toHaveBeenCalledTimes(1);

    await Promise.all(waitUntilPromises);
  });

  it("withRepository guarantees db cleanup in finally even when callback throws", async () => {
    const waitUntilPromises: Promise<unknown>[] = [];
    const mockWaitUntil = vi.fn((p: Promise<unknown>) => {
      waitUntilPromises.push(p);
    });

    const mockEvent = {
      context: {
        cloudflare: {
          context: { waitUntil: mockWaitUntil },
        },
      },
    } as unknown as H3Event;

    await expect(
      withRepository(mockEvent, async () => {
        throw new Error("Query execution failed");
      })
    ).rejects.toThrow("Query execution failed");

    expect(mockWaitUntil).toHaveBeenCalledTimes(1);
    await Promise.all(waitUntilPromises);
  });

  it("withDb executes callback and guarantees cleanup", async () => {
    const waitUntilPromises: Promise<unknown>[] = [];
    const mockWaitUntil = vi.fn((p: Promise<unknown>) => {
      waitUntilPromises.push(p);
    });

    const mockEvent = {
      context: {
        cloudflare: {
          context: { waitUntil: mockWaitUntil },
        },
      },
    } as unknown as H3Event;

    const result = await withDb(mockEvent, async (db) => {
      expect(db).toBeDefined();
      return 42;
    });

    expect(result).toBe(42);
    expect(mockWaitUntil).toHaveBeenCalledTimes(1);
    await Promise.all(waitUntilPromises);
  });

  it("createRequestRepository returns repo, db, and a close handle that uses ctx.waitUntil", async () => {
    const waitUntilPromises: Promise<unknown>[] = [];
    const mockWaitUntil = vi.fn((p: Promise<unknown>) => {
      waitUntilPromises.push(p);
    });

    const mockEvent = {
      context: {
        cloudflare: {
          context: { waitUntil: mockWaitUntil },
        },
      },
    } as unknown as H3Event;

    const req = createRequestRepository(mockEvent);
    expect(req.repo).toBeDefined();
    expect(req.db).toBeDefined();
    expect(typeof req.close).toBe("function");

    req.close();
    expect(mockWaitUntil).toHaveBeenCalledTimes(1);
    await Promise.all(waitUntilPromises);
  });
});
