<script setup lang="ts">
import { usePantryStore } from "~~/app/stores/pantry";
import type { ActiveTab } from "~~/shared/types";

const store = usePantryStore();

interface TabItem {
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: string;
  badge: number;
  color: "primary" | "neutral" | "warning";
  variant: "solid" | "subtle";
}

const tabs = computed<TabItem[]>(() => [
  {
    id: "shopping",
    label: "Shopping List",
    shortLabel: "Shop List",
    icon: "i-lucide-shopping-cart",
    badge: store.shoppingList.length,
    color: "primary",
    variant: "solid",
  },
  {
    id: "pantry",
    label: "Pantry Inventory",
    shortLabel: "Pantry",
    icon: "i-lucide-package",
    badge: store.totalCount,
    color: "neutral",
    variant: "subtle",
  },
  {
    id: "suggestions",
    label: "Cadence Suggestions",
    shortLabel: "Suggestions",
    icon: "i-lucide-sparkles",
    badge: store.suggestions.length,
    color: store.suggestions.length > 0 ? "warning" : "neutral",
    variant: store.suggestions.length > 0 ? "solid" : "subtle",
  },
]);
</script>

<template>
  <div>
    <!-- Desktop Tabs (Top) -->
    <nav aria-label="Desktop Navigation" class="hidden sm:block border-b border-default bg-default shadow-xs">
      <div class="max-w-5xl mx-auto px-4 flex space-x-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="flex items-center space-x-2 py-3 px-4 border-b-2 font-medium transition-all"
          :class="[
            store.activeTab === tab.id
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-highlighted hover:border-accented'
          ]"
          @click="store.activeTab = tab.id"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" :class="store.activeTab === tab.id ? 'text-primary' : 'text-dimmed'" />
          <span>{{ tab.label }}</span>
          <UBadge
            v-if="tab.badge > 0"
            :color="tab.color"
            :variant="tab.variant"
            size="md"
            class="ml-1 rounded-full"
          >
            {{ tab.badge }}
          </UBadge>
        </button>
      </div>
    </nav>

    <!-- Mobile Bottom Navigation Bar (Fixed) -->
    <nav aria-label="Mobile Navigation" class="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-default/95 backdrop-blur-md border-t border-default safe-bottom">
      <div class="grid grid-cols-3 h-16">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="relative flex flex-col items-center justify-center transition-colors"
          :class="store.activeTab === tab.id ? 'text-primary font-medium' : 'text-muted hover:text-highlighted'"
          @click="store.activeTab = tab.id"
        >
          <div class="relative">
            <UIcon
              :name="tab.icon"
              class="w-5 h-5 transition-transform"
              :class="store.activeTab === tab.id ? 'scale-110 text-primary' : 'text-muted'"
            />
            <UBadge
              v-if="tab.badge > 0"
              :color="tab.color"
              :variant="tab.variant"
              size="md"
              class="absolute -top-1.5 -right-3 rounded-full"
            >
              {{ tab.badge > 99 ? '99+' : tab.badge }}
            </UBadge>
          </div>
          <span class="mt-1">{{ tab.shortLabel }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>
