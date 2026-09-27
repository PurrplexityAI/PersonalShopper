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
