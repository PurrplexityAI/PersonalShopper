<script setup lang="ts">
import { computed } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import type { ActiveTab } from "~~/shared/types";

const store = usePantryStore();

interface TabItem {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: string;
}

const tabs = computed<TabItem[]>(() => [
  {
    id: "shopping",
    label: "Shopping List",
    shortLabel: "Shopping",
    icon: "i-lucide-shopping-cart",
  },
  {
    id: "pantry",
    label: "Pantry Inventory",
    shortLabel: "Pantry",
    icon: "i-lucide-package",
  },
]);
</script>

<template>
  <div>
    <!-- Desktop Tabs (Fixed Top) -->
    <nav aria-label="Desktop Navigation" class="hidden sm:block fixed top-0 left-0 right-0 z-40 border-b border-default bg-default/95 backdrop-blur-md shadow-xs safe-top">
      <div class="max-w-5xl mx-auto px-4 flex space-x-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="flex items-center space-x-2 py-3 px-4 border-b-2 font-medium transition-all cursor-pointer"
          :class="[
            store.activeTab === tab.id
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-highlighted hover:border-accented'
          ]"
          @click="store.activeTab = tab.id"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" :class="store.activeTab === tab.id ? 'text-primary' : 'text-dimmed'" />
          <span>{{ tab.label }}</span>
        </button>
      </div>
    </nav>

    <!-- Mobile Bottom Navigation Bar (Fixed) -->
    <nav aria-label="Mobile Navigation" class="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-default/95 backdrop-blur-md border-t border-default safe-bottom transform-gpu">
      <div class="grid grid-cols-2 h-16">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="relative flex flex-col items-center justify-center transition-colors cursor-pointer"
          :class="store.activeTab === tab.id ? 'text-primary font-medium' : 'text-muted hover:text-highlighted'"
          @click="store.activeTab = tab.id"
        >
          <div class="relative">
            <UIcon
              :name="tab.icon"
              class="w-5 h-5 transition-transform"
              :class="store.activeTab === tab.id ? 'scale-110 text-primary' : 'text-muted'"
            />
          </div>
          <span class="mt-1">{{ tab.shortLabel }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>
