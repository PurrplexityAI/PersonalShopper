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
          <h2 class="font-bold text-highlighted">Next Shop List</h2>
          <UBadge
            color="neutral"
            variant="subtle"
            size="md"
          >
            {{ displayedShoppingList.length }} items
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
        <div
          v-for="item in displayedShoppingList"
          :key="item.id"
          class="bg-default rounded-2xl border border-default p-3.5 shadow-xs hover:border-accented transition-all flex items-center justify-between gap-3 group"
        >
          <!-- Left: Interactive Tick Circle -->
          <div class="flex items-center space-x-3 min-w-0">
            <UButton
              color="primary"
              variant="outline"
              size="md"
              icon="i-lucide-check"
              title="Tick off (Bought - reset cadence & mark in stock)"
              aria-label="Tick off (Bought - reset cadence & mark in stock)"
              class="rounded-full shrink-0"
              @click="store.checkOffShoppingItem(item)"
            />

            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-highlighted truncate">{{ item.name }}</span>
                <UBadge
                  color="neutral"
                  variant="subtle"
                  size="md"
                >
                  {{ item.category }}
                </UBadge>
              </div>
              <div class="flex items-center space-x-2 text-muted mt-0.5">
                <span class="inline-flex items-center space-x-1 text-dimmed">
                  <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-dimmed" />
                  <span>{{ item.frequencyLabel }}</span>
                </span>
                <span v-if="item.notes" class="text-dimmed truncate">• {{ item.notes }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Quantity Controls & Delete ("Didn't buy") Button -->
          <div class="flex items-center space-x-2 shrink-0">
            <!-- Quantity Stepper using UFieldGroup, UButton, and UInput -->
            <UFieldGroup size="md">
              <UButton
                color="neutral"
                variant="subtle"
                size="md"
                icon="i-lucide-minus"
                :disabled="(item.shoppingListQuantity || 1) <= 1"
                aria-label="Decrease quantity"
                @click="store.updateShoppingQuantity(item.id, Math.max(1, (item.shoppingListQuantity || 1) - 1))"
              />
              <UInput
                type="number"
                size="md"
                :model-value="item.shoppingListQuantity || 1"
                min="1"
                class="w-16"
                :ui="{ base: 'text-center font-semibold' }"
                @update:model-value="(val) => store.updateShoppingQuantity(item.id, Math.max(1, Number(val) || 1))"
              />
              <UButton
                color="neutral"
                variant="subtle"
                size="md"
                icon="i-lucide-plus"
                aria-label="Increase quantity"
                @click="store.updateShoppingQuantity(item.id, (item.shoppingListQuantity || 1) + 1)"
              />
            </UFieldGroup>

            <!-- Delete button: didn't buy semantic -->
            <UButton
              color="neutral"
              variant="ghost"
              size="md"
              icon="i-lucide-trash-2"
              title="Didn't buy it (Remove from list without resetting cadence)"
              aria-label="Didn't buy it"
              @click="store.deleteFromShoppingList(item)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Purchased This Trip (Session History) -->
    <div v-if="store.sessionPurchased.length > 0" class="bg-muted border border-default rounded-2xl p-4 mt-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-bold text-toned uppercase tracking-wider flex items-center space-x-1.5">
          <UIcon name="i-lucide-check" class="w-3.5 h-3.5 text-primary" />
          <span>Purchased This Trip ({{ store.sessionPurchased.length }})</span>
        </h3>
        <UButton
          color="neutral"
          variant="link"
          size="md"
          class="text-muted hover:text-highlighted p-0"
          @click="store.clearSessionPurchased()"
        >
          Clear
        </UButton>
      </div>
      <p class="text-muted mb-2.5">
        These items were marked in-stock in your pantry and their cadence timers have been reset to today.
      </p>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="(sessionItem, idx) in store.sessionPurchased"
          :key="`${sessionItem.id}-${idx}`"
          color="success"
          variant="subtle"
          size="md"
          icon="i-lucide-check"
        >
          <span class="line-through">{{ sessionItem.name }}</span>
          <span class="opacity-75">at {{ sessionItem.timestamp }}</span>
        </UBadge>
      </div>
    </div>
  </div>
</template>
