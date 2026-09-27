<script setup lang="ts">
import { ref, computed } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import { sortPantryItems, type PantrySortOption } from "~~/app/utils/sort";

const store = usePantryStore();

const sortBy = ref<PantrySortOption>("alpha-asc");

const displayedItems = computed(() => {
  return sortPantryItems(store.filteredItems, sortBy.value);
});
</script>

<template>
  <div class="space-y-4 pb-20 sm:pb-8">
    <!-- Top Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-default p-4 rounded-2xl border border-default shadow-xs">
      <!-- Search -->
      <div class="flex-1">
        <UInput
          v-model="store.searchQuery"
          icon="i-lucide-search"
          placeholder="Search pantry by name, category..."
          class="w-full"
          size="md"
        >
          <template v-if="store.searchQuery" #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="md"
              icon="i-lucide-x"
              aria-label="Clear search"
              @click="store.searchQuery = ''"
            />
          </template>
        </UInput>
      </div>

      <!-- Add Item Button -->
      <UButton
        color="primary"
        size="md"
        icon="i-lucide-plus"
        @click="store.openAddItemModal()"
      >
        <span>Add Pantry Item</span>
      </UButton>
    </div>

    <!-- Filter Tabs, Categories and Sort -->
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <!-- Stock Filter Pills -->
      <div class="grid grid-cols-4 items-stretch gap-1.5 sm:flex sm:items-center sm:gap-2 shrink-0">
        <UButton
          size="md"
          color="neutral"
          :variant="store.stockFilter === 'all' ? 'solid' : 'soft'"
          class="h-full justify-center text-center px-1 sm:h-auto sm:px-2.5"
          @click="store.stockFilter = 'all'"
        >
          All Items ({{ store.totalCount }})
        </UButton>
        <UButton
          size="md"
          :color="store.stockFilter === 'in-stock' ? 'primary' : 'neutral'"
          :variant="store.stockFilter === 'in-stock' ? 'solid' : 'soft'"
          class="h-full justify-center text-center px-1 sm:h-auto sm:px-2.5"
          @click="store.stockFilter = 'in-stock'"
        >
          In Stock ({{ store.inStockCount }})
        </UButton>
        <UButton
          size="md"
          :color="store.stockFilter === 'out-of-stock' ? 'error' : 'neutral'"
          :variant="store.stockFilter === 'out-of-stock' ? 'solid' : 'soft'"
          class="h-full justify-center text-center px-1 sm:h-auto sm:px-2.5"
          @click="store.stockFilter = 'out-of-stock'"
        >
          Out of Stock ({{ store.outOfStockCount }})
        </UButton>
        <UButton
          size="md"
          :color="store.stockFilter === 'due' ? 'warning' : 'neutral'"
          :variant="store.stockFilter === 'due' ? 'solid' : 'soft'"
          icon="i-lucide-sparkles"
          class="h-full justify-center text-center px-1 sm:h-auto sm:px-2.5"
          @click="store.stockFilter = 'due'"
        >
          Due for Restock ({{ store.dueCount }})
        </UButton>
      </div>

      <!-- Category & Sort Selects -->
      <div class="flex items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
        <CategorySelect
          v-model="store.selectedCategory"
          class="flex-1 sm:flex-none sm:w-48"
        />
        <PantrySortSelect
          v-model="sortBy"
          :show-next-due="true"
          class="flex-1 sm:flex-none sm:w-48"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="displayedItems.length === 0"
      class="bg-default rounded-2xl border border-default p-8 text-center space-y-3"
    >
      <div class="w-12 h-12 rounded-full bg-muted text-muted mx-auto flex items-center justify-center">
        <UIcon name="i-lucide-search" class="w-6 h-6" />
      </div>
      <div>
        <h3 class="font-bold text-highlighted">No items match your filter</h3>
        <p class="text-muted mt-1">
          {{ store.searchQuery ? `No items matching "${store.searchQuery}"` : 'Try changing your category or stock filter.' }}
        </p>
      </div>
      <UButton
        color="primary"
        variant="subtle"
        size="md"
        @click="() => { store.searchQuery = ''; store.selectedCategory = null; store.stockFilter = 'all'; sortBy = 'alpha-asc'; }"
      >
        Reset Filters
      </UButton>
    </div>

    <!-- Items Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <PantryItemCard
        v-for="item in displayedItems"
        :key="item.id"
        :item="item"
      />
    </div>
  </div>
</template>
