import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import ShoppingListItemCard from "~~/app/components/ShoppingListItemCard.vue";
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";

describe("ShoppingListItemCard component", () => {
  const baseItem: PantryItem = {
    id: "shop-item-1",
    name: "Oat Milk",
    category: "Dairy & Eggs",
    inStock: false,
    quantity: 1,
    unit: "cartons",
    frequencyDays: 7,
    frequencyLabel: "Weekly (7d)",
    lastPurchasedAt: "2026-09-20T12:00:00.000Z",
    nextDueDate: "2026-09-27T12:00:00.000Z",
    inShoppingList: true,
    shoppingListQuantity: 2,
    notes: "Barista edition",
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
  };

  it("renders inside UCard body slot without header or footer", async () => {
    const wrapper = await mountSuspended(ShoppingListItemCard, {
      props: { item: baseItem },
    });

    const card = wrapper.findComponent({ name: "UCard" });
    expect(card.exists()).toBe(true);
    // Should not render custom header or footer
    expect(wrapper.find("header").exists()).toBe(false);
    expect(wrapper.find("footer").exists()).toBe(false);
  });

  it("renders item title with text-lg and clicking it opens the edit modal", async () => {
    const wrapper = await mountSuspended(ShoppingListItemCard, {
      props: { item: baseItem },
    });

    const store = usePantryStore();
    const titleButton = wrapper.findAll("button").find((b) => b.text().includes("Oat Milk"));
    expect(titleButton).toBeDefined();
    expect(titleButton?.classes()).toContain("text-lg");
    expect(titleButton?.classes()).toContain("font-semibold");

    await titleButton?.trigger("click");
    expect(store.isItemModalOpen).toBe(true);
    expect(store.editingItem?.id).toBe("shop-item-1");
  });

  it("renders category as muted text-sm and appends note with • separator", async () => {
    const wrapper = await mountSuspended(ShoppingListItemCard, {
      props: { item: baseItem },
    });

    const categoryPara = wrapper.find("p.text-muted");
    expect(categoryPara.exists()).toBe(true);
    expect(categoryPara.classes()).toContain("text-sm");
    expect(categoryPara.text()).toContain("Dairy & Eggs");
    expect(categoryPara.text()).toContain("• Barista edition");

    // Must not put category in a badge
    const badges = wrapper.findAllComponents({ name: "UBadge" });
    expect(badges.length).toBe(0);
  });

  it("renders category without separator when note is absent", async () => {
    const wrapper = await mountSuspended(ShoppingListItemCard, {
      props: {
        item: { ...baseItem, notes: undefined },
      },
    });

    const categoryPara = wrapper.find("p.text-muted");
    expect(categoryPara.exists()).toBe(true);
    expect(categoryPara.text()).toBe("Dairy & Eggs");
    expect(categoryPara.text()).not.toContain("•");
  });

  it("does not render a quantity stepper or quantity input", async () => {
    const wrapper = await mountSuspended(ShoppingListItemCard, {
      props: { item: baseItem },
    });

    const inputs = wrapper.findAll("input");
    expect(inputs.length).toBe(0);
    const fieldGroups = wrapper.findAllComponents({ name: "UFieldGroup" });
    expect(fieldGroups.length).toBe(0);
  });

  describe("Checkbox behavior", () => {
    it("renders unchecked checkbox with tick hidden by default and emits toggle-check on click", async () => {
      const wrapper = await mountSuspended(ShoppingListItemCard, {
        props: { item: baseItem, checked: false },
      });

      const checkboxBtn = wrapper.find("button[aria-label='Tick off']");
      expect(checkboxBtn.exists()).toBe(true);

      const checkIcon = checkboxBtn.findComponent({ name: "UIcon" });
      expect(checkIcon.exists()).toBe(true);
      expect(checkIcon.classes()).toContain("opacity-0");
      expect(checkIcon.classes()).toContain("group-hover/check:opacity-100");

      await checkboxBtn.trigger("click");
      expect(wrapper.emitted("toggle-check")).toBeTruthy();
      expect(wrapper.emitted("toggle-check")?.length).toBe(1);
    });

    it("renders checked checkbox with tick visible and emits toggle-check on click", async () => {
      const wrapper = await mountSuspended(ShoppingListItemCard, {
        props: { item: baseItem, checked: true },
      });

      const checkboxBtn = wrapper.find("button[aria-label='Mark unpurchased']");
      expect(checkboxBtn.exists()).toBe(true);
      expect(checkboxBtn.classes()).toContain("bg-primary");

      const checkIcon = checkboxBtn.findComponent({ name: "UIcon" });
      expect(checkIcon.exists()).toBe(true);
      expect(checkIcon.classes()).toContain("opacity-100");

      await checkboxBtn.trigger("click");
      expect(wrapper.emitted("toggle-check")).toBeTruthy();
    });
  });

  describe("Delete button behavior", () => {
    it("renders delete button by default and clicking it calls deleteFromShoppingList", async () => {
      const wrapper = await mountSuspended(ShoppingListItemCard, {
        props: { item: baseItem, hideDelete: false },
      });

      const store = usePantryStore();
      let deleteCalled = false;
      store.deleteFromShoppingList = async () => {
        deleteCalled = true;
      };

      const deleteBtn = wrapper.find("button[aria-label=\"Didn't buy it\"]");
      expect(deleteBtn.exists()).toBe(true);

      await deleteBtn.trigger("click");
      expect(deleteCalled).toBe(true);
    });

    it("hides delete button when hideDelete prop is true", async () => {
      const wrapper = await mountSuspended(ShoppingListItemCard, {
        props: { item: baseItem, hideDelete: true },
      });

      const deleteBtn = wrapper.find("button[aria-label=\"Didn't buy it\"]");
      expect(deleteBtn.exists()).toBe(false);
    });
  });
});
