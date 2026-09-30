<script setup lang="ts">
import { computed } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import AppScreenHeader from "./AppScreenHeader.vue";

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
  <div class="space-y-4 pb-36 sm:pb-12">
    <AppScreenHeader title="Suggestions" />
    <!-- Header Banner -->
    <div class="bg-warning/10 border border-warning/30 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center space-x-2">
          <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-warning" />
          <h2 class="text-lg font-bold text-highlighted">Cadence Restock Suggestions</h2>
        </div>
        <p class="text-muted mt-1 max-w-xl">
          Calculated from your custom purchase frequencies and current pantry stock status. Add them to your shopping list with a single tap.
        </p>
      </div>

      <UButton
        v-if="store.suggestions.length > 0"
        color="warning"
        variant="solid"
        size="md"
        trailing-icon="i-lucide-arrow-right"
        class="shrink-0 font-bold"
        @click="handleAddAll"
      >
        Add All ({{ store.suggestions.length }}) to Shopping List
      </UButton>
    </div>

    <!-- Empty State -->
    <div
      v-if="store.suggestions.length === 0"
      class="bg-default rounded-2xl border border-default p-10 text-center space-y-3"
    >
      <div class="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
        <UIcon name="i-lucide-check" class="w-7 h-7 stroke-[2.5]" />
      </div>
      <h3 class="text-base font-bold text-highlighted">Everything is well-stocked!</h3>
      <p class="text-muted max-w-sm mx-auto">
        No pantry items are currently overdue or low according to their purchase cadences.
      </p>
    </div>

    <!-- Tiered Suggestions -->
    <div v-else class="space-y-5">
      <!-- Critical: Out of stock -->
      <div v-if="criticalItems.length > 0" class="space-y-2">
        <h3 class="font-bold text-error uppercase tracking-wider flex items-center space-x-1.5">
          <UIcon name="i-lucide-alert-triangle" class="w-3.5 h-3.5" />
          <span>Out of Stock in Pantry ({{ criticalItems.length }})</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="sug in criticalItems"
            :key="sug.item.id"
            class="bg-default rounded-2xl border border-default p-4 shadow-xs hover:border-accented transition-all flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <UBadge
                  color="neutral"
                  variant="subtle"
                  size="md"
                >
                  {{ sug.item.category }}
                </UBadge>
                <UBadge
                  color="error"
                  variant="subtle"
                  size="md"
                >
                  {{ sug.reason }}
                </UBadge>
              </div>
              <h4 class="font-bold text-highlighted mt-1 truncate">{{ sug.item.name }}</h4>
              <div class="text-muted mt-0.5 flex items-center space-x-2">
                <span class="flex items-center space-x-1">
                  <UIcon name="i-lucide-clock" class="w-3 h-3 text-dimmed" />
                  <span>{{ sug.item.frequencyLabel }}</span>
                </span>
                <span>• In stock: {{ sug.item.inStock ? `${sug.item.quantity} ${sug.item.unit}` : 'No' }}</span>
              </div>
            </div>

            <UButton
              color="primary"
              variant="solid"
              size="md"
              icon="i-lucide-plus"
              class="shrink-0"
              @click="store.addToShoppingList({ nameOrId: sug.item.id, quantity: 1 })"
            >
              Add
            </UButton>
          </div>
        </div>
      </div>

      <!-- High: Overdue or due today -->
      <div v-if="highItems.length > 0" class="space-y-2">
        <h3 class="font-bold text-warning uppercase tracking-wider flex items-center space-x-1.5">
          <UIcon name="i-lucide-clock" class="w-3.5 h-3.5" />
          <span>Due Today or Overdue ({{ highItems.length }})</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="sug in highItems"
            :key="sug.item.id"
            class="bg-default rounded-2xl border border-default p-4 shadow-xs hover:border-accented transition-all flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <UBadge
                  color="neutral"
                  variant="subtle"
                  size="md"
                >
                  {{ sug.item.category }}
                </UBadge>
                <UBadge
                  color="warning"
                  variant="subtle"
                  size="md"
                >
                  {{ sug.reason }}
                </UBadge>
              </div>
              <h4 class="font-bold text-highlighted mt-1 truncate">{{ sug.item.name }}</h4>
              <div class="text-muted mt-0.5 flex items-center space-x-2">
                <span class="flex items-center space-x-1">
                  <UIcon name="i-lucide-clock" class="w-3 h-3 text-dimmed" />
                  <span>{{ sug.item.frequencyLabel }}</span>
                </span>
                <span>• In stock: {{ sug.item.inStock ? `${sug.item.quantity} ${sug.item.unit}` : 'No' }}</span>
              </div>
            </div>

            <UButton
              color="primary"
              variant="solid"
              size="md"
              icon="i-lucide-plus"
              class="shrink-0"
              @click="store.addToShoppingList({ nameOrId: sug.item.id, quantity: 1 })"
            >
              Add
            </UButton>
          </div>
        </div>
      </div>

      <!-- Upcoming: Due in 1-2 days -->
      <div v-if="upcomingItems.length > 0" class="space-y-2">
        <h3 class="font-bold text-toned uppercase tracking-wider flex items-center space-x-1.5">
          <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5 text-dimmed" />
          <span>Upcoming Replenishment ({{ upcomingItems.length }})</span>
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            v-for="sug in upcomingItems"
            :key="sug.item.id"
            class="bg-default rounded-2xl border border-default p-4 shadow-xs hover:border-accented transition-all flex items-center justify-between gap-3"
          >
            <div class="min-w-0">
              <div class="flex items-center space-x-2">
                <UBadge
                  color="neutral"
                  variant="subtle"
                  size="md"
                >
                  {{ sug.item.category }}
                </UBadge>
                <UBadge
                  color="warning"
                  variant="subtle"
                  size="md"
                >
                  {{ sug.reason }}
                </UBadge>
              </div>
              <h4 class="font-bold text-highlighted mt-1 truncate">{{ sug.item.name }}</h4>
              <div class="text-muted mt-0.5 flex items-center space-x-2">
                <span class="flex items-center space-x-1">
                  <UIcon name="i-lucide-clock" class="w-3 h-3 text-dimmed" />
                  <span>{{ sug.item.frequencyLabel }}</span>
                </span>
                <span>• In stock: {{ sug.item.inStock ? `${sug.item.quantity} ${sug.item.unit}` : 'No' }}</span>
              </div>
            </div>

            <UButton
              color="primary"
              variant="solid"
              size="md"
              icon="i-lucide-plus"
              class="shrink-0"
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
