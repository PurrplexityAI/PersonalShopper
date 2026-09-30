<script setup lang="ts">
import { computed, watch } from "vue";
import type { PantrySortOption } from "~~/app/utils/sort";

interface Props {
  showNextDue?: boolean;
  // eslint-disable-next-line vue/prop-name-casing
  ShowNextDue?: boolean;
  variant?: "outline" | "soft" | "subtle" | "ghost" | "none";
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showNextDue: undefined,
  ShowNextDue: undefined,
  variant: "soft",
  icon: "i-lucide-arrow-up-down",
});

const model = defineModel<PantrySortOption>({ default: "alpha-asc" });

const shouldShowNextDue = computed(() => {
  if (props.ShowNextDue !== undefined) return props.ShowNextDue;
  if (props.showNextDue !== undefined) return props.showNextDue;
  return true;
});

const ALL_SORT_OPTIONS = [
  { label: "Alphabetical (A-z)", value: "alpha-asc" as const, nextDue: false },
  { label: "Alphabetical (Z-a)", value: "alpha-desc" as const, nextDue: false },
  { label: "Last bought (newest)", value: "bought-desc" as const, nextDue: false },
  { label: "Last bought (oldest)", value: "bought-asc" as const, nextDue: false },
  { label: "Next due (soonest)", value: "due-asc" as const, nextDue: true },
  { label: "Next due (latest)", value: "due-desc" as const, nextDue: true },
];

const items = computed(() => {
  return shouldShowNextDue.value
    ? ALL_SORT_OPTIONS
    : ALL_SORT_OPTIONS.filter((opt) => !opt.nextDue);
});

// Fallback if current selection was a Next Due option and ShowNextDue is toggled off
watch(shouldShowNextDue, (show) => {
  if (!show && (model.value === "due-asc" || model.value === "due-desc")) {
    model.value = "alpha-asc";
  }
});
</script>

<template>
  <USelect
    v-model="model"
    :items="items"
    :variant="variant"
    :icon="icon"
    value-key="value"
    label-key="label"
    class="w-full min-w-0"
    :ui="{ base: 'w-full min-w-0', value: 'truncate min-w-0' }"
    v-bind="$attrs"
  />
</template>
