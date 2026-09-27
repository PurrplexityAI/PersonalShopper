import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import CategorySelect from "~~/app/components/CategorySelect.vue";
import PantrySortSelect from "~~/app/components/PantrySortSelect.vue";

describe("CategorySelect component", () => {
  it("renders with default All categories and custom categories", async () => {
    const wrapper = await mountSuspended(CategorySelect, {
      props: {
        categories: ["Produce", "Bakery"],
      },
    });

    expect(wrapper.exists()).toBe(true);
    const trigger = wrapper.find("button");
    expect(trigger.exists()).toBe(true);
    expect(wrapper.text()).toContain("All categories");
  });

  it("allows custom variant and icon", async () => {
    const wrapper = await mountSuspended(CategorySelect, {
      props: {
        variant: "outline",
        icon: "i-lucide-filter",
      },
    });

    const trigger = wrapper.find("button");
    expect(trigger.exists()).toBe(true);
  });
});

describe("PantrySortSelect component", () => {
  it("renders with default Alphabetical (A-z)", async () => {
    const wrapper = await mountSuspended(PantrySortSelect, {
      props: {
        showNextDue: true,
      },
    });

    const trigger = wrapper.find("button");
    expect(trigger.exists()).toBe(true);
    expect(wrapper.text()).toContain("Alphabetical (A-z)");
  });

  it("renders when showNextDue is false", async () => {
    const wrapper = await mountSuspended(PantrySortSelect, {
      props: {
        showNextDue: false,
      },
    });

    const trigger = wrapper.find("button");
    expect(trigger.exists()).toBe(true);
    expect(wrapper.text()).toContain("Alphabetical (A-z)");
  });

  it("supports PascalCase ShowNextDue prop", async () => {
    const wrapper = await mountSuspended(PantrySortSelect, {
      props: {
        ShowNextDue: false,
      },
    });

    const trigger = wrapper.find("button");
    expect(trigger.exists()).toBe(true);
    expect(wrapper.text()).toContain("Alphabetical (A-z)");
  });
});

describe("PantryView component", () => {
  it("renders pantry view and displays pantry item cards", async () => {
    const store = usePantryStore();
    store.items = [
      {
        id: "p1",
        name: "Olive Oil",
        category: "Pantry Staples",
        inStock: true,
        quantity: 1,
        unit: "bottle",
        frequencyDays: 30,
        frequencyLabel: "Monthly (30d)",
        lastPurchasedAt: null,
        nextDueDate: null,
        inShoppingList: false,
        shoppingListQuantity: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const wrapper = await mountSuspended((await import("~~/app/components/PantryView.vue")).default);
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain("Olive Oil");
    expect(wrapper.text()).toContain("Pantry Staples");
    expect(wrapper.findComponent({ name: "PantryItemCard" }).exists()).toBe(true);
  });
});
