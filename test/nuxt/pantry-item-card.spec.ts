import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import PantryItemCard from "~~/app/components/PantryItemCard.vue";
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";

describe("PantryItemCard component", () => {
  const baseItem: PantryItem = {
    id: "item-1",
    name: "Almond Milk",
    category: "Dairy & Eggs",
    inStock: true,
    quantity: 2,
    unit: "cartons",
    frequencyDays: 7,
    frequencyLabel: "Weekly (7d)",
    lastPurchasedAt: "2026-09-20T12:00:00.000Z",
    nextDueDate: "2026-10-15T12:00:00.000Z", // In future -> In stock
    inShoppingList: false,
    shoppingListQuantity: 1,
    notes: "Keep refrigerated once opened",
    createdAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
  };

  it("renders item title on its own line with text-lg and clicking it opens the edit modal", async () => {
    const wrapper = await mountSuspended(PantryItemCard, {
      props: { item: baseItem },
    });

    const store = usePantryStore();
    const titleButton = wrapper.find("button");
    expect(titleButton.exists()).toBe(true);
    expect(titleButton.text()).toBe("Almond Milk");
    expect(titleButton.classes()).toContain("text-lg");

    await titleButton.trigger("click");
    expect(store.isItemModalOpen).toBe(true);
    expect(store.editingItem?.id).toBe("item-1");
  });

  it("renders category on its own line as text-sm muted text and not in a badge", async () => {
    const wrapper = await mountSuspended(PantryItemCard, {
      props: { item: baseItem },
    });

    // Category should be rendered as muted text with text-sm
    const categoryEl = wrapper.find("p.text-muted");
    expect(categoryEl.exists()).toBe(true);
    expect(categoryEl.classes()).toContain("text-sm");
    expect(categoryEl.text()).toBe("Dairy & Eggs");

    // Must not be in a badge
    const badges = wrapper.findAllComponents({ name: "UBadge" });
    const hasCategoryBadge = badges.some((b) => b.text().includes("Dairy & Eggs"));
    expect(hasCategoryBadge).toBe(false);
  });

  it("does not render quantity in the component", async () => {
    const wrapper = await mountSuspended(PantryItemCard, {
      props: { item: baseItem },
    });

    expect(wrapper.text()).not.toContain("2 cartons");
  });

  describe("In stock status chip & label", () => {
    it("displays 'In stock' when item is in stock, not due, and not on shopping list", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: {
          item: {
            ...baseItem,
            inStock: true,
            inShoppingList: false,
            nextDueDate: "2099-01-01T12:00:00.000Z",
          },
        },
      });

      expect(wrapper.text()).toContain("In stock");
      const chip = wrapper.findComponent({ name: "UChip" });
      expect(chip.exists()).toBe(true);
      expect(chip.props("color")).toBe("success");
    });

    it("displays 'Out of stock' when item is not in stock and not on shopping list", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: {
          item: {
            ...baseItem,
            inStock: false,
            inShoppingList: false,
          },
        },
      });

      expect(wrapper.text()).toContain("Out of stock");
      const chip = wrapper.findComponent({ name: "UChip" });
      expect(chip.exists()).toBe(true);
      expect(chip.props("color")).toBe("error");
    });

    it("displays 'Due for restock' when item is in stock, due, and not on shopping list", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: {
          item: {
            ...baseItem,
            inStock: true,
            inShoppingList: false,
            nextDueDate: "2020-01-01T12:00:00.000Z", // Past date -> overdue
          },
        },
      });

      expect(wrapper.text()).toContain("Due for restock");
      const chip = wrapper.findComponent({ name: "UChip" });
      expect(chip.exists()).toBe(true);
      expect(chip.props("color")).toBe("warning");
    });

    it("displays 'In stock, on shopping list' when item is in stock and on the shopping list", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: {
          item: {
            ...baseItem,
            inStock: true,
            inShoppingList: true,
          },
        },
      });

      expect(wrapper.text()).toContain("In stock, on shopping list");
      const chip = wrapper.findComponent({ name: "UChip" });
      expect(chip.exists()).toBe(true);
      expect(chip.props("color")).toBe("primary");
    });

    it("displays 'Out of stock, on shopping list' when item is out of stock and on the shopping list", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: {
          item: {
            ...baseItem,
            inStock: false,
            inShoppingList: true,
          },
        },
      });

      expect(wrapper.text()).toContain("Out of stock, on shopping list");
      const chip = wrapper.findComponent({ name: "UChip" });
      expect(chip.exists()).toBe(true);
      expect(chip.props("color")).toBe("error");
    });
  });

  describe("Dropdown Menu and Actions", () => {
    it("renders UDropdownMenu with only Mark out of stock when item is in stock", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: { item: { ...baseItem, inStock: true } },
      });

      const dropdown = wrapper.findComponent({ name: "UDropdownMenu" });
      expect(dropdown.exists()).toBe(true);

      const items = dropdown.props("items") as Array<{ label: string; icon: string }>;
      expect(items).toBeDefined();

      const labels = items.map((i) => i.label);
      expect(labels).toContain("Edit");
      expect(labels).toContain("Mark out of stock");
      expect(labels).not.toContain("Mark in stock");
      expect(labels).toContain("Delete");
    });

    it("renders UDropdownMenu with only Mark in stock when item is out of stock", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: { item: { ...baseItem, inStock: false } },
      });

      const dropdown = wrapper.findComponent({ name: "UDropdownMenu" });
      const items = dropdown.props("items") as Array<{ label: string; icon: string }>;
      const labels = items.map((i) => i.label);

      expect(labels).toContain("Edit");
      expect(labels).toContain("Mark in stock");
      expect(labels).not.toContain("Mark out of stock");
      expect(labels).toContain("Delete");
    });
  });

  describe("Card body labels order and format", () => {
    it("renders Next due, Last bought, Frequency, and Note in order", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: { item: baseItem },
      });

      const bodyText = wrapper.find(".space-y-2").text();
      expect(bodyText).toContain("Due");
      expect(bodyText).toContain("Bought");
      expect(bodyText).toContain("Repeats weekly (7d)");
      expect(bodyText).toContain("Keep refrigerated once opened");
    });

    it("omits the note row when notes is empty or undefined", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: {
          item: { ...baseItem, notes: undefined },
        },
      });

      expect(wrapper.text()).not.toContain("Keep refrigerated");
    });
  });

  describe("Card footer action button", () => {
    it("renders 'Add to shopping list' button (solid primary, plus icon) when inShoppingList is false", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: {
          item: { ...baseItem, inShoppingList: false },
        },
      });

      const buttons = wrapper.findAllComponents({ name: "UButton" });
      const addButton = buttons.find((b) => b.text().includes("Add to shopping list"));
      expect(addButton?.exists()).toBe(true);
      expect(addButton?.props("color")).toBe("primary");
      expect(addButton?.props("variant")).toBe("solid");
      expect(addButton?.props("icon")).toBe("i-lucide-plus");
    });

    it("renders 'Remove from shopping list' button (ghost neutral, minus icon) when inShoppingList is true", async () => {
      const wrapper = await mountSuspended(PantryItemCard, {
        props: {
          item: { ...baseItem, inShoppingList: true },
        },
      });

      const buttons = wrapper.findAllComponents({ name: "UButton" });
      const removeButton = buttons.find((b) => b.text().includes("Remove from shopping list"));
      expect(removeButton?.exists()).toBe(true);
      expect(removeButton?.props("color")).toBe("neutral");
      expect(removeButton?.props("variant")).toBe("ghost");
      expect(removeButton?.props("icon")).toBe("i-lucide-minus");
    });
  });
});
