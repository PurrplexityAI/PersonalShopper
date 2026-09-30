import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";

describe("Pinia Pantry Store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("initializes with default state", () => {
    const store = usePantryStore();
    expect(store.items).toEqual([]);
    expect(store.activeTab).toBe("shopping");
    expect(store.searchQuery).toBe("");
    expect(store.selectedCategory).toBeNull();
    expect(store.stockFilter).toBe("all");
    expect(store.shoppingList).toEqual([]);
    expect(store.suggestions).toEqual([]);
  });

  it("computes shoppingList and stock counts correctly", () => {
    const store = usePantryStore();

    const item1: PantryItem = {
      id: "1",
      name: "Oat Milk",
      category: "Dairy & Eggs",
      inStock: true,
      quantity: 2,
      unit: "cartons",
      frequencyDays: 7,
      frequencyLabel: "Weekly (7d)",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: true,
      shoppingListQuantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const item2: PantryItem = {
      id: "2",
      name: "Apples",
      category: "Produce",
      inStock: false,
      quantity: 0,
      unit: "bag",
      frequencyDays: 5,
      frequencyLabel: "Every 5 days",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: false,
      shoppingListQuantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.items = [item1, item2];

    expect(store.totalCount).toBe(2);
    expect(store.inStockCount).toBe(1);
    expect(store.outOfStockCount).toBe(1);
    expect(store.shoppingList.length).toBe(1);
    expect(store.shoppingList[0].id).toBe("1");
    // Since item2 is out of stock, it should generate a suggestion
    expect(store.suggestions.length).toBe(1);
    expect(store.suggestions[0].item.id).toBe("2");
  });

  it("filters items properly based on search query, category, and status", () => {
    const store = usePantryStore();

    store.items = [
      {
        id: "1",
        name: "Whole Grain Sourdough",
        category: "Bakery",
        inStock: true,
        quantity: 1,
        unit: "loaf",
        frequencyDays: 7,
        frequencyLabel: "Weekly",
        lastPurchasedAt: null,
        nextDueDate: null,
        inShoppingList: false,
        shoppingListQuantity: 1,
        notes: "Rustic loaf",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        name: "Whole Milk",
        category: "Dairy & Eggs",
        inStock: false,
        quantity: 0,
        unit: "bottle",
        frequencyDays: 7,
        frequencyLabel: "Weekly",
        lastPurchasedAt: null,
        nextDueDate: null,
        inShoppingList: false,
        shoppingListQuantity: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Filter by search query
    store.searchQuery = "sourdough";
    expect(store.filteredItems.length).toBe(1);
    expect(store.filteredItems[0].name).toBe("Whole Grain Sourdough");

    // Filter by category
    store.searchQuery = "";
    store.selectedCategory = "Dairy & Eggs";
    expect(store.filteredItems.length).toBe(1);
    expect(store.filteredItems[0].name).toBe("Whole Milk");

    // Filter by stock status
    store.selectedCategory = null;
    store.stockFilter = "out-of-stock";
    expect(store.filteredItems.length).toBe(1);
    expect(store.filteredItems[0].name).toBe("Whole Milk");

    store.stockFilter = "in-stock";
    expect(store.filteredItems.length).toBe(1);
    expect(store.filteredItems[0].name).toBe("Whole Grain Sourdough");
  });

  it("handles modal controls correctly", () => {
    const store = usePantryStore();

    store.openAddItemModal();
    expect(store.isItemModalOpen).toBe(true);
    expect(store.editingItem).toBeNull();

    const mockItem: PantryItem = {
      id: "item-123",
      name: "Honey",
      category: "Pantry Staples",
      inStock: true,
      quantity: 1,
      unit: "jar",
      frequencyDays: 30,
      frequencyLabel: "Monthly",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: false,
      shoppingListQuantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.openEditItemModal(mockItem);
    expect(store.isItemModalOpen).toBe(true);
    expect(store.editingItem?.id).toBe("item-123");

    store.closeItemModal();
    expect(store.isItemModalOpen).toBe(false);
    expect(store.editingItem).toBeNull();
  });

  it("handles setStock correctly", async () => {
    const store = usePantryStore();
    const item: PantryItem = {
      id: "stock-1",
      name: "Eggs",
      category: "Dairy & Eggs",
      inStock: true,
      quantity: 12,
      unit: "pack",
      frequencyDays: 7,
      frequencyLabel: "Weekly",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: false,
      shoppingListQuantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.items = [item];

    let toggleCalled = false;
    store.toggleStock = async () => {
      toggleCalled = true;
    };

    // When already in stock, setting inStock: true should be a no-op
    await store.setStock("stock-1", true);
    expect(toggleCalled).toBe(false);

    // When in stock, setting inStock: false should call toggleStock
    await store.setStock("stock-1", false);
    expect(toggleCalled).toBe(true);
  });

  it("handles sessionPurchased management and clearSessionPurchased", () => {
    const store = usePantryStore();
    store.sessionPurchased = [
      { id: "1", name: "Milk", timestamp: "10:00" },
      { id: "2", name: "Bread", timestamp: "10:05" },
    ];
    expect(store.sessionPurchased.length).toBe(2);

    store.clearSessionPurchased();
    expect(store.sessionPurchased).toEqual([]);
  });

  it("handles checkOffShoppingItem by unshifting to sessionPurchased and deduplicating", async () => {
    const store = usePantryStore();
    const fetchMock = vi.fn().mockResolvedValue({ success: true });
    vi.stubGlobal("$fetch", fetchMock);
    store.loadData = vi.fn().mockResolvedValue(undefined);

    const item1: PantryItem = {
      id: "item-1",
      name: "Milk",
      category: "Dairy",
      inStock: false,
      quantity: 1,
      unit: "bottle",
      frequencyDays: 7,
      frequencyLabel: "Weekly",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: true,
      shoppingListQuantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const item2: PantryItem = {
      id: "item-2",
      name: "Bread",
      category: "Bakery",
      inStock: false,
      quantity: 1,
      unit: "loaf",
      frequencyDays: 5,
      frequencyLabel: "5 days",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: true,
      shoppingListQuantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Check off first item
    await store.checkOffShoppingItem(item1);
    expect(store.sessionPurchased.length).toBe(1);
    expect(store.sessionPurchased[0].id).toBe("item-1");

    // Check off second item -> should be unshifted to index 0
    await store.checkOffShoppingItem(item2);
    expect(store.sessionPurchased.length).toBe(2);
    expect(store.sessionPurchased[0].id).toBe("item-2");
    expect(store.sessionPurchased[1].id).toBe("item-1");

    // Check off first item again -> deduplicated and moved to index 0
    await store.checkOffShoppingItem(item1);
    expect(store.sessionPurchased.length).toBe(2);
    expect(store.sessionPurchased[0].id).toBe("item-1");
    expect(store.sessionPurchased[1].id).toBe("item-2");

    vi.unstubAllGlobals();
  });

  it("handles uncheckShoppingItem by removing from sessionPurchased", async () => {
    const store = usePantryStore();
    store.loadData = vi.fn().mockResolvedValue(undefined);

    store.sessionPurchased = [
      { id: "item-1", name: "Milk", timestamp: "10:00" },
      { id: "item-2", name: "Bread", timestamp: "10:05" },
    ];

    const item1: PantryItem = {
      id: "item-1",
      name: "Milk",
      category: "Dairy",
      inStock: true,
      quantity: 1,
      unit: "bottle",
      frequencyDays: 7,
      frequencyLabel: "Weekly",
      lastPurchasedAt: null,
      nextDueDate: null,
      inShoppingList: false,
      shoppingListQuantity: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await store.uncheckShoppingItem(item1);
    expect(store.sessionPurchased.length).toBe(1);
    expect(store.sessionPurchased[0].id).toBe("item-2");
  });
});
