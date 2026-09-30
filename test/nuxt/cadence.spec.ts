import { describe, it, expect } from "vitest";
import {
  getFrequencyLabel,
  calculateNextDueDate,
  evaluateItemCadence,
  generateSuggestions,
  sortSuggestionsSoonestFirst,
} from "~~/app/utils/cadence";
import type { PantryItem, ShoppingSuggestion } from "~~/shared/types";

describe("Cadence Calculation Engine", () => {
  it("formats cadence frequency labels correctly", () => {
    expect(getFrequencyLabel(1)).toBe("Daily");
    expect(getFrequencyLabel(3)).toBe("Every 3 days");
    expect(getFrequencyLabel(7)).toBe("Weekly (7d)");
    expect(getFrequencyLabel(14)).toBe("Every 2 weeks (14d)");
    expect(getFrequencyLabel(21)).toBe("Every 3 weeks (21d)");
    expect(getFrequencyLabel(30)).toBe("Monthly (30d)");
    expect(getFrequencyLabel(45)).toBe("Every 45 days");
  });

  it("calculates next due date properly from last purchase date", () => {
    const baseDate = "2026-09-01T12:00:00.000Z";
    const due7 = calculateNextDueDate(baseDate, 7);
    expect(due7).toBe("2026-09-08T12:00:00.000Z");

    const due14 = calculateNextDueDate(baseDate, 14);
    expect(due14).toBe("2026-09-15T12:00:00.000Z");
  });

  it("evaluates item cadence correctly across time horizons", () => {
    const mockItem: PantryItem = {
      id: "test-item-1",
      name: "Organic Milk",
      category: "Dairy & Eggs",
      inStock: true,
      quantity: 1,
      unit: "bottle",
      frequencyDays: 7,
      frequencyLabel: "Weekly (7d)",
      lastPurchasedAt: "2026-09-01T12:00:00.000Z",
      nextDueDate: "2026-09-08T12:00:00.000Z",
      inShoppingList: false,
      shoppingListQuantity: 1,
      createdAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-01T12:00:00.000Z",
    };

    // Case 1: Checked 3 days before due -> not due
    const evalBefore = evaluateItemCadence(mockItem, new Date("2026-09-05T12:00:00.000Z"));
    expect(evalBefore.isDue).toBe(false);

    // Case 2: Checked on due date -> due today, high urgency
    const evalDue = evaluateItemCadence(mockItem, new Date("2026-09-08T12:00:00.000Z"));
    expect(evalDue.isDue).toBe(true);
    expect(evalDue.urgency).toBe("high");
    expect(evalDue.daysRemaining).toBe(0);

    // Case 3: Checked 2 days overdue -> overdue, high/critical urgency
    const evalOverdue = evaluateItemCadence(mockItem, new Date("2026-09-10T12:00:00.000Z"));
    expect(evalOverdue.isDue).toBe(true);
    expect(evalOverdue.reason).toContain("Overdue by 2 days");

    // Case 4: Out of stock -> always critical
    const outOfStockItem: PantryItem = {
      ...mockItem,
      inStock: false,
    };
    const evalOOS = evaluateItemCadence(outOfStockItem, new Date("2026-09-02T12:00:00.000Z"));
    expect(evalOOS.isDue).toBe(true);
    expect(evalOOS.urgency).toBe("critical");
    expect(evalOOS.reason).toBe("Out of stock in pantry");
  });

  it("ranks suggestions by urgency and excludes items already on shopping list", () => {
    const item1: PantryItem = {
      id: "i1",
      name: "Item 1 (In Stock, Due Today)",
      category: "General",
      inStock: true,
      quantity: 1,
      unit: "items",
      frequencyDays: 7,
      frequencyLabel: "Weekly (7d)",
      lastPurchasedAt: "2026-09-01T12:00:00.000Z",
      nextDueDate: "2026-09-08T12:00:00.000Z",
      inShoppingList: false,
      shoppingListQuantity: 1,
      createdAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-01T12:00:00.000Z",
    };

    const item2: PantryItem = {
      id: "i2",
      name: "Item 2 (Out of stock)",
      category: "General",
      inStock: false,
      quantity: 0,
      unit: "items",
      frequencyDays: 14,
      frequencyLabel: "Every 2 weeks",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: false,
      shoppingListQuantity: 1,
      createdAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-01T12:00:00.000Z",
    };

    const item3: PantryItem = {
      id: "i3",
      name: "Item 3 (Already on Shopping List)",
      category: "General",
      inStock: false,
      quantity: 0,
      unit: "items",
      frequencyDays: 7,
      frequencyLabel: "Weekly",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: true, // Should be omitted!
      shoppingListQuantity: 1,
      createdAt: "2026-09-01T12:00:00.000Z",
      updatedAt: "2026-09-01T12:00:00.000Z",
    };

    const suggestions = generateSuggestions([item1, item2, item3], new Date("2026-09-08T12:00:00.000Z"));
    expect(suggestions.length).toBe(2);
    // Critical (Item 2) must be first
    expect(suggestions[0].item.id).toBe("i2");
    expect(suggestions[0].urgency).toBe("critical");
    // High (Item 1) must be second
    expect(suggestions[1].item.id).toBe("i1");
    expect(suggestions[1].urgency).toBe("high");
  });

  it("sorts suggestions by due date soonest first", () => {
    const sug1: ShoppingSuggestion = {
      item: {
        id: "s1",
        name: "Later Item",
        category: "General",
        inStock: true,
        quantity: 1,
        unit: "item",
        frequencyDays: 14,
        frequencyLabel: "Every 2 weeks",
        lastPurchasedAt: "2026-09-01T12:00:00.000Z",
        nextDueDate: "2026-09-20T12:00:00.000Z",
        inShoppingList: false,
        shoppingListQuantity: 1,
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-01T12:00:00.000Z",
      },
      reason: "Due later",
      urgency: "low",
      daysRemaining: 10,
    };

    const sug2: ShoppingSuggestion = {
      item: {
        id: "s2",
        name: "Sooner Item",
        category: "General",
        inStock: true,
        quantity: 1,
        unit: "item",
        frequencyDays: 7,
        frequencyLabel: "Weekly (7d)",
        lastPurchasedAt: "2026-09-01T12:00:00.000Z",
        nextDueDate: "2026-09-08T12:00:00.000Z",
        inShoppingList: false,
        shoppingListQuantity: 1,
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-01T12:00:00.000Z",
      },
      reason: "Due sooner",
      urgency: "high",
      daysRemaining: 0,
    };

    const sug3: ShoppingSuggestion = {
      item: {
        id: "s3",
        name: "Out of Stock Item (No due date)",
        category: "General",
        inStock: false,
        quantity: 0,
        unit: "item",
        frequencyDays: 0,
        frequencyLabel: "No cadence",
        lastPurchasedAt: null,
        nextDueDate: null,
        inShoppingList: false,
        shoppingListQuantity: 1,
        createdAt: "2026-09-01T12:00:00.000Z",
        updatedAt: "2026-09-01T12:00:00.000Z",
      },
      reason: "Out of stock in pantry",
      urgency: "critical",
      daysRemaining: -999,
    };

    const sorted = sortSuggestionsSoonestFirst([sug1, sug2, sug3]);
    expect(sorted.length).toBe(3);
    // Out of stock item (-Infinity due date) comes first
    expect(sorted[0].item.id).toBe("s3");
    // Sooner item (Sept 8) comes before later item (Sept 20)
    expect(sorted[1].item.id).toBe("s2");
    expect(sorted[2].item.id).toBe("s1");
  });
});

