import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { nextTick } from "vue";
import ShoppingListView from "~~/app/components/ShoppingListView.vue";
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";

describe("ShoppingListView component", () => {

  const item1: PantryItem = {
    id: "item-1",
    name: "Almond Butter",
    category: "Pantry Staples",
    inStock: false,
    quantity: 1,
    unit: "jar",
    frequencyDays: 14,
    frequencyLabel: "Every 2 weeks",
    lastPurchasedAt: "2026-09-01T12:00:00.000Z",
    nextDueDate: "2026-09-15T12:00:00.000Z",
    inShoppingList: true,
    shoppingListQuantity: 1,
    notes: "Crunchy only",
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
  };

  it("renders 'Shopping list' as section header", async () => {
    const wrapper = await mountSuspended(ShoppingListView);
    expect(wrapper.text()).toContain("Shopping list");
    expect(wrapper.text()).not.toContain("Next Shop List");
  });

  it("renders shopping list items using ShoppingListItemCard", async () => {
    const wrapper = await mountSuspended(ShoppingListView);
    const store = usePantryStore();
    store.items = [item1];
    await nextTick();

    expect(wrapper.text()).toContain("Almond Butter");
    expect(wrapper.text()).toContain("Pantry Staples");
    expect(wrapper.text()).toContain("• Crunchy only");
  });

  describe("Purchased this trip section", () => {
    it("does not render when sessionPurchased is empty", async () => {
      const wrapper = await mountSuspended(ShoppingListView);
      const store = usePantryStore();
      store.items = [item1];
      store.sessionPurchased = [];
      await nextTick();

      expect(wrapper.text()).not.toContain("Purchased this trip");
    });

    it("renders ghost button with count badge and items when sessionPurchased has items", async () => {
      const wrapper = await mountSuspended(ShoppingListView);
      const store = usePantryStore();
      store.items = [item1];
      store.sessionPurchased = [
        { id: "item-1", name: "Almond Butter", timestamp: "12:00" },
      ];
      await nextTick();

      expect(wrapper.text()).toContain("Purchased this trip");
      expect(wrapper.text()).toContain("Clear");

      // Verify count badge shows 1
      const purchasedSection = wrapper.find(".mt-6");
      expect(purchasedSection.exists()).toBe(true);
      expect(purchasedSection.text()).toContain("1");
    });
  });
});
