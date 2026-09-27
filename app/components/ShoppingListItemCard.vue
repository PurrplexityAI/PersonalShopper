<script setup lang="ts">
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";

interface Props {
  item: PantryItem;
  checked?: boolean;
  hideDelete?: boolean;
}

withDefaults(defineProps<Props>(), {
  checked: false,
  hideDelete: false,
});

defineEmits<{
  (e: "toggle-check"): void;
}>();

const store = usePantryStore();
</script>

<template>
  <UCard :ui="{ body: 'p-3.5 sm:p-4' }">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-start gap-3 min-w-0 flex-1">
        <!-- Checkbox: hover reveals tick without changing background or border color -->
        <button
          type="button"
          class="w-8 h-8 rounded-full border border-primary flex items-center justify-center transition-opacity group/check shrink-0 cursor-pointer mt-2"
          :class="[
            checked
              ? 'bg-primary border-primary text-inverted'
              : 'text-primary'
          ]"
          :title="checked ? 'Mark unpurchased (add back to shopping list)' : 'Tick off (Bought - reset cadence & mark in stock)'"
          :aria-label="checked ? 'Mark unpurchased' : 'Tick off'"
          @click="$emit('toggle-check')"
        >
          <UIcon
            name="i-lucide-check"
            class="w-5 h-5 transition-opacity"
            :class="[
              checked ? 'opacity-100' : 'opacity-0 group-hover/check:opacity-100'
            ]"
          />
        </button>

        <!-- Title, Category and optional Note -->
        <div class="min-w-0 flex-1 flex flex-col gap-0.5">
          <button
            type="button"
            class="font-semibold text-highlighted text-lg hover:text-primary transition-colors cursor-pointer text-left block truncate"
            @click="store.openEditItemModal(item)"
          >
            {{ item.name }}
          </button>

          <p class="text-sm text-muted break-words">
            <span>{{ item.category }}</span>
            <template v-if="item.notes">
              <span> • {{ item.notes }}</span>
            </template>
          </p>
        </div>
      </div>

      <!-- Delete Button (anchored at assumed minimum height vertical center) -->
      <div v-if="!hideDelete" class="shrink-0 mt-2">
        <UButton
          color="neutral"
          variant="ghost"
          size="md"
          icon="i-lucide-trash-2"
          title="Didn't buy it (Remove from list without resetting cadence)"
          aria-label="Didn't buy it"
          @click="store.deleteFromShoppingList(item)"
        />
      </div>
    </div>
  </UCard>
</template>
