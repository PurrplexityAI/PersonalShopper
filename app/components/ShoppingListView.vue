<script setup lang="ts">
import { ref, computed } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";
import { getCategoryColor } from "~~/app/utils/format";

const store = usePantryStore();

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
    <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
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
      <div v-if="quickInput.trim().length > 0 && showNewItemPrompt" class="mt-3 pt-3 border-t border-slate-100 space-y-2">
        <!-- Existing pantry items match -->
        <div v-if="existingMatches.length > 0">
          <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Select from existing pantry:
          </p>
          <div class="flex flex-wrap gap-1.5">
            <UButton
              v-for="match in existingMatches.slice(0, 5)"
              :key="match.id"
              type="button"
              color="neutral"
              variant="subtle"
              size="xs"
              class="rounded-xl font-medium border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              @click="handleSelectExisting(match)"
            >
              <span>{{ match.name }}</span>
              <span class="text-[10px] text-slate-400">({{ match.frequencyLabel }})</span>
            </UButton>
          </div>
        </div>

        <!-- Brand new item creation config -->
        <div v-if="!exactMatch" class="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs space-y-2">
          <div class="flex items-center space-x-1.5 text-emerald-800 font-medium">
            <UIcon name="i-lucide-plus-circle" class="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>"{{ quickInput.trim() }}"</strong> will be added to your shopping list & created in your pantry.
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-4 pt-1">
            <UFormField label="Category" orientation="horizontal" size="xs">
              <USelect
                v-model="newCategory"
                :items="store.categories"
                size="xs"
                class="w-36"
              />
            </UFormField>

            <UFormField label="Buy Cadence" orientation="horizontal" size="xs">
              <USelect
                v-model.number="newCadence"
                :items="CADENCE_OPTIONS"
                value-key="value"
                size="xs"
                class="w-44 font-medium"
              />
            </UFormField>
          </div>
        </div>
      </div>
    </div>

    <!-- Cadence Suggestions Section -->
    <div
      v-if="store.suggestions.length > 0"
      class="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-2xl p-4 shadow-xs transition-all"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-amber-900 flex items-center space-x-1.5">
              <span>Smart Cadence Suggestions</span>
              <UBadge
                color="warning"
                variant="subtle"
                size="xs"
                class="rounded-full font-bold bg-amber-200/80 text-amber-800"
              >
                {{ store.suggestions.length }} due
              </UBadge>
            </h3>
            <p class="text-xs text-amber-700/80">
              Items due for replenishment based on your purchase frequency
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <UButton
            color="warning"
            variant="solid"
            size="xs"
            class="hidden sm:inline-flex"
            @click="handleAddAllSuggestions"
          >
            <span>Add All ({{ store.suggestions.length }})</span>
            <UIcon name="i-lucide-arrow-right" class="w-3.5 h-3.5" />
          </UButton>
          <UButton
            color="warning"
            variant="ghost"
            size="xs"
            :icon="showSuggestions ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            :title="showSuggestions ? 'Collapse' : 'Expand'"
            :aria-label="showSuggestions ? 'Collapse suggestions' : 'Expand suggestions'"
            @click="showSuggestions = !showSuggestions"
          />
        </div>
      </div>

      <!-- Suggestions Carousel -->
      <div v-if="showSuggestions" class="mt-3 pt-3 border-t border-amber-200/50 space-y-2">
        <div class="sm:hidden mb-2">
          <UButton
            color="warning"
            variant="solid"
            block
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
            class="bg-white/90 border border-amber-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs"
          >
            <div class="min-w-0 pr-2">
              <div class="font-semibold text-slate-800 text-xs truncate">
                {{ sug.item.name }}
              </div>
              <div class="flex items-center space-x-1 text-[10px] text-amber-700 font-medium">
                <UBadge
                  :color="sug.urgency === 'critical' ? 'error' : 'warning'"
                  variant="subtle"
                  size="xs"
                  class="font-bold rounded-md"
                >
                  {{ sug.reason }}
                </UBadge>
                <span class="text-slate-400">• {{ sug.item.frequencyLabel }}</span>
              </div>
            </div>

            <UButton
              color="primary"
              variant="subtle"
              size="xs"
              icon="i-lucide-plus"
              class="shrink-0 font-semibold"
              @click="store.addToShoppingList({ nameOrId: sug.item.id, quantity: 1 })"
            >
              Add
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Shopping List Section -->
    <div class="space-y-3">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center space-x-2">
          <h2 class="text-base font-bold text-slate-900">Next Shop List</h2>
          <UBadge
            color="neutral"
            variant="subtle"
            size="sm"
            class="rounded-full font-semibold"
          >
            {{ store.shoppingList.length }} items
          </UBadge>
        </div>

        <div class="text-xs text-slate-500 hidden sm:block">
          Tick off = in-stock + reset timer • Delete = didn't buy
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="store.shoppingList.length === 0"
        class="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3"
      >
        <div class="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
          <UIcon name="i-lucide-shopping-bag" class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-base font-bold text-slate-800">Your shopping list is clear!</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All pantry items are stocked, or you're ready to plan your next shop. Use the input bar above or select from Cadence Suggestions.
          </p>
        </div>
        <UButton
          v-if="store.suggestions.length > 0"
          color="warning"
          variant="solid"
          icon="i-lucide-sparkles"
          @click="handleAddAllSuggestions"
        >
          Add {{ store.suggestions.length }} Cadence Due Items
        </UButton>
      </div>

      <!-- Item Rows -->
      <div v-else class="space-y-2">
        <div
          v-for="item in store.shoppingList"
          :key="item.id"
          class="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between gap-3 group"
        >
          <!-- Left: Interactive Tick Circle -->
          <div class="flex items-center space-x-3 min-w-0">
            <UButton
              color="success"
              variant="outline"
              size="sm"
              icon="i-lucide-check"
              title="Tick off (Bought - reset cadence & mark in stock)"
              aria-label="Tick off (Bought - reset cadence & mark in stock)"
              class="w-8 h-8 rounded-full border-2 border-emerald-500 text-transparent hover:text-white hover:bg-emerald-500 p-0 justify-center transition-all active:scale-90 shrink-0"
              @click="store.checkOffShoppingItem(item)"
            />

            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-slate-900 text-sm truncate">{{ item.name }}</span>
                <UBadge
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="hidden xs:inline-flex rounded-md font-semibold"
                  :class="[getCategoryColor(item.category).bg, getCategoryColor(item.category).text, getCategoryColor(item.category).border]"
                >
                  {{ item.category }}
                </UBadge>
              </div>
              <div class="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                <span class="inline-flex items-center space-x-1 text-[11px] text-slate-400">
                  <UIcon name="i-lucide-clock" class="w-3 h-3 text-slate-400" />
                  <span>{{ item.frequencyLabel }}</span>
                </span>
                <span v-if="item.notes" class="text-[11px] text-slate-400 truncate">• {{ item.notes }}</span>
              </div>
            </div>
          </div>

          <!-- Right: Quantity Controls & Delete ("Didn't buy") Button -->
          <div class="flex items-center space-x-2 shrink-0">
            <!-- Quantity Stepper using UFieldGroup, UButton, and UInput -->
            <UFieldGroup size="xs">
              <UButton
                color="neutral"
                variant="subtle"
                icon="i-lucide-minus"
                :disabled="(item.shoppingListQuantity || 1) <= 1"
                aria-label="Decrease quantity"
                @click="store.updateShoppingQuantity(item.id, Math.max(1, (item.shoppingListQuantity || 1) - 1))"
              />
              <UInput
                type="number"
                :model-value="item.shoppingListQuantity || 1"
                min="1"
                class="w-14"
                :ui="{ base: 'text-center font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none' }"
                @update:model-value="(val) => store.updateShoppingQuantity(item.id, Math.max(1, Number(val) || 1))"
              />
              <UButton
                color="neutral"
                variant="subtle"
                icon="i-lucide-plus"
                aria-label="Increase quantity"
                @click="store.updateShoppingQuantity(item.id, (item.shoppingListQuantity || 1) + 1)"
              />
            </UFieldGroup>

            <!-- Delete button: didn't buy semantic -->
            <UButton
              color="neutral"
              variant="ghost"
              size="xs"
              icon="i-lucide-trash-2"
              title="Didn't buy it (Remove from list without resetting cadence)"
              aria-label="Didn't buy it"
              class="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              @click="store.deleteFromShoppingList(item)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Purchased This Trip (Session History) -->
    <div v-if="store.sessionPurchased.length > 0" class="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-6">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
          <UIcon name="i-lucide-check" class="w-3.5 h-3.5 text-emerald-600" />
          <span>Purchased This Trip ({{ store.sessionPurchased.length }})</span>
        </h3>
        <UButton
          color="neutral"
          variant="link"
          size="xs"
          class="text-slate-400 hover:text-slate-600 p-0"
          @click="store.clearSessionPurchased()"
        >
          Clear
        </UButton>
      </div>
      <p class="text-[11px] text-slate-500 mb-2.5">
        These items were marked in-stock in your pantry and their cadence timers have been reset to today.
      </p>
      <div class="flex flex-wrap gap-2">
        <UBadge
          v-for="(sessionItem, idx) in store.sessionPurchased"
          :key="`${sessionItem.id}-${idx}`"
          color="success"
          variant="subtle"
          size="sm"
          class="rounded-lg font-medium gap-1.5"
        >
          <UIcon name="i-lucide-check" class="w-3 h-3 text-emerald-600" />
          <span class="line-through">{{ sessionItem.name }}</span>
          <span class="text-[10px] text-emerald-600/70 font-normal">at {{ sessionItem.timestamp }}</span>
        </UBadge>
      </div>
    </div>
  </div>
</template>
