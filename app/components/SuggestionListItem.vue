<script setup lang="ts">
import { computed } from "vue";
import type { PantryItem, ShoppingSuggestion } from "~~/shared/types";

interface Props {
  suggestion?: ShoppingSuggestion;
  item?: PantryItem;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "add", item: PantryItem): void;
}>();

const item = computed<PantryItem>(() => {
  return props.suggestion?.item || props.item!;
});

const reason = computed(() => props.suggestion?.reason || "");
const urgency = computed(() => props.suggestion?.urgency || "low");

function handleAdd(e: Event) {
  (e.currentTarget as HTMLElement)?.blur();
  emit("add", item.value);
}
</script>

<template>
  <div class="py-2.5 px-3 border-b border-default flex items-center justify-between gap-3 bg-transparent">
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <!-- Plus icon ghost secondary button to the left instead of usual checkbox circle -->
      <UButton
        color="secondary"
        variant="ghost"
        size="sm"
        icon="i-lucide-plus"
        class="rounded-full shrink-0 cursor-pointer w-8 h-8 flex items-center justify-center p-0"
        aria-label="Add to shopping list"
        title="Add to shopping list"
        @mousedown.prevent
        @click="handleAdd"
      />

      <!-- Title, Category and reason/cadence -->
      <div class="min-w-0 flex-1 flex flex-col gap-0.5">
        <span class="font-semibold text-highlighted text-base block truncate">
          {{ item.name }}
        </span>

        <p class="text-sm text-muted break-words flex items-center gap-1.5 flex-wrap">
          <span>{{ item.category }}</span>
          <template v-if="reason">
            <span>•</span>
            <span
              :class="[
                urgency === 'critical'
                  ? 'text-error font-medium'
                  : urgency === 'high'
                    ? 'text-warning font-medium'
                    : 'text-muted'
              ]"
            >
              {{ reason }}
            </span>
          </template>
          <template v-else-if="item.frequencyLabel">
            <span>•</span>
            <span>{{ item.frequencyLabel }}</span>
          </template>
          <template v-if="item.notes">
            <span>•</span>
            <span>{{ item.notes }}</span>
          </template>
        </p>
      </div>
    </div>
  </div>
</template>
