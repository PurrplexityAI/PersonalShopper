<script setup lang="ts">
import { computed } from "vue";
import type { DropdownMenuItem } from "@nuxt/ui";
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";
import { evaluateItemCadence } from "~~/app/utils/cadence";
import {
  formatNextDueLabel,
  formatLastBoughtLabel,
  formatFrequencyLabel,
} from "~~/app/utils/format";

const props = defineProps<{
  item: PantryItem;
}>();

const store = usePantryStore();

const stockStatus = computed<{
  label:
    | "In stock"
    | "Due for restock"
    | "Out of stock"
    | "In stock, on shopping list"
    | "Out of stock, on shopping list";
  color: "success" | "warning" | "error" | "primary";
}>(() => {
  if (props.item.inShoppingList) {
    return props.item.inStock
      ? { label: "In stock, on shopping list", color: "primary" }
      : { label: "Out of stock, on shopping list", color: "error" };
  }
  if (!props.item.inStock) {
    return { label: "Out of stock", color: "error" };
  }
  const cadence = evaluateItemCadence(props.item);
  if (cadence.isDue) {
    return { label: "Due for restock", color: "warning" };
  }
  return { label: "In stock", color: "success" };
});

const menuItems = computed<DropdownMenuItem[]>(() => {
  const items: DropdownMenuItem[] = [
    {
      label: "Edit",
      icon: "i-lucide-pencil",
      onSelect: () => store.openEditItemModal(props.item),
    },
  ];

  if (props.item.inStock) {
    items.push({
      label: "Mark out of stock",
      icon: "i-lucide-circle-x",
      onSelect: () => store.setStock(props.item.id, false),
    });
  } else {
    items.push({
      label: "Mark in stock",
      icon: "i-lucide-check-circle",
      onSelect: () => store.setStock(props.item.id, true),
    });
  }

  items.push({
    label: "Delete",
    icon: "i-lucide-trash-2",
    color: "error",
    onSelect: () => store.deletePantryItem(props.item),
  });

  return items;
});

const nextDueFormatted = computed(() => formatNextDueLabel(props.item.nextDueDate));
const lastBoughtFormatted = computed(() => formatLastBoughtLabel(props.item.lastPurchasedAt));
const frequencyFormatted = computed(() => formatFrequencyLabel(props.item));
</script>

<template>
  <UCard class="h-full flex flex-col" :ui="{ body: 'flex-1' }">
    <template #header>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 flex-1 flex flex-col gap-1">
          <button
            type="button"
            class="font-semibold text-highlighted text-lg hover:text-primary transition-colors cursor-pointer text-left block truncate"
            @click="store.openEditItemModal(item)"
          >
            {{ item.name }}
          </button>

          <p class="text-sm text-muted truncate">
            {{ item.category }}
          </p>

          <div class="flex items-center gap-2">
            <UChip
              standalone
              inset
              :color="stockStatus.color"
              size="md"
            />
            <span class="text-sm font-medium text-toned">
              {{ stockStatus.label }}
            </span>
          </div>
        </div>

        <div class="flex items-center shrink-0">
          <UDropdownMenu :items="menuItems">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-ellipsis-vertical"
              aria-label="Item actions"
            />
          </UDropdownMenu>
        </div>
      </div>
    </template>

    <div class="space-y-2">
      <div class="flex items-center gap-2 text-muted">
        <UIcon name="i-lucide-calendar" class="w-4 h-4 shrink-0 text-dimmed" />
        <span>{{ nextDueFormatted }}</span>
      </div>

      <div class="flex items-center gap-2 text-muted">
        <UIcon name="i-lucide-shopping-bag" class="w-4 h-4 shrink-0 text-dimmed" />
        <span>{{ lastBoughtFormatted }}</span>
      </div>

      <div class="flex items-center gap-2 text-muted">
        <UIcon name="i-lucide-repeat" class="w-4 h-4 shrink-0 text-dimmed" />
        <span>{{ frequencyFormatted }}</span>
      </div>

      <div v-if="item.notes" class="flex items-start gap-2 text-muted">
        <UIcon name="i-lucide-file-text" class="w-4 h-4 shrink-0 text-dimmed mt-0.5" />
        <span class="break-words line-clamp-2">{{ item.notes }}</span>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end">
        <UButton
          v-if="item.inShoppingList"
          color="neutral"
          variant="ghost"
          size="md"
          icon="i-lucide-minus"
          @click="store.deleteFromShoppingList(item)"
        >
          Remove from shopping list
        </UButton>
        <UButton
          v-else
          color="primary"
          variant="solid"
          size="md"
          icon="i-lucide-plus"
          @click="store.handleNeedIt(item)"
        >
          Add to shopping list
        </UButton>
      </div>
    </template>
  </UCard>
</template>
