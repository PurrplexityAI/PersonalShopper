import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryPantryRepository } from "~~/server/utils/inMemoryRepository";

describe("PantryRepository (Isolated Datastore Tests)", () => {
  let repo: InMemoryPantryRepository;

  beforeEach(() => {
    repo = new InMemoryPantryRepository();
  });

  it("creates pantry items and enforces case-insensitive name uniqueness", async () => {
    const item1 = await repo.create({
      name: "Organic Sourdough Bread",
      category: "Bakery",
      inStock: true,
      quantity: 1,
      unit: "loaf",
      frequencyDays: 7,
    });

    expect(item1.id).toBeDefined();
    expect(item1.name).toBe("Organic Sourdough Bread");
    expect(item1.frequencyLabel).toBe("Weekly (7d)");
    expect(item1.nextDueDate).toBeDefined();

    // Attempting duplicate with different casing should fail
    await expect(
      repo.create({
        name: "organic sourdough bread",
        category: "Bakery",
      })
    ).rejects.toThrow(/already exists/i);
  });

  it("auto-creates non-existent item in pantry when added to shopping list", async () => {
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

    // Verify it exists in general pantry items
    const pantryItem = await repo.findByName("Fresh Basil");
    expect(pantryItem).not.toBeNull();
    expect(pantryItem?.inShoppingList).toBe(true);
  });

  it("adds existing pantry item to shopping list without duplicate creation", async () => {
    const existing = await repo.create({
      name: "Ground Coffee",
      category: "Beverages",
      inStock: true,
      quantity: 1,
    });

    const result = await repo.addToShoppingList(existing.id, { quantity: 3 });
    expect(result.createdInPantry).toBe(false);
    expect(result.item.id).toBe(existing.id);
    expect(result.item.inShoppingList).toBe(true);
    expect(result.item.shoppingListQuantity).toBe(3);
  });

  it("ticks off item from shopping list: marks in-stock, resets cadence timer, clears from list", async () => {
    const pastDate = "2026-08-01T10:00:00.000Z";
    const item = await repo.create({
      name: "Whole Milk",
      category: "Dairy & Eggs",
      inStock: false,
      quantity: 0,
      frequencyDays: 7,
      lastPurchasedAt: pastDate,
      inShoppingList: true,
      shoppingListQuantity: 2,
    });

    const checked = await repo.checkOffShoppingItem(item.id);
    expect(checked.inStock).toBe(true);
    expect(checked.inShoppingList).toBe(false);
    expect(checked.lastPurchasedAt).not.toBe(pastDate);
    expect(checked.quantity).toBe(2);

    // Verify no longer returned in shopping list
    const activeList = await repo.getShoppingList();
    expect(activeList.some((i) => i.id === item.id)).toBe(false);
  });

  it("deletes from shopping list without resetting cadence or altering pantry inStock status", async () => {
    const originalDate = "2026-09-01T10:00:00.000Z";
    const item = await repo.create({
      name: "Avocados",
      category: "Produce",
      inStock: false,
      quantity: 0,
      frequencyDays: 5,
      lastPurchasedAt: originalDate,
      inShoppingList: true,
    });

    const removed = await repo.deleteFromShoppingList(item.id);
    expect(removed.inShoppingList).toBe(false);
    expect(removed.inStock).toBe(false);
    expect(removed.lastPurchasedAt).toBe(originalDate);
  });

  it("updates shopping quantity accurately", async () => {
    const item = await repo.create({
      name: "Butter",
      category: "Dairy & Eggs",
      inShoppingList: true,
      shoppingListQuantity: 1,
    });

    const updated = await repo.updateShoppingQuantity(item.id, 4);
    expect(updated.shoppingListQuantity).toBe(4);
  });

  it("deletes pantry item completely", async () => {
    const item = await repo.create({
      name: "Paper Towels",
      category: "Household",
    });

    const deleted = await repo.delete(item.id);
    expect(deleted).toBe(true);

    const found = await repo.getById(item.id);
    expect(found).toBeNull();
  });
});
