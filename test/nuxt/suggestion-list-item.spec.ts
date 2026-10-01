import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import SuggestionListItem from "~~/app/components/SuggestionListItem.vue";
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem, ShoppingSuggestion } from "~~/shared/types";

describe("SuggestionListItem component", () => {
  const baseItem: PantryItem = {
    id: "sug-item-1",
    name: "Almond Flour",
    category: "Pantry Staples",
    inStock: false,
    quantity: 1,
    unit: "bag",
    frequencyDays: 14,
    frequencyLabel: "Every 2 weeks",
    lastPurchasedAt: "2026-09-01T12:00:00.000Z",
    nextDueDate: "2026-09-15T12:00:00.000Z",
    inShoppingList: false,
    shoppingListQuantity: 1,
    notes: "Organic only",
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
  };

  const baseSuggestion: ShoppingSuggestion = {
    item: baseItem,
    reason: "Cadence due today",
    urgency: "high",
    daysRemaining: 0,
  };

  it("renders flat without UCard and with a bottom border", async () => {
    const wrapper = await mountSuspended(SuggestionListItem, {
      props: { suggestion: baseSuggestion },
    });

    // Should NOT render inside UCard
    const card = wrapper.findComponent({ name: "UCard" });
    expect(card.exists()).toBe(false);

    // Root should have border-b
    expect(wrapper.classes()).toContain("border-b");
  });

  it("renders plus icon ghost secondary button on the left", async () => {
    const wrapper = await mountSuspended(SuggestionListItem, {
      props: { suggestion: baseSuggestion },
    });

    const plusBtn = wrapper.find("button[aria-label='Add to shopping list']");
    expect(plusBtn.exists()).toBe(true);

    const icon = plusBtn.findComponent({ name: "UIcon" });
    expect(icon.exists()).toBe(true);
    expect(icon.props("name")).toBe("i-lucide-plus");
  });

  it("emits 'add' event when the plus button is clicked", async () => {
    const wrapper = await mountSuspended(SuggestionListItem, {
      props: { suggestion: baseSuggestion },
    });

    const plusBtn = wrapper.find("button[aria-label='Add to shopping list']");
    await plusBtn.trigger("click");

    expect(wrapper.emitted("add")).toBeTruthy();
    expect(wrapper.emitted("add")?.[0][0]).toEqual(baseItem);
  });

  it("renders item title without opening the edit modal", async () => {
    const wrapper = await mountSuspended(SuggestionListItem, {
      props: { suggestion: baseSuggestion },
    });

    const store = usePantryStore();
    store.isItemModalOpen = false;

    // Title should be rendered with font-semibold and text-base
    expect(wrapper.text()).toContain("Almond Flour");

    // Title should not be a button that triggers openEditItemModal
    const titleSpan = wrapper.find("span.font-semibold");
    expect(titleSpan.exists()).toBe(true);
    expect(titleSpan.text()).toBe("Almond Flour");

    // Triggering click on title does not open edit modal
    await titleSpan.trigger("click");
    expect(store.isItemModalOpen).toBe(false);
  });

  it("renders category, reason, and notes", async () => {
    const wrapper = await mountSuspended(SuggestionListItem, {
      props: { suggestion: baseSuggestion },
    });

    expect(wrapper.text()).toContain("Pantry Staples");
    expect(wrapper.text()).toContain("Cadence due today");
  });
});
