<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import { useFocus } from "@vueuse/core";
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";
import { sortPantryItems, type PantrySortOption } from "~~/app/utils/sort";
import { CADENCE_OPTIONS } from "~~/app/utils/cadence";
import AppScreenHeader from "./AppScreenHeader.vue";
import CategorySelect from "./CategorySelect.vue";
import PantrySortSelect from "./PantrySortSelect.vue";
import ShoppingListItemCard from "./ShoppingListItemCard.vue";

const store = usePantryStore();

const selectedCategory = ref<string | null>(null);
const sortBy = ref<PantrySortOption>("alpha-asc");

const filteredShoppingList = computed(() => {
  return store.shoppingList.filter((item) => {
    if (selectedCategory.value !== null && item.category !== selectedCategory.value) {
      return false;
    }
    return true;
  });
});

const displayedShoppingList = computed(() => {
  return sortPantryItems(filteredShoppingList.value, sortBy.value);
});

// Quick Add State
const quickInput = ref("");
const showSuggestions = ref(true);

const newCategory = ref("General");
const hasChosenNewCategory = ref(false);

const newCadence = ref(30); // Default to Monthly (30d)
const hasChosenNewCadence = ref(false);

const isDesktopInputFocused = ref(false);
const desktopInputRef = ref<{ inputRef?: HTMLInputElement | null; $el?: HTMLElement } | null>(null);

const desktopInputElement = computed(() => {
  return desktopInputRef.value?.inputRef || desktopInputRef.value?.$el?.querySelector("input") || null;
});

function focusDesktopInput() {
  nextTick(() => {
    isDesktopInputFocused.value = true;
    desktopInputElement.value?.focus();
  });
  setTimeout(() => {
    desktopInputElement.value?.focus();
  }, 50);
}

const isMobileDrawerOpen = ref(false);
const mobileInputRef = ref<{ inputRef?: HTMLInputElement | null; $el?: HTMLElement } | null>(null);

const mobileInputElement = computed(() => {
  return mobileInputRef.value?.inputRef || mobileInputRef.value?.$el?.querySelector("input") || null;
});

const { focused: isMobileInputFocused } = useFocus(mobileInputElement);

watch(isMobileDrawerOpen, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      isMobileInputFocused.value = true;
      mobileInputElement.value?.focus();
    }, 400);
  }
});

const availableCategories = computed(() => {
  const defaultCats = [
    "General",
    "Produce",
    "Dairy & Eggs",
    "Bakery",
    "Meat & Seafood",
    "Pantry Staples",
    "Beverages",
    "Snacks",
    "Household",
    "Personal Care",
  ];
  return Array.from(new Set([...defaultCats, ...store.categories])).filter(Boolean);
});

const categoryMenuItems = computed(() => [
  availableCategories.value.map((cat) => ({
    label: cat,
    type: "checkbox" as const,
    checked: newCategory.value === cat,
    onSelect: () => {
      newCategory.value = cat;
      hasChosenNewCategory.value = true;
    },
  })),
]);

const cadenceMenuItems = computed(() => [
  CADENCE_OPTIONS.map((opt) => ({
    label: opt.label,
    type: "checkbox" as const,
    checked: newCadence.value === opt.days,
    onSelect: () => {
      newCadence.value = opt.days;
      hasChosenNewCadence.value = true;
    },
  })),
]);

const selectedCadenceLabel = computed(() => {
  const found = CADENCE_OPTIONS.find((opt) => opt.days === newCadence.value);
  return found?.label || `${newCadence.value}d`;
});

function resetInput() {
  quickInput.value = "";
  newCategory.value = "General";
  hasChosenNewCategory.value = false;
  newCadence.value = 30;
  hasChosenNewCadence.value = false;
  isMobileDrawerOpen.value = false;
}

function smoothScrollToItem(itemId: string) {
  // If target item is in a category that's filtered out, clear filter so the card is rendered
  const target = store.shoppingList.find((i) => i.id === itemId);
  if (target && selectedCategory.value !== null && target.category !== selectedCategory.value) {
    selectedCategory.value = null;
  }

  nextTick(() => {
    const el = document.getElementById(`shopping-item-${itemId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "transition-all");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary");
      }, 1800);
    }
  });
}

async function selectItem(item: PantryItem, e?: Event) {
  e?.preventDefault();
  if (selectedCategory.value !== null && selectedCategory.value !== item.category) {
    selectedCategory.value = null;
  }
  if (item.inShoppingList) {
    smoothScrollToItem(item.id);
  } else {
    const added = await store.addToShoppingList({ nameOrId: item.id, quantity: 1 });
    if (added) {
      smoothScrollToItem(added.id);
    } else {
      smoothScrollToItem(item.id);
    }
  }
  nextTick(() => {
    resetInput();
    focusDesktopInput();
  });
  setTimeout(() => {
    resetInput();
    focusDesktopInput();
  }, 50);
}

const autocompleteItems = computed(() => {
  return store.items.map((item) => ({
    label: item.name,
    value: item.name,
    onSelect: (e?: Event) => {
      selectItem(item, e);
    },
  }));
});

async function handleSubmitInput() {
  const trimmed = quickInput.value.trim();
  if (!trimmed) return;

  // 1. If already in shopping list -> smooth scroll to it
  const existingOnShoppingList = store.shoppingList.find(
    (i) => i.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existingOnShoppingList) {
    if (selectedCategory.value !== null && selectedCategory.value !== existingOnShoppingList.category) {
      selectedCategory.value = null;
    }
    smoothScrollToItem(existingOnShoppingList.id);
    resetInput();
    focusDesktopInput();
    return;
  }

  // 2. If exists in pantry (not yet in shopping list) -> add it
  const existingInPantry = store.items.find(
    (i) => i.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existingInPantry) {
    if (selectedCategory.value !== null && selectedCategory.value !== existingInPantry.category) {
      selectedCategory.value = null;
    }
    const added = await store.addToShoppingList({ nameOrId: existingInPantry.id, quantity: 1 });
    if (added) {
      smoothScrollToItem(added.id);
    } else {
      smoothScrollToItem(existingInPantry.id);
    }
    resetInput();
    focusDesktopInput();
    return;
  }

  // 3. Brand new item -> create in pantry & add to shopping list
  if (selectedCategory.value !== null && selectedCategory.value !== newCategory.value) {
    selectedCategory.value = null;
  }
  const added = await store.addToShoppingList({
    nameOrId: trimmed,
    quantity: 1,
    category: newCategory.value,
    frequencyDays: newCadence.value,
  });
  if (added) {
    smoothScrollToItem(added.id);
  }
  resetInput();
  focusDesktopInput();
}

function openMobileDrawer() {
  resetInput();
  isMobileDrawerOpen.value = true;
}

async function handleAddAllSuggestions() {
  const ids = store.suggestions.map((s) => s.item.id);
  if (ids.length > 0) {
    await store.addBulkToShoppingList(ids);
  }
}

const isPurchasedOpen = ref(true);

const purchasedItems = computed<PantryItem[]>(() => {
  return store.sessionPurchased
    .map((s) => {
      const found = store.items.find((item) => item.id === s.id);
      if (found) return found;
      return {
        id: s.id,
        name: s.name,
        category: "Other",
        inStock: true,
        quantity: 1,
        unit: "item",
        frequencyDays: 7,
        frequencyLabel: "Weekly (7d)",
        lastPurchasedAt: new Date().toISOString(),
        nextDueDate: null,
        inShoppingList: false,
        shoppingListQuantity: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as PantryItem;
    });
});

async function handleCheckOff(item: PantryItem) {
  if (store.sessionPurchased.length === 0) {
    isPurchasedOpen.value = true;
  }
  await store.checkOffShoppingItem(item);
}

async function handleUncheck(item: PantryItem) {
  await store.uncheckShoppingItem(item);
}
</script>

<template>
  <div class="space-y-4 pb-36 sm:pb-36">
    <!-- Screen Header Component (Desktop Category & Sort in Actions Slot) -->
    <div class="space-y-4">
      <AppScreenHeader title="Shopping list">
        <template #actions>
          <div class="hidden sm:flex items-center gap-2">
            <CategorySelect
              v-model="selectedCategory"
              class="w-48"
            />
            <PantrySortSelect
              v-model="sortBy"
              :show-next-due="false"
              class="w-48"
            />
          </div>
        </template>
      </AppScreenHeader>

      <!-- Mobile Category & Sort Beneath Title -->
      <div class="sm:hidden flex items-center gap-2 w-full min-w-0">
        <CategorySelect
          v-model="selectedCategory"
          class="flex-1 min-w-0"
        />
        <PantrySortSelect
          v-model="sortBy"
          :show-next-due="false"
          class="flex-1 min-w-0"
        />
      </div>
    </div>
      <!-- Cadence Suggestions Section -->
    <div
      v-if="store.suggestions.length > 0"
      class="bg-warning/10 border border-warning/30 rounded-2xl p-4 shadow-xs transition-all"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-xl bg-warning text-inverted flex items-center justify-center shadow-xs">
            <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
          </div>
          <div>
            <h3 class="font-bold text-highlighted flex items-center space-x-2">
              <span>Smart Cadence Suggestions</span>
              <UBadge
                color="warning"
                variant="subtle"
                size="md"
              >
                {{ store.suggestions.length }} due
              </UBadge>
            </h3>
            <p class="text-muted">
              Items due for replenishment based on your purchase frequency
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <UButton
            color="warning"
            variant="solid"
            size="md"
            class="hidden sm:inline-flex"
            @click="handleAddAllSuggestions"
          >
            <span>Add All ({{ store.suggestions.length }})</span>
            <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
          </UButton>
          <UButton
            color="warning"
            variant="ghost"
            size="md"
            :icon="showSuggestions ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            :title="showSuggestions ? 'Collapse' : 'Expand'"
            :aria-label="showSuggestions ? 'Collapse suggestions' : 'Expand suggestions'"
            @click="showSuggestions = !showSuggestions"
          />
        </div>
      </div>

      <!-- Suggestions Carousel -->
      <div v-if="showSuggestions" class="mt-3 pt-3 border-t border-warning/30 space-y-2">
        <div class="sm:hidden mb-2">
          <UButton
            color="warning"
            variant="solid"
            block
            size="md"
            @click="handleAddAllSuggestions"
          >
            <span>Add All ({{ store.suggestions.length }}) Due Items</span>
            <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
          </UButton>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div
            v-for="sug in store.suggestions"
            :key="sug.item.id"
            class="bg-default/90 border border-default rounded-xl p-3 flex items-center justify-between shadow-2xs"
          >
            <div class="min-w-0 pr-2">
              <div class="font-semibold text-highlighted truncate">
                {{ sug.item.name }}
              </div>
              <div class="flex items-center space-x-1.5 text-muted font-medium mt-1">
                <UBadge
                  :color="sug.urgency === 'critical' ? 'error' : 'warning'"
                  variant="subtle"
                  size="md"
                >
                  {{ sug.reason }}
                </UBadge>
                <span class="text-dimmed">• {{ sug.item.frequencyLabel }}</span>
              </div>
            </div>

            <UButton
              color="primary"
              variant="subtle"
              size="md"
              icon="i-lucide-plus"
              label="Add"
              @click="store.addToShoppingList({ nameOrId: sug.item.id, quantity: 1 })"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Active Shopping List Items -->
    <div class="space-y-3">
      <!-- Empty State: Entire Shopping List is Empty -->
      <div
        v-if="store.shoppingList.length === 0"
        class="bg-default rounded-2xl border border-default p-8 text-center space-y-3"
      >
        <div class="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <UIcon name="i-lucide-shopping-bag" class="w-7 h-7" />
        </div>
        <div>
          <h3 class="font-bold text-highlighted">Your shopping list is clear!</h3>
          <p class="text-muted mt-1 max-w-sm mx-auto">
            All pantry items are stocked, or you're ready to plan your next shop. Use the input bar below or select from Cadence Suggestions.
          </p>
        </div>
        <UButton
          v-if="store.suggestions.length > 0"
          color="warning"
          variant="solid"
          size="md"
          icon="i-lucide-sparkles"
          @click="handleAddAllSuggestions"
        >
          Add {{ store.suggestions.length }} Cadence Due Items
        </UButton>
      </div>

      <!-- Empty State: Filtered Category has No Items -->
      <div
        v-else-if="displayedShoppingList.length === 0"
        class="bg-default rounded-2xl border border-default p-8 text-center space-y-3"
      >
        <div class="w-12 h-12 rounded-full bg-muted text-muted mx-auto flex items-center justify-center">
          <UIcon name="i-lucide-tag" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-bold text-highlighted">No shopping items in "{{ selectedCategory }}"</h3>
          <p class="text-muted mt-1">
            You have items on your shopping list, but none match this category filter.
          </p>
        </div>
        <UButton
          color="primary"
          variant="subtle"
          size="md"
          @click="selectedCategory = null"
        >
          Show All Categories
        </UButton>
      </div>

      <!-- Item Rows -->
      <div v-else class="space-y-2">
        <ShoppingListItemCard
          v-for="item in displayedShoppingList"
          :id="`shopping-item-${item.id}`"
          :key="item.id"
          :item="item"
          @toggle-check="handleCheckOff(item)"
        />
      </div>
    </div>

    <!-- Purchased This Trip (Session History) -->
    <div v-if="store.sessionPurchased.length > 0" class="mt-6 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UButton
            color="secondary"
            variant="solid"
            size="md"
            :trailing-icon="isPurchasedOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            label="Purchased this trip"
            @click="isPurchasedOpen = !isPurchasedOpen"
          />
          <UBadge
            color="neutral"
            variant="soft"
            size="md"
          >
            {{ store.sessionPurchased.length }} item(s)
          </UBadge>
        </div>

        <UButton
          color="neutral"
          variant="link"
          size="md"
          class="text-muted hover:text-highlighted p-0 cursor-pointer"
          @click="store.clearSessionPurchased()"
        >
          Clear
        </UButton>
      </div>

      <UCollapsible v-model:open="isPurchasedOpen">
        <template #content>
          <div class="space-y-2 pt-1">
            <ShoppingListItemCard
              v-for="item in purchasedItems"
              :key="item.id"
              :item="item"
              :checked="true"
              :hide-delete="true"
              @toggle-check="handleUncheck(item)"
            />
          </div>
        </template>
      </UCollapsible>
    </div>

    <!-- Desktop Add Item Fixed Bottom Bar (Fixed to bottom, bg-muted provides clipping, generous top padding) -->
    <div class="hidden sm:block fixed bottom-0 left-0 right-0 z-30 bg-muted pt-4 pb-4">
      <div class="max-w-5xl w-full mx-auto px-4">
        <!-- Unified Input Box with buttons side-by-side inside so input respects space occupied by buttons -->
        <div
          class="flex items-center w-full bg-default rounded-xl ring ring-default focus-within:ring-primary shadow-sm transition-all p-1 gap-2"
          :class="{ 'ring-primary': isDesktopInputFocused }"
        >
          <UInputMenu
            ref="desktopInputRef"
            v-model="quickInput"
            mode="autocomplete"
            type="search"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="sentences"
            spellcheck="false"
            name="desktop-add-shopping-item"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            :items="quickInput.trim() ? autocompleteItems : []"
            value-key="value"
            :content="{ side: 'top', align: 'start', hideWhenEmpty: true }"
            placeholder="Add an item to the shopping list"
            :icon="isDesktopInputFocused ? 'i-lucide-circle' : 'i-lucide-plus'"
            variant="none"
            size="lg"
            class="flex-1 min-w-0"
            @focus="isDesktopInputFocused = true"
            @blur="isDesktopInputFocused = false"
            @keydown.enter.prevent="handleSubmitInput"
          />

          <!-- Action buttons inline inside container, respecting text area -->
          <div v-if="quickInput.trim().length > 0" class="flex items-center gap-1.5 shrink-0 pe-2">
            <!-- Category Dropdown Button -->
            <UDropdownMenu :items="categoryMenuItems">
              <UButton
                color="neutral"
                variant="subtle"
                size="xs"
                icon="i-lucide-tag"
                :label="hasChosenNewCategory ? newCategory : undefined"
                title="Category"
              />
            </UDropdownMenu>

            <!-- Cadence Dropdown Button -->
            <UDropdownMenu :items="cadenceMenuItems">
              <UButton
                color="neutral"
                variant="subtle"
                size="xs"
                icon="i-lucide-repeat"
                :label="hasChosenNewCadence ? selectedCadenceLabel : undefined"
                title="Cadence frequency"
              />
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Floating Action Button (FAB) -->
    <div class="sm:hidden fixed right-4 bottom-20 z-30">
      <UButton
        color="primary"
        variant="solid"
        size="xl"
        icon="i-lucide-plus"
        class="rounded-full shadow-lg h-14 w-14 flex items-center justify-center p-0"
        aria-label="Add Shopping Item"
        @click="openMobileDrawer"
      />
    </div>

    <!-- Mobile Add Item Bottom Drawer (no handle, useFocus for input, reset on open) -->
    <UDrawer
      v-model:open="isMobileDrawerOpen"
      direction="bottom"
      :handle="false"
      :ui="{ container: 'p-4 gap-3' }"
    >
      <template #body>
        <div class="space-y-3 p-1">
          <!-- Input + Solid Up Arrow Button -->
          <div class="flex items-center gap-2">
            <UInputMenu
              ref="mobileInputRef"
              v-model="quickInput"
              mode="autocomplete"
              type="search"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="sentences"
              spellcheck="false"
              name="mobile-add-shopping-item"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
              :items="quickInput.trim() ? autocompleteItems : []"
              value-key="value"
              :content="{ side: 'top', align: 'start', hideWhenEmpty: true }"
              placeholder="Add an item to the shopping list"
              :icon="isMobileInputFocused ? 'i-lucide-circle' : 'i-lucide-plus'"
              size="lg"
              class="flex-1"
              @keydown.enter.prevent="handleSubmitInput"
            />
            <UButton
              color="primary"
              variant="solid"
              size="lg"
              icon="i-lucide-arrow-up"
              :disabled="!quickInput.trim()"
              aria-label="Add Item"
              class="shrink-0"
              @click="handleSubmitInput"
            />
          </div>

          <!-- Category and Frequency Buttons on their own row beneath input -->
          <div class="flex items-center gap-2">
            <!-- Category Button with initial 'Category' label -->
            <UDropdownMenu :items="categoryMenuItems">
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-tag"
                :label="hasChosenNewCategory ? newCategory : 'Category'"
              />
            </UDropdownMenu>

            <!-- Frequency Button with initial 'Frequency' label -->
            <UDropdownMenu :items="cadenceMenuItems">
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-repeat"
                :label="hasChosenNewCadence ? selectedCadenceLabel : 'Frequency'"
              />
            </UDropdownMenu>
          </div>
        </div>
      </template>
    </UDrawer>
  </div>
</template>
