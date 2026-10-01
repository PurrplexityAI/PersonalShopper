import { describe, it, expect, beforeEach, vi } from "vitest";
import { PrismaPantryRepository, type PantryItemRow } from "~~/server/utils/prismaRepository";
import { createMockContext, type MockContext } from "../context";
import type { DbClient } from "~~/server/utils/prismaClient";

describe("PrismaPantryRepository (Unit Tests with Mocked Prisma Client)", () => {
  let mockCtx: MockContext;
  let repo: PrismaPantryRepository;

  beforeEach(() => {
    mockCtx = createMockContext();
    repo = new PrismaPantryRepository(mockCtx.db as unknown as DbClient);
  });

  it("creates pantry items and enforces case-insensitive name uniqueness", async () => {
    const mockCreated: PantryItemRow = {
      id: "uuid-1",
      name: "Organic Sourdough Bread",
      category: "Bakery",
      inStock: true,
      quantity: 1,
      unit: "loaf",
      frequencyDays: 7,
      frequencyLabel: "Weekly (7d)",
      lastPurchasedAt: null,
      nextDueDate: new Date().toISOString(),
      inShoppingList: false,
      shoppingListQuantity: 1,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // First attempt: no existing item found
    const whereMock = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
    });
    mockCtx.db.orm.public.PantryItem.where = whereMock as unknown as never;
    mockCtx.db.orm.public.PantryItem.create.mockResolvedValue(mockCreated as unknown as never);

    const item1 = await repo.create({
      name: "Organic Sourdough Bread",
      category: "Bakery",
      inStock: true,
      quantity: 1,
      unit: "loaf",
      frequencyDays: 7,
    });

    expect(item1.id).toBe("uuid-1");
    expect(item1.name).toBe("Organic Sourdough Bread");
    expect(item1.frequencyLabel).toBe("Weekly (7d)");
    expect(item1.nextDueDate).toBeDefined();

    // Second attempt: duplicate found with case-insensitive check
    mockCtx.db.orm.public.PantryItem.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(mockCreated),
    }) as unknown as never;

    await expect(
      repo.create({
        name: "organic sourdough bread",
        category: "Bakery",
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("auto-creates non-existent item in pantry when added to shopping list", async () => {
    // Neither getById nor findByName finds an existing item
    mockCtx.db.orm.public.PantryItem.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
    }) as unknown as never;

    const mockCreated: PantryItemRow = {
      id: "uuid-basil",
      name: "Fresh Basil",
      category: "Produce",
      inStock: false,
      quantity: 0,
      unit: "items",
      frequencyDays: 14,
      frequencyLabel: "Every 2 weeks",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: true,
      shoppingListQuantity: 2,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockCtx.db.orm.public.PantryItem.create.mockResolvedValue(mockCreated as unknown as never);

    const result = await repo.addToShoppingList("Fresh Basil", {
      category: "Produce",
      quantity: 2,
      frequencyDays: 14,
    });

    expect(result.createdInPantry).toBe(true);
    expect(result.item.name).toBe("Fresh Basil");
    expect(result.item.inShoppingList).toBe(true);
    expect(result.item.shoppingListQuantity).toBe(2);
    expect(result.item.inStock).toBe(false);
  });

  it("adds existing pantry item to shopping list without duplicate creation", async () => {
    const existing: PantryItemRow = {
      id: "uuid-coffee",
      name: "Ground Coffee",
      category: "Beverages",
      inStock: true,
      quantity: 1,
      unit: "items",
      frequencyDays: 14,
      frequencyLabel: "Every 2 weeks",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: false,
      shoppingListQuantity: 1,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = {
      ...existing,
      inShoppingList: true,
      shoppingListQuantity: 3,
    };

    mockCtx.db.orm.public.PantryItem.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(updated),
    }) as unknown as never;

    const result = await repo.addToShoppingList(existing.id, { quantity: 3 });
    expect(result.createdInPantry).toBe(false);
    expect(result.item.id).toBe(existing.id);
    expect(result.item.inShoppingList).toBe(true);
    expect(result.item.shoppingListQuantity).toBe(3);
  });

  it("ticks off item from shopping list: marks in-stock, resets cadence timer, clears from list", async () => {
    const pastDate = "2026-08-01T10:00:00.000Z";
    const existing: PantryItemRow = {
      id: "uuid-milk",
      name: "Whole Milk",
      category: "Dairy & Eggs",
      inStock: false,
      quantity: 0,
      unit: "bottle",
      frequencyDays: 7,
      frequencyLabel: "Weekly (7d)",
      lastPurchasedAt: pastDate,
      nextDueDate: pastDate,
      inShoppingList: true,
      shoppingListQuantity: 2,
      notes: null,
      createdAt: pastDate,
      updatedAt: pastDate,
    };

    const updated = {
      ...existing,
      inStock: true,
      inShoppingList: false,
      lastPurchasedAt: new Date().toISOString(),
      quantity: 2,
    };

    mockCtx.db.orm.public.PantryItem.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(updated),
      all: vi.fn().mockResolvedValue([]),
    }) as unknown as never;

    const checked = await repo.checkOffShoppingItem(existing.id);
    expect(checked.inStock).toBe(true);
    expect(checked.inShoppingList).toBe(false);
    expect(checked.lastPurchasedAt).not.toBe(pastDate);
    expect(checked.quantity).toBe(2);

    const activeList = await repo.getShoppingList();
    expect(activeList.some((i) => i.id === existing.id)).toBe(false);
  });

  it("deletes from shopping list without resetting cadence or altering pantry inStock status", async () => {
    const originalDate = "2026-09-01T10:00:00.000Z";
    const existing: PantryItemRow = {
      id: "uuid-avo",
      name: "Avocados",
      category: "Produce",
      inStock: false,
      quantity: 0,
      unit: "items",
      frequencyDays: 5,
      frequencyLabel: "Every 5 days",
      lastPurchasedAt: originalDate,
      nextDueDate: originalDate,
      inShoppingList: true,
      shoppingListQuantity: 1,
      notes: null,
      createdAt: originalDate,
      updatedAt: originalDate,
    };

    const updated = {
      ...existing,
      inShoppingList: false,
    };

    mockCtx.db.orm.public.PantryItem.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(updated),
    }) as unknown as never;

    const removed = await repo.deleteFromShoppingList(existing.id);
    expect(removed.inShoppingList).toBe(false);
    expect(removed.inStock).toBe(false);
    expect(removed.lastPurchasedAt).toBe(originalDate);
  });

  it("updates shopping quantity accurately", async () => {
    const existing: PantryItemRow = {
      id: "uuid-butter",
      name: "Butter",
      category: "Dairy & Eggs",
      inStock: true,
      quantity: 1,
      unit: "block",
      frequencyDays: 14,
      frequencyLabel: "Every 2 weeks",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: true,
      shoppingListQuantity: 1,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = {
      ...existing,
      shoppingListQuantity: 4,
    };

    mockCtx.db.orm.public.PantryItem.where = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(existing),
      update: vi.fn().mockResolvedValue(updated),
    }) as unknown as never;

    const res = await repo.updateShoppingQuantity(existing.id, 4);
    expect(res.shoppingListQuantity).toBe(4);
  });

  it("deletes pantry item completely", async () => {
    const existing: PantryItemRow = {
      id: "uuid-paper",
      name: "Paper Towels",
      category: "Household",
      inStock: true,
      quantity: 1,
      unit: "pack",
      frequencyDays: 30,
      frequencyLabel: "Monthly",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: false,
      shoppingListQuantity: 1,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    let itemExists = true;
    mockCtx.db.orm.public.PantryItem.where = vi.fn().mockImplementation(() => ({
      first: vi.fn().mockImplementation(async () => (itemExists ? existing : null)),
      delete: vi.fn().mockImplementation(async () => {
        itemExists = false;
        return undefined;
      }),
    })) as unknown as never;

    const deleted = await repo.delete(existing.id);
    expect(deleted).toBe(true);

    const found = await repo.getById(existing.id);
    expect(found).toBeNull();
  });

  it("marks suggested items with timestamp", async () => {
    const updateMock = vi.fn().mockResolvedValue(undefined);
    mockCtx.db.orm.public.PantryItem.where = vi.fn().mockReturnValue({
      update: updateMock,
    }) as unknown as never;

    const testDate = new Date("2026-09-15T10:00:00.000Z");
    await repo.markSuggested(["id-1", "id-2"], testDate);

    expect(updateMock).toHaveBeenCalledWith({
      lastSuggestedAt: testDate.toISOString(),
    });
  });
});

