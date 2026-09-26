<script setup lang="ts">
import { computed } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import { getCategoryColor } from "~~/app/utils/format";

const store = usePantryStore();

const criticalItems = computed(() => store.suggestions.filter((s) => s.urgency === "critical"));
const highItems = computed(() => store.suggestions.filter((s) => s.urgency === "high"));
const upcomingItems = computed(() =>
  store.suggestions.filter((s) => s.urgency === "medium" || s.urgency === "low")
);

async function handleAddAll() {
  const ids = store.suggestions.map((s) => s.item.id);
  if (ids.length > 0) {
    await store.addBulkToShoppingList(ids);
  }
}
</script>

<template>
  <div class="space-y-4 pb-20 sm:pb-8">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-amber-200" />
          <h2 class="text-lg font-bold">Cadence Restock Suggestions</h2>
        </div>
        <p class="text-xs text-amber-100 mt-1 max-w-xl">
          Calculated from your custom purchase frequencies and current pantry stock status. Add them to your shopping list with a single tap.
        </p>
      </div>

      <UButton
        v-if="store.suggestions.length > 0"
        color="neutral"
        variant="solid"
        size="sm"
        trailing-icon="i-lucide-arrow-right"
        class="bg-white text-amber-800 hover:bg-amber-50 rounded-xl font-bold shadow-xs shrink-0"
        @click="handleAddAll"
      >
        Add All ({{ store.suggestions.length }}) to Shopping List
      </UButton>
    </div>

    <!-- Empty State -->
    <div
      v-if="store.suggestions.length === 0"
      class="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3"
    >
      <div class="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
        <UIcon name="i-lucide-check" class="w-7 h-7 stroke-[2.5]" />
      </div>
      <h3 class="text-base font-bold text-slate-800">Everything is well-stocked!</h3>
      <p class="text-xs text-slate-500 max-w-sm mx-auto">
        No pantry items are currently overdue or low according to their purchase cadences.
      </p>
    </div>

    <!-- Tiered Suggestions -->
    <div v-else class="space-y-5">
      <!-- Critical: Out of stock -->
      <div v-if="criticalItems.length > 0" class="space-y-2">
        <h3 class="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-1.5">
          <UIcon name="i-lucide-alert-triangle" class="w-3.5 h-3.5" />
          <span>Out of Stock in Pantry ({{ criticalItems.length }})</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="sug in criticalItems"
            :key="sug.item.id"
            class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <UBadge
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="rounded-md font-semibold"
                  :class="[
                    getCategoryColor(sug.item.category).bg,
                    getCategoryColor(sug.item.category).text,
                    getCategoryColor(sug.item.category).border
                  ]"
                >
                  {{ sug.item.category }}
                </UBadge>
                <UBadge
                  color="error"
                  variant="subtle"
                  size="xs"
                  class="font-bold rounded-md"
                >
                  {{ sug.reason }}
                </UBadge>
              </div>
              <h4 class="font-bold text-slate-900 text-sm mt-1 truncate">{{ sug.item.name }}</h4>
              <div class="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                <span class="flex items-center space-x-1">
                  <UIcon name="i-lucide-clock" class="w-3 h-3 text-slate-400" />
                  <span>{{ sug.item.frequencyLabel }}</span>
                </span>
                <span>• In stock: {{ sug.item.inStock ? `${sug.item.quantity} ${sug.item.unit}` : 'No' }}</span>
              </div>
            </div>

            <UButton
              color="primary"
              variant="solid"
              size="xs"
              icon="i-lucide-plus"
              class="rounded-xl font-semibold shrink-0"
              @click="store.addToShoppingList({ nameOrId: sug.item.id, quantity: 1 })"
            >
              Add
            </UButton>
          </div>
        </div>
      </div>

      <!-- High: Overdue or due today -->
      <div v-if="highItems.length > 0" class="space-y-2">
        <h3 class="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center space-x-1.5">
          <UIcon name="i-lucide-clock" class="w-3.5 h-3.5" />
          <span>Due Today or Overdue ({{ highItems.length }})</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="sug in highItems"
            :key="sug.item.id"
            class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <UBadge
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="rounded-md font-semibold"
                  :class="[
                    getCategoryColor(sug.item.category).bg,
                    getCategoryColor(sug.item.category).text,
                    getCategoryColor(sug.item.category).border
                  ]"
                >
                  {{ sug.item.category }}
                </UBadge>
                <UBadge
                  color="warning"
                  variant="subtle"
                  size="xs"
                  class="font-bold rounded-md"
                >
                  {{ sug.reason }}
                </UBadge>
              </div>
              <h4 class="font-bold text-slate-900 text-sm mt-1 truncate">{{ sug.item.name }}</h4>
              <div class="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                <span class="flex items-center space-x-1">
                  <UIcon name="i-lucide-clock" class="w-3 h-3 text-slate-400" />
                  <span>{{ sug.item.frequencyLabel }}</span>
                </span>
                <span>• In stock: {{ sug.item.inStock ? `${sug.item.quantity} ${sug.item.unit}` : 'No' }}</span>
              </div>
            </div>

            <UButton
              color="primary"
              variant="solid"
              size="xs"
              icon="i-lucide-plus"
              class="rounded-xl font-semibold shrink-0"
              @click="store.addToShoppingList({ nameOrId: sug.item.id, quantity: 1 })"
            >
              Add
            </UButton>
          </div>
        </div>
      </div>

      <!-- Upcoming: Due in 1-2 days -->
      <div v-if="upcomingItems.length > 0" class="space-y-2">
        <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
          <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5 text-slate-400" />
          <span>Upcoming Replenishment ({{ upcomingItems.length }})</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="sug in upcomingItems"
            :key="sug.item.id"
            class="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <UBadge
                  color="neutral"
                  variant="outline"
                  size="xs"
                  class="rounded-md font-semibold"
                  :class="[
                    getCategoryColor(sug.item.category).bg,
                    getCategoryColor(sug.item.category).text,
                    getCategoryColor(sug.item.category).border
                  ]"
                >
                  {{ sug.item.category }}
                </UBadge>
                <UBadge
                  color="warning"
                  variant="subtle"
                  size="xs"
                  class="font-bold rounded-md"
                >
                  {{ sug.reason }}
                </UBadge>
              </div>
              <h4 class="font-bold text-slate-900 text-sm mt-1 truncate">{{ sug.item.name }}</h4>
              <div class="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                <span class="flex items-center space-x-1">
                  <UIcon name="i-lucide-clock" class="w-3 h-3 text-slate-400" />
                  <span>{{ sug.item.frequencyLabel }}</span>
                </span>
                <span>• In stock: {{ sug.item.inStock ? `${sug.item.quantity} ${sug.item.unit}` : 'No' }}</span>
              </div>
            </div>

            <UButton
              color="primary"
              variant="solid"
              size="xs"
              icon="i-lucide-plus"
              class="rounded-xl font-semibold shrink-0"
              @click="store.addToShoppingList({ nameOrId: sug.item.id, quantity: 1 })"
            >
              Add
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
