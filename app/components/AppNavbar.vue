<script setup lang="ts">
import { usePantryStore } from "~~/app/stores/pantry";
import type { ActiveTab } from "~~/shared/types";

const store = usePantryStore();

const tabs = computed(() => [
  {
    id: "shopping" as ActiveTab,
    label: "Shopping List",
    shortLabel: "Shop List",
    icon: "i-lucide-shopping-cart",
    badge: store.shoppingList.length,
    badgeColor: "bg-emerald-600 text-white",
  },
  {
    id: "pantry" as ActiveTab,
    label: "Pantry Inventory",
    shortLabel: "Pantry",
    icon: "i-lucide-package",
    badge: store.totalCount,
    badgeColor: "bg-slate-200 text-slate-700",
  },
  {
    id: "suggestions" as ActiveTab,
    label: "Cadence Suggestions",
    shortLabel: "Suggestions",
    icon: "i-lucide-sparkles",
    badge: store.suggestions.length,
    badgeColor: store.suggestions.length > 0 ? "bg-amber-500 text-white animate-pulse-subtle" : "bg-slate-200 text-slate-700",
  },
]);
</script>

<template>
  <div>
    <!-- Desktop Tabs (Top) -->
    <nav aria-label="Desktop Navigation" class="hidden sm:block border-b border-slate-200 bg-white shadow-xs">
      <div class="max-w-5xl mx-auto px-4 flex space-x-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="flex items-center space-x-2 py-3 px-4 border-b-2 font-medium text-sm transition-all"
          :class="[
            store.activeTab === tab.id
              ? 'border-emerald-600 text-emerald-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          ]"
          @click="store.activeTab = tab.id"
        >
          <UIcon :name="tab.icon" class="w-4 h-4" :class="store.activeTab === tab.id ? 'text-emerald-600' : 'text-slate-400'" />
          <span>{{ tab.label }}</span>
          <span
            v-if="tab.badge > 0"
            class="ml-1.5 px-2 py-0.5 text-xs rounded-full font-semibold"
            :class="tab.badgeColor"
          >
            {{ tab.badge }}
          </span>
        </button>
      </div>
    </nav>

    <!-- Mobile Bottom Navigation Bar (Fixed) -->
    <nav aria-label="Mobile Navigation" class="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 safe-bottom">
      <div class="grid grid-cols-3 h-16">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="relative flex flex-col items-center justify-center transition-colors"
          :class="store.activeTab === tab.id ? 'text-emerald-600 font-medium' : 'text-slate-500 hover:text-slate-800'"
          @click="store.activeTab = tab.id"
        >
          <div class="relative">
            <UIcon
              :name="tab.icon"
              class="w-5 h-5 transition-transform"
              :class="store.activeTab === tab.id ? 'scale-110 text-emerald-600' : 'text-slate-500'"
            />
            <span
              v-if="tab.badge > 0"
              class="absolute -top-1.5 -right-3 px-1.5 py-0.2 min-w-[18px] text-[10px] leading-tight text-center rounded-full font-bold shadow-xs"
              :class="tab.badgeColor"
            >
              {{ tab.badge > 99 ? '99+' : tab.badge }}
            </span>
          </div>
          <span class="text-[11px] mt-1">{{ tab.shortLabel }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>
