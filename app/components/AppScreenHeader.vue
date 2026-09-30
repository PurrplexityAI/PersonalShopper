<script setup lang="ts">
import { computed } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import type { DropdownMenuItem } from "@nuxt/ui";

defineProps<{
  title: string;
}>();

const store = usePantryStore();

const menuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: "Refresh",
      icon: "i-lucide-refresh-cw",
      disabled: store.isRefreshing,
      onSelect: () => {
        store.loadData(false);
      },
    },
  ],
]);
</script>

<template>
  <div class="flex items-center justify-between mt-2 sm:mt-3 mb-4">
    <h1 class="text-xl font-bold tracking-tight text-highlighted">
      {{ title }}
    </h1>

    <div class="flex items-center gap-2">
      <slot name="actions" />

      <UDropdownMenu :items="menuItems" :content="{ align: 'end' }">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-ellipsis-vertical"
          aria-label="Screen context menu"
          title="More options"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>
