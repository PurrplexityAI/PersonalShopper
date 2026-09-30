<script setup lang="ts">
import { computed } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";

export type CategorySelectValue = string | null;

interface Props {
  categories?: string[];
  variant?: "outline" | "soft" | "subtle" | "ghost" | "none";
  icon?: string;
}

const props = withDefaults(defineProps<Props>(), {
  categories: undefined,
  variant: "soft",
  icon: "i-lucide-tag",
});

const model = defineModel<CategorySelectValue>({ default: null });

const store = usePantryStore();

const availableCategories = computed(() => {
  return props.categories ?? store.categories;
});

const items = computed(() => [
  { label: "All categories", value: null },
  ...availableCategories.value.map((cat) => ({
    label: cat,
    value: cat,
  })),
]);
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
