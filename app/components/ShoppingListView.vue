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
        <div class="relative flex-1">
          <input
            v-model="quickInput"
            type="text"
            placeholder="Add item to shopping list (e.g. Milk, Apples, Bread)..."
            class="w-full pl-3.5 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            @input="showNewItemPrompt = true"
          >
        </div>
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
            <button
              v-for="match in existingMatches.slice(0, 5)"
              :key="match.id"
              type="button"
              class="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl text-xs font-medium transition-all"
              @click="handleSelectExisting(match)"
            >
              <span>{{ match.name }}</span>
              <span class="text-[10px] text-slate-400">({{ match.frequencyLabel }})</span>
            </button>
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

          <div class="flex flex-wrap items-center gap-3 pt-1">
            <div class="flex items-center space-x-1.5">
              <span class="text-slate-600">Category:</span>
              <select
                v-model="newCategory"
                class="bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
              >
                <option v-for="c in store.categories" :key="c" :value="c">
                  {{ c }}
                </option>
              </select>
            </div>

            <div class="flex items-center space-x-1.5">
              <span class="text-slate-600">Buy Cadence:</span>
              <select
                v-model.number="newCadence"
                class="bg-white border border-emerald-200 rounded-lg px-2 py-1 text-xs focus:outline-none font-medium"
              >
                <option :value="3">Every 3 days</option>
                <option :value="7">Weekly (7d)</option>
                <option :value="14">Every 2 weeks (14d)</option>
                <option :value="21">Every 3 weeks</option>
                <option :value="30">Monthly (30d)</option>
              </select>
            </div>
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
              <span class="bg-amber-200/80 text-amber-800 text-[11px] px-2 py-0.2 rounded-full font-bold">
                {{ store.suggestions.length }} due
              </span>
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
          <button
            type="button"
            class="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
            :title="showSuggestions ? 'Collapse' : 'Expand'"
            @click="showSuggestions = !showSuggestions"
          >
            <UIcon :name="showSuggestions ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4" />
          </button>
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
                <span
                  class="px-1.5 py-0.2 rounded-md"
                  :class="sug.urgency === 'critical' ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-amber-100 text-amber-800'"
                >
                  {{ sug.reason }}
                </span>
                <span class="text-slate-400">• {{ sug.item.frequencyLabel }}</span>
              </div>
            </div>

            <button
              type="button"
              class="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shrink-0 border border-emerald-200 hover:border-emerald-600"
              @click="store.addToShoppingList({ nameOrId: sug.item.id, quantity: 1 })"
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Shopping List Section -->
    <div class="space-y-3">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center space-x-2">
          <h2 class="text-base font-bold text-slate-900">Next Shop List</h2>
          <span class="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
            {{ store.shoppingList.length }} items
          </span>
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
            <button
              type="button"
              title="Tick off (Bought - reset cadence & mark in stock)"
              class="w-8 h-8 rounded-full border-2 border-emerald-500 hover:bg-emerald-500 flex items-center justify-center text-transparent hover:text-white transition-all transform active:scale-90 shrink-0"
              @click="store.checkOffShoppingItem(item)"
            >
              <UIcon name="i-lucide-check" class="w-4 h-4 stroke-[3]" />
            </button>

            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-slate-900 text-sm truncate">{{ item.name }}</span>
                <span
                  class="hidden xs:inline-block px-2 py-0.2 text-[10px] font-semibold rounded-md border"
                  :class="[getCategoryColor(item.category).bg, getCategoryColor(item.category).text, getCategoryColor(item.category).border]"
                >
                  {{ item.category }}
                </span>
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
            <!-- Quantity Stepper -->
            <div class="flex items-center border border-slate-200 rounded-xl bg-slate-50/70 overflow-hidden">
              <button
                type="button"
                class="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 text-xs font-bold transition-colors"
                @click="store.updateShoppingQuantity(item.id, Math.max(1, (item.shoppingListQuantity || 1) - 1))"
              >
                -
              </button>
              <span class="px-2 text-xs font-bold text-slate-800 min-w-[20px] text-center">
                {{ item.shoppingListQuantity || 1 }}
              </span>
              <button
                type="button"
                class="px-2 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 text-xs font-bold transition-colors"
                @click="store.updateShoppingQuantity(item.id, (item.shoppingListQuantity || 1) + 1)"
              >
                +
              </button>
            </div>

            <!-- Delete button: didn't buy semantic -->
            <button
              type="button"
              title="Didn't buy it (Remove from list without resetting cadence)"
              class="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              @click="store.deleteFromShoppingList(item)"
            >
              <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
            </button>
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
        <button
          type="button"
          class="text-[11px] text-slate-400 hover:text-slate-600"
          @click="store.clearSessionPurchased()"
        >
          Clear
        </button>
      </div>
      <p class="text-[11px] text-slate-500 mb-2.5">
        These items were marked in-stock in your pantry and their cadence timers have been reset to today.
      </p>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(sessionItem, idx) in store.sessionPurchased"
          :key="`${sessionItem.id}-${idx}`"
          class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium"
        >
          <UIcon name="i-lucide-check" class="w-3 h-3 text-emerald-600" />
          <span class="line-through">{{ sessionItem.name }}</span>
          <span class="text-[10px] text-emerald-600/70 font-normal">at {{ sessionItem.timestamp }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
