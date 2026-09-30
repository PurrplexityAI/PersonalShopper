<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useScroll } from "@vueuse/core";
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

// Smart sticky scroll using useScroll with scroll delta hysteresis
const { y } = useScroll(typeof window !== "undefined" ? window : null);
const isStickyVisible = ref(true);
const isScrolledPastTop = computed(() => y.value > 60);
let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;

watch(y, (currentY) => {
  const delta = currentY - lastScrollY;

  // Near the top of the page, always keep the panel fully visible
  if (currentY <= 60) {
    isStickyVisible.value = true;
    lastScrollY = currentY;
    return;
  }

  // Scrolling DOWN by more than 15px -> hide panel
  if (delta > 15) {
    isStickyVisible.value = false;
    lastScrollY = currentY;
  }
  // Scrolling UP by more than 15px -> show panel smoothly
  else if (delta < -15) {
    isStickyVisible.value = true;
    lastScrollY = currentY;
  }
});

function resetViewportToTop() {
  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, behavior: "instant" });
    isStickyVisible.value = true;
    lastScrollY = 0;
  }
}

// Reset viewport to top whenever filters change to prevent viewport shift
watch(
  [
    () => store.searchQuery,
    () => store.stockFilter,
    () => store.selectedCategory,
    () => sortBy.value,
  ],
  () => {
    resetViewportToTop();
  }
);

function resetFilters() {
  store.searchQuery = "";
  store.selectedCategory = null;
  store.stockFilter = "all";
  sortBy.value = "alpha-asc";
  resetViewportToTop();
}

function scrollToItems() {
  nextTick(() => {
    const el = document.getElementById("pantry-items-start");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}
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

        <!-- Desktop Reset Filters Button (ghost variant, lights up when active) -->
        <UButton
          size="sm"
          icon="i-lucide-rotate-ccw"
          variant="ghost"
          class="hidden sm:inline-flex"
          :color="isFilterActive ? 'primary' : 'neutral'"
          :disabled="!isFilterActive"
          @click="resetFilters"
        >
          Reset filters
        </UButton>
      </template>
    </AppScreenHeader>

    <!-- Sticky Control Panel (Native sticky with smooth slide reveal/hide) -->
    <div
      class="sticky top-0 sm:top-12 z-20 bg-muted -mx-4 px-4 pt-3 sm:pt-4 pb-3 transition-[transform,box-shadow,border-color] duration-300 ease-out"
      :class="[
        isStickyVisible ? 'translate-y-0' : '-translate-y-full pointer-events-none',
        isScrolledPastTop ? 'border-b border-default/50 shadow-xs' : 'border-b border-transparent shadow-none'
      ]"
    >
      <div class="flex flex-col gap-3">
        <!-- Search Input & Mobile Arrow Button -->
        <div class="flex items-center gap-2">
          <UInput
            v-model="store.searchQuery"
            icon="i-lucide-search"
            placeholder="Search pantry by name, category..."
            class="flex-1"
            size="md"
            @keydown.enter.prevent="scrollToItems"
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

          <!-- Mobile Right Arrow Button (lights when user has search input, smooth scrolls to items display) -->
          <UButton
            class="sm:hidden shrink-0"
            :color="store.searchQuery.trim() ? 'primary' : 'neutral'"
            :variant="store.searchQuery.trim() ? 'solid' : 'subtle'"
            :disabled="!store.searchQuery.trim()"
            icon="i-lucide-arrow-right"
            aria-label="Scroll to results"
            title="Scroll to results"
            @click="scrollToItems"
          />
        </div>

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
    </div>

    <!-- Items Display Section -->
    <div id="pantry-items-start" class="scroll-mt-36 sm:scroll-mt-48">
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
