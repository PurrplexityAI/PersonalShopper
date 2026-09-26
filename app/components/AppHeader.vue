<script setup lang="ts">
import { usePantryStore } from "~~/app/stores/pantry";

const store = usePantryStore();
</script>

<template>
  <header class="sticky top-0 z-30 bg-default/90 backdrop-blur-md border-b border-default safe-top">
    <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-inverted shadow-md">
          <UIcon name="i-lucide-shopping-basket" class="w-5 h-5 text-inverted" />
        </div>
        <div>
          <h1 class="text-lg sm:text-xl font-bold tracking-tight text-highlighted leading-tight">
            Personal Shopper
          </h1>
          <p class="text-muted hidden sm:block">
            Pantry Inventory & Smart Cadence Shopping
          </p>
        </div>
      </div>

      <div class="flex items-center space-x-2">
        <UButton
          color="neutral"
          variant="ghost"
          aria-label="Refresh Data"
          title="Refresh Data"
          :disabled="store.isRefreshing"
          @click="store.loadData(false)"
        >
          <UIcon
            name="i-lucide-refresh-cw"
            class="w-4 h-4 text-toned"
            :class="{ 'animate-spin text-primary': store.isRefreshing }"
          />
        </UButton>

        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-smartphone"
          title="Mobile Access"
          @click="store.openDataModal()"
        >
          <span class="hidden sm:inline">Mobile</span>
          <span class="sm:hidden">Mobile</span>
        </UButton>
      </div>
    </div>
  </header>
</template>
