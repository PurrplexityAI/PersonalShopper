<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import { sortPantryItems, type PantrySortOption } from "~~/app/utils/sort";
import AppScreenHeader from "./AppScreenHeader.vue";
import CategorySelect from "./CategorySelect.vue";
import PantrySortSelect from "./PantrySortSelect.vue";
import PantryItemCard from "./PantryItemCard.vue";

const store = usePantryStore();

const sortBy = ref<PantrySortOption>("alpha-asc");

const displayedItems = computed(() => {
  return sortPantryItems(store.filteredItems, sortBy.value);
});

const isFilterActive = computed(() => {
  return (
    store.searchQuery.trim() !== "" ||
    (store.selectedCategory !== null && store.selectedCategory !== "All") ||
    store.stockFilter !== "all" ||
    sortBy.value !== "alpha-asc"
  );
});

function resetFilters() {
  store.searchQuery = "";
  store.selectedCategory = null;
  store.stockFilter = "all";
  sortBy.value = "alpha-asc";
}

// Sticky header scroll behavior: scrolls offscreen on scroll down, reappears on scroll up
const isStickyVisible = ref(true);
let lastScrollY = 0;

function handleScroll() {
  if (typeof window === "undefined") return;
  const currentScrollY = window.scrollY;
  if (currentScrollY <= 80) {
    isStickyVisible.value = true;
  } else if (currentScrollY > lastScrollY && currentScrollY > 120) {
    // Scrolling down
    isStickyVisible.value = false;
  } else if (currentScrollY < lastScrollY) {
    // Scrolling up
    isStickyVisible.value = true;
  }
  lastScrollY = currentScrollY;
}

onMounted(() => {
  if (typeof window !== "undefined") {
    lastScrollY = window.scrollY;
    window.addEventListener("scroll", handleScroll, { passive: true });
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("scroll", handleScroll);
  }
});
</script>

<template>
  <div class="space-y-4 pb-36 sm:pb-12">
    <!-- Screen Header with Actions Slot -->
    <AppScreenHeader title="Pantry">
      <template #actions>
        <!-- Desktop Add Pantry Item Button -->
        <UButton
          color="primary"
          size="sm"
          icon="i-lucide-plus"
          class="hidden sm:inline-flex"
          @click="store.openAddItemModal()"
        >
          Add Pantry Item
        </UButton>

        <!-- Desktop Reset Filters Button (lights up when active) -->
        <UButton
          size="sm"
          icon="i-lucide-rotate-ccw"
          class="hidden sm:inline-flex"
          :color="isFilterActive ? 'primary' : 'neutral'"
          :variant="isFilterActive ? 'solid' : 'ghost'"
          :disabled="!isFilterActive"
          @click="resetFilters"
        >
          Reset filters
        </UButton>
      </template>
    </AppScreenHeader>

    <!-- Sticky Control Panel (Search, Filter Buttons, Category & Sort Selects, Mobile Reset) -->
    <div
      class="sticky top-0 sm:top-12 z-20 bg-muted/95 backdrop-blur-md pt-1 pb-3 space-y-3 transition-transform duration-300 ease-in-out"
      :class="isStickyVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'"
    >
      <!-- Search Input (no longer in its own panel card) -->
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

      <!-- Filter Tabs, Categories and Sort -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <!-- Stock Filter Pills (sentence-case, no icon on Due for restock) -->
        <div class="grid grid-cols-4 items-stretch gap-1.5 sm:flex sm:items-center sm:gap-2 shrink-0">
          <UButton
            size="md"
            color="neutral"
            :variant="store.stockFilter === 'all' ? 'solid' : 'soft'"
            class="h-full justify-center text-center px-1 sm:h-auto sm:px-2.5"
            @click="store.stockFilter = 'all'"
          >
            All items ({{ store.totalCount }})
          </UButton>
          <UButton
            size="md"
            :color="store.stockFilter === 'in-stock' ? 'primary' : 'neutral'"
            :variant="store.stockFilter === 'in-stock' ? 'solid' : 'soft'"
            class="h-full justify-center text-center px-1 sm:h-auto sm:px-2.5"
            @click="store.stockFilter = 'in-stock'"
          >
            In stock ({{ store.inStockCount }})
          </UButton>
          <UButton
            size="md"
            :color="store.stockFilter === 'out-of-stock' ? 'error' : 'neutral'"
            :variant="store.stockFilter === 'out-of-stock' ? 'solid' : 'soft'"
            class="h-full justify-center text-center px-1 sm:h-auto sm:px-2.5"
            @click="store.stockFilter = 'out-of-stock'"
          >
            Out of stock ({{ store.outOfStockCount }})
          </UButton>
          <UButton
            size="md"
            :color="store.stockFilter === 'due' ? 'warning' : 'neutral'"
            :variant="store.stockFilter === 'due' ? 'solid' : 'soft'"
            class="h-full justify-center text-center px-1 sm:h-auto sm:px-2.5"
            @click="store.stockFilter = 'due'"
          >
            Due for restock ({{ store.dueCount }})
          </UButton>
        </div>

        <!-- Category & Sort Selects -->
        <div class="flex items-center gap-2 w-full lg:w-auto min-w-0 justify-start lg:justify-end">
          <CategorySelect
            v-model="store.selectedCategory"
            class="flex-1 min-w-0 sm:flex-none sm:w-48"
          />
          <PantrySortSelect
            v-model="sortBy"
            :show-next-due="true"
            class="flex-1 min-w-0 sm:flex-none sm:w-48"
          />
        </div>
      </div>

      <!-- Mobile Reset Filters Button (full-width on own row, visible when applicable) -->
      <div v-if="isFilterActive" class="sm:hidden w-full pt-1">
        <UButton
          color="primary"
          variant="subtle"
          block
          size="md"
          icon="i-lucide-rotate-ccw"
          @click="resetFilters"
        >
          Reset filters
        </UButton>
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
        @click="resetFilters"
      >
        Reset filters
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

    <!-- Mobile Floating Action Button (FAB) -->
    <div class="sm:hidden fixed right-4 bottom-20 z-30">
      <UButton
        color="primary"
        variant="solid"
        size="xl"
        icon="i-lucide-plus"
        class="rounded-full shadow-lg h-14 w-14 flex items-center justify-center p-0"
        aria-label="Add Pantry Item"
        @click="store.openAddItemModal()"
      />
    </div>
  </div>
</template>
