<script setup lang="ts">
import { computed } from "vue";
import { useMediaQuery } from "@vueuse/core";
import type { PantryItem } from "~~/shared/types";

interface Props {
  open: boolean;
  item: PantryItem | null;
  anomalyType: "high" | "low" | null;
  expectedDays: number;
  lastedDays: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "select", option: 1 | 2): void;
  (e: "close"): void;
}>();

const isDesktop = useMediaQuery("(min-width: 640px)");

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit("update:open", val),
});

const subtitle = computed(() => {
  return `Expected every ${props.expectedDays} days • Lasted ${props.lastedDays} days`;
});

const bodyMessage = computed(() => {
  if (!props.item) return "";
  if (props.anomalyType === "high") {
    return `You didn't need "${props.item.name}" as often this time.`;
  }
  return `You need "${props.item.name}" sooner than expected.`;
});

const option1Title = computed(() => {
  return props.anomalyType === "high" ? "Suggest this less often" : "Suggest this more often";
});

const option1Subtitle = computed(() => {
  return props.anomalyType === "high"
    ? "Choose when your usage has slowed down."
    : "Choose when your usage has increased.";
});

const option2Title = computed(() => "Keep the usual frequency");

const option2Subtitle = computed(() => {
  return props.anomalyType === "high"
    ? "Choose when you had a one-off delay or bought extra last time."
    : "Choose when you had a one-off runout or bought less last time.";
});

function handleSelect(option: 1 | 2) {
  emit("select", option);
  isOpen.value = false;
}
</script>

<template>
  <!-- Desktop: UModal -->
  <UModal
    v-if="isDesktop"
    v-model:open="isOpen"
    :title="'Smart frequency tracking'"
    :description="subtitle"
    :close="true"
    :ui="{
      content: 'sm:max-w-md',
      header: 'p-4 sm:p-5 border-b border-default',
      title: 'text-lg font-bold text-highlighted',
      description: 'text-sm text-muted mt-1',
      body: 'p-4 sm:p-5 space-y-4'
    }"
  >
    <template #body>
      <p class="text-base text-toned font-medium">
        {{ bodyMessage }}
      </p>

      <div class="space-y-3 pt-1">
        <!-- Option 1 -->
        <UButton
          color="neutral"
          variant="soft"
          block
          class="justify-start text-left p-3.5 h-auto rounded-xl cursor-pointer"
          @click="handleSelect(1)"
        >
          <div class="flex flex-col gap-0.5 text-left w-full">
            <span class="font-semibold text-highlighted text-base">
              {{ option1Title }}
            </span>
            <span class="text-sm text-muted font-normal whitespace-normal">
              {{ option1Subtitle }}
            </span>
          </div>
        </UButton>

        <!-- Option 2 -->
        <UButton
          color="neutral"
          variant="soft"
          block
          class="justify-start text-left p-3.5 h-auto rounded-xl cursor-pointer"
          @click="handleSelect(2)"
        >
          <div class="flex flex-col gap-0.5 text-left w-full">
            <span class="font-semibold text-highlighted text-base">
              {{ option2Title }}
            </span>
            <span class="text-sm text-muted font-normal whitespace-normal">
              {{ option2Subtitle }}
            </span>
          </div>
        </UButton>
      </div>
    </template>
  </UModal>

  <!-- Mobile: Nested UDrawer (direction bottom) -->
  <UDrawer
    v-else
    v-model:open="isOpen"
    direction="bottom"
    :title="'Smart frequency tracking'"
    :description="subtitle"
    :handle="false"
    :close="true"
    :ui="{
      container: 'p-4 pb-8 space-y-4 max-h-[85vh] overflow-y-auto',
      header: 'pb-2 border-b border-default',
      title: 'text-lg font-bold text-highlighted',
      description: 'text-sm text-muted mt-1',
      body: 'space-y-4 p-0'
    }"
  >
    <template #body>
      <p class="text-base text-toned font-medium">
        {{ bodyMessage }}
      </p>

      <div class="space-y-3 pt-1">
        <!-- Option 1 -->
        <UButton
          color="neutral"
          variant="soft"
          block
          class="justify-start text-left p-3.5 h-auto rounded-xl cursor-pointer"
          @click="handleSelect(1)"
        >
          <div class="flex flex-col gap-0.5 text-left w-full">
            <span class="font-semibold text-highlighted text-base">
              {{ option1Title }}
            </span>
            <span class="text-sm text-muted font-normal whitespace-normal">
              {{ option1Subtitle }}
            </span>
          </div>
        </UButton>

        <!-- Option 2 -->
        <UButton
          color="neutral"
          variant="soft"
          block
          class="justify-start text-left p-3.5 h-auto rounded-xl cursor-pointer"
          @click="handleSelect(2)"
        >
          <div class="flex flex-col gap-0.5 text-left w-full">
            <span class="font-semibold text-highlighted text-base">
              {{ option2Title }}
            </span>
            <span class="text-sm text-muted font-normal whitespace-normal">
              {{ option2Subtitle }}
            </span>
          </div>
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
