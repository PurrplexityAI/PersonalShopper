<script setup lang="ts">
import { ref, computed } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";
import { sortPantryItems, type PantrySortOption } from "~~/app/utils/sort";

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

const quickInput = ref("");
const showSuggestions = ref(true);
const newCadence = ref(7);
const newCategory = ref("General");
const showNewItemPrompt = ref(false);

const CADENCE_OPTIONS = [
  { label: "Every 3 days", value: 3 },
  { label: "Weekly (7d)", value: 7 },
  { label: "Every 2 weeks (14d)", value: 14 },
  { label: "Every 3 weeks", value: 21 },
  { label: "Monthly (30d)", value: 30 },
];

const trimmedInput = computed(() => quickInput.value.trim().toLowerCase());

const existingMatches = computed(() => {
  if (!trimmedInput.value) return [];
  return store.items.filter(
    (p) => p.name.toLowerCase().includes(trimmedInput.value) && !p.inShoppingList
  );
});

const exactMatch = computed(() => {
  if (!trimmedInput.value) return null;
  return store.items.find((p) => p.name.toLowerCase() === trimmedInput.value);
});

async function handleQuickAdd() {
  if (!quickInput.value.trim()) return;

  if (exactMatch.value) {
    await store.addToShoppingList({ nameOrId: exactMatch.value.id, quantity: 1 });
  } else {
    await store.addToShoppingList({
      nameOrId: quickInput.value.trim(),
      quantity: 1,
      frequencyDays: newCadence.value,
      category: newCategory.value,
    });
  }
  quickInput.value = "";
  showNewItemPrompt.value = false;
}

async function handleSelectExisting(item: PantryItem) {
  await store.addToShoppingList({ nameOrId: item.id, quantity: 1 });
  quickInput.value = "";
  showNewItemPrompt.value = false;
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
  <div class="space-y-4 pb-20 sm:pb-8">
    <!-- Quick Add Bar -->
    <div class="bg-default rounded-2xl border border-default p-4 shadow-xs">
      <form class="flex gap-2" @submit.prevent="handleQuickAdd">
        <UInput
          v-model="quickInput"
          placeholder="Add item to shopping list (e.g. Milk, Apples, Bread)..."
          class="flex-1"
          size="md"
          @input="showNewItemPrompt = true"
        />
        <UButton
          type="submit"
          color="primary"
          :disabled="!quickInput.trim()"
          icon="i-lucide-plus"
          class="shrink-0"
        >
          <span class="hidden sm:inline">Add Item</span>
          <span class="sm:hidden">Add</span>
        </UButton>
      </form>

      <!-- Real-time Suggestions / Pantry matches when typing -->
      <div v-if="quickInput.trim().length > 0 && showNewItemPrompt" class="mt-3 pt-3 border-t border-default space-y-2">
        <!-- Existing pantry items match -->
        <div v-if="existingMatches.length > 0">
          <p class="font-semibold text-muted uppercase tracking-wider mb-1.5">
            Select from existing pantry:
          </p>
          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="match in existingMatches.slice(0, 5)"
              :key="match.id"
              type="button"
              color="neutral"
              variant="outline"
              size="md"
              @click="handleSelectExisting(match)"
            >
              <span>{{ match.name }}</span>
              <span class="text-dimmed">({{ match.frequencyLabel }})</span>
            </UButton>
          </div>
        </div>

        <!-- Brand new item creation config -->
        <div v-if="!exactMatch" class="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
          <div class="flex items-center space-x-1.5 text-highlighted font-medium">
            <UIcon name="i-lucide-plus-circle" class="w-4 h-4 text-primary shrink-0" />
            <span>
              <strong>"{{ quickInput.trim() }}"</strong> will be added to your shopping list & created in your pantry.
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-4 pt-1">
            <UFormField label="Category" orientation="horizontal" size="md">
              <USelect
                v-model="newCategory"
                :items="store.categories"
                size="md"
                class="w-40"
              />
            </UFormField>

            <UFormField label="Buy Cadence" orientation="horizontal" size="md">
              <USelect
                v-model.number="newCadence"
                :items="CADENCE_OPTIONS"
                value-key="value"
                size="md"
                class="w-48 font-medium"
              />
            </UFormField>
          </div>
        </div>
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

    <!-- Active Shopping List Section -->
    <div class="space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div class="flex items-center space-x-2">
          <h2 class="font-bold text-highlighted">Shopping list</h2>
          <UBadge
            color="neutral"
            variant="soft"
            size="md"
          >
            {{ displayedShoppingList.length }} item(s)
          </UBadge>
        </div>

        <!-- Category & Sort Selects (aligned right on desktop, wraps on mobile) -->
        <div class="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <CategorySelect
            v-model="selectedCategory"
            class="flex-1 sm:flex-none sm:w-48"
          />
          <PantrySortSelect
            v-model="sortBy"
            :show-next-due="false"
            class="flex-1 sm:flex-none sm:w-48"
          />
        </div>
      </div>

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
            All pantry items are stocked, or you're ready to plan your next shop. Use the input bar above or select from Cadence Suggestions.
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
  </div>
</template>
