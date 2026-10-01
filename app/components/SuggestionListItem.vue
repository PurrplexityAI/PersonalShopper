<script setup lang="ts">
import { computed } from "vue";
import type { PantryItem, ShoppingSuggestion } from "~~/shared/types";

interface Props {
  suggestion?: ShoppingSuggestion;
  item?: PantryItem;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "need" | "still-have" | "add", item: PantryItem): void;
}>();

const item = computed<PantryItem>(() => {
  return props.suggestion?.item || props.item!;
});

const reason = computed(() => props.suggestion?.reason || "");
const urgency = computed(() => props.suggestion?.urgency || "low");

function handleNeed(e: Event) {
  (e.currentTarget as HTMLElement)?.blur();
  emit("need", item.value);
}

function handleStillHave(e: Event) {
  (e.currentTarget as HTMLElement)?.blur();
  emit("still-have", item.value);
}
</script>

<template>
  <div class="py-3 px-3.5 border-b border-default flex items-center justify-between gap-3 bg-transparent">
    <!-- Title, Category and reason/cadence on the left -->
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

    <!-- Thumb-friendly action buttons on the right -->
    <div class="flex items-center gap-2.5 shrink-0">
      <UButton
        color="neutral"
        variant="subtle"
        size="md"
        icon="i-lucide-x"
        class="rounded-full cursor-pointer w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center p-0"
        aria-label="Still have it"
        title="Still have it"
        @mousedown.prevent
        @click="handleStillHave"
      />
      <UButton
        color="primary"
        variant="solid"
        size="md"
        icon="i-lucide-check"
        class="rounded-full cursor-pointer w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center p-0"
        aria-label="Need it"
        title="Need it"
        @mousedown.prevent
        @click="handleNeed"
      />
    </div>
  </div>
</template>
