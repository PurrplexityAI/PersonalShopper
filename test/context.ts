import { mockDeep, type DeepMockProxy } from "vitest-mock-extended";
import type { DbClient } from "~~/server/utils/prismaClient";

export type MockContext = {
  db: DeepMockProxy<DbClient>;
};

export function createMockContext(): MockContext {
  return {
    db: mockDeep<DbClient>(),
  };
}
