import { describe, it, expect } from "vitest";
import { sortPantryItems } from "~~/app/utils/sort";
import type { PantryItem } from "~~/shared/types";

function createItem(partial: Partial<PantryItem>): PantryItem {
  return {
    id: "item-" + Math.random().toString(36).slice(2),
    name: "Sample",
    category: "General",
    inStock: true,
    quantity: 1,
    unit: "items",
    frequencyDays: 7,
    frequencyLabel: "Weekly",
    autoFrequency: true,
    lastSuggestedAt: null,
    lastPurchasedAt: null,
    lastPurchasedAtPrevious: null,
    nextDueDate: null,
    inShoppingList: false,
    shoppingListQuantity: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("sortPantryItems utility", () => {
  it("sorts alphabetical ascending (A-z)", () => {
    const items = [
      createItem({ name: "Milk" }),
      createItem({ name: "Apples" }),
      createItem({ name: "Bread" }),
    ];
    const sorted = sortPantryItems(items, "alpha-asc");
    expect(sorted.map((i) => i.name)).toEqual(["Apples", "Bread", "Milk"]);
  });

  it("sorts alphabetical descending (Z-a)", () => {
    const items = [
      createItem({ name: "Milk" }),
      createItem({ name: "Apples" }),
      createItem({ name: "Bread" }),
    ];
    const sorted = sortPantryItems(items, "alpha-desc");
    expect(sorted.map((i) => i.name)).toEqual(["Milk", "Bread", "Apples"]);
  });

  it("sorts last bought newest first, placing unbought items last", () => {
    const items = [
      createItem({ name: "Never Bought", lastPurchasedAt: null }),
      createItem({ name: "Old", lastPurchasedAt: "2026-09-01T10:00:00Z" }),
      createItem({ name: "New", lastPurchasedAt: "2026-09-25T10:00:00Z" }),
    ];
    const sorted = sortPantryItems(items, "bought-desc");
    expect(sorted.map((i) => i.name)).toEqual(["New", "Old", "Never Bought"]);
  });

  it("sorts last bought oldest first, placing unbought items last", () => {
    const items = [
      createItem({ name: "Never Bought", lastPurchasedAt: null }),
      createItem({ name: "New", lastPurchasedAt: "2026-09-25T10:00:00Z" }),
      createItem({ name: "Old", lastPurchasedAt: "2026-09-01T10:00:00Z" }),
    ];
    const sorted = sortPantryItems(items, "bought-asc");
    expect(sorted.map((i) => i.name)).toEqual(["Old", "New", "Never Bought"]);
  });

  it("sorts next due soonest first, placing null nextDueDate items last", () => {
    const items = [
      createItem({ name: "No Due Date", nextDueDate: null }),
      createItem({ name: "Next Week", nextDueDate: "2026-10-02T10:00:00Z" }),
      createItem({ name: "Tomorrow", nextDueDate: "2026-09-28T10:00:00Z" }),
    ];
    const sorted = sortPantryItems(items, "due-asc");
    expect(sorted.map((i) => i.name)).toEqual(["Tomorrow", "Next Week", "No Due Date"]);
  });

  it("sorts next due latest first, placing null nextDueDate items last", () => {
    const items = [
      createItem({ name: "No Due Date", nextDueDate: null }),
      createItem({ name: "Tomorrow", nextDueDate: "2026-09-28T10:00:00Z" }),
      createItem({ name: "Next Week", nextDueDate: "2026-10-02T10:00:00Z" }),
    ];
    const sorted = sortPantryItems(items, "due-desc");
    expect(sorted.map((i) => i.name)).toEqual(["Next Week", "Tomorrow", "No Due Date"]);
  });
});
