import { describe, it, expect, vi } from "vitest";
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
        autoFrequency: true,
        lastSuggestedAt: null,
        lastPurchasedAt: null,
        lastPurchasedAtPrevious: null,
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

    // Verify sentence-cased status filter buttons
    expect(wrapper.text()).toContain("All items");
    expect(wrapper.text()).toContain("In stock");
    expect(wrapper.text()).toContain("Out of stock");
    expect(wrapper.text()).toContain("Due for restock");
    expect(wrapper.text()).not.toContain("All Items");
    expect(wrapper.text()).not.toContain("In Stock (");
  });

  it("resets viewport display to top when filter changes", async () => {
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const store = usePantryStore();
    await mountSuspended((await import("~~/app/components/PantryView.vue")).default);

    store.searchQuery = "Coffee";
    await nextTick();

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
    scrollToSpy.mockRestore();
  });

  it("only applies border and shadow to sticky panel when scrolled past top", async () => {
    const wrapper = await mountSuspended((await import("~~/app/components/PantryView.vue")).default);
    const stickyPanel = wrapper.find(".sticky");
    expect(stickyPanel.exists()).toBe(true);
    expect(stickyPanel.classes()).toContain("shadow-none");
    expect(stickyPanel.classes()).toContain("border-transparent");
    expect(stickyPanel.classes()).not.toContain("shadow-xs");
  });
});

describe("AppScreenHeader component", () => {
  it("renders screen title in text-xl and context menu button", async () => {
    const AppScreenHeader = (await import("~~/app/components/AppScreenHeader.vue")).default;
    const wrapper = await mountSuspended(AppScreenHeader, {
      props: {
        title: "Pantry",
      },
    });

    expect(wrapper.find("h1").exists()).toBe(true);
    expect(wrapper.find("h1").text()).toBe("Pantry");
    expect(wrapper.find("h1").classes()).toContain("text-xl");

    const contextBtn = wrapper.find("button[aria-label='Screen context menu']");
    expect(contextBtn.exists()).toBe(true);
  });
});
