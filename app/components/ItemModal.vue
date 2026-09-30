<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { usePantryStore } from "~~/app/stores/pantry";
import { CADENCE_OPTIONS } from "~~/app/utils/cadence";

const store = usePantryStore();

const name = ref("");
const category = ref("General");
const customCategory = ref("");
const inStock = ref(true);
const quantity = ref(1);
const unit = ref("items");
const frequencyDays = ref(7);
const isCustomCadence = ref(false);
const customDays = ref("7");
const notes = ref("");
const error = ref<string | null>(null);
const isSubmitting = ref(false);

watch(
  () => [store.editingItem, store.isItemModalOpen],
  () => {
    if (store.editingItem) {
      name.value = store.editingItem.name;
      category.value = store.editingItem.category;
      inStock.value = store.editingItem.inStock;
      quantity.value = store.editingItem.quantity || 1;
      unit.value = store.editingItem.unit || "items";
      frequencyDays.value = store.editingItem.frequencyDays || 7;
      const isPreset = CADENCE_OPTIONS.some((p) => p.days === store.editingItem?.frequencyDays);
      isCustomCadence.value = !isPreset;
      customDays.value = String(store.editingItem.frequencyDays || 7);
      notes.value = store.editingItem.notes || "";
    } else {
      // Default item name to active search input if present
      name.value = store.searchQuery.trim();
      category.value = store.categories[0] || "General";
      customCategory.value = "";
      inStock.value = true;
      quantity.value = 1;
      unit.value = "items";
      frequencyDays.value = 7;
      isCustomCadence.value = false;
      customDays.value = "7";
      notes.value = "";
    }
    error.value = null;
  }
);

const categorySelectItems = computed(() => [
  ...store.categories.map((cat) => ({ label: cat, value: cat })),
  { label: "+ Add Custom Category...", value: "__custom__" },
]);

const duplicateConflict = computed(() => {
  const trimmed = name.value.trim().toLowerCase();
  if (!trimmed) return null;
  return store.items.find(
    (item) =>
      item.name.trim().toLowerCase() === trimmed &&
      (!store.editingItem || item.id !== store.editingItem.id)
  );
});

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = "Item name is required";
    return;
  }

  if (duplicateConflict.value) {
    error.value = `An item named "${duplicateConflict.value.name}" already exists in the pantry. Pantry items must be unique.`;
    return;
  }

  const finalCadence = isCustomCadence.value ? parseInt(customDays.value, 10) || 7 : frequencyDays.value;
  const finalCategory = category.value === "__custom__" ? customCategory.value.trim() || "General" : category.value;

  isSubmitting.value = true;
  error.value = null;

  try {
    await store.savePantryItem({
      name: name.value.trim(),
      category: finalCategory,
      inStock: inStock.value,
      quantity: Math.max(0, quantity.value),
      unit: unit.value.trim() || "items",
      frequencyDays: finalCadence,
      notes: notes.value.trim(),
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to save item";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UDrawer
    v-model:open="store.isItemModalOpen"
    direction="right"
    :dismissible="false"
    :close="true"
    :handle="false"
    :title="store.editingItem ? 'Edit Pantry Item' : 'Add New Pantry Item'"
    :ui="{
      content: 'w-full max-w-full sm:w-auto sm:max-w-md h-full',
      container: 'h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto'
    }"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="p-3 bg-error/10 border border-error/20 rounded-xl flex items-start space-x-2 text-error">
          <UIcon name="i-lucide-alert-circle" class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ error }}</span>
        </div>

        <!-- Item Name -->
        <UFormField
          label="Item Name"
          required
          :error="duplicateConflict ? 'Already in pantry. Choose a unique name or edit existing.' : undefined"
        >
          <UInput
            v-model="name"
            placeholder="e.g. Greek Yogurt, Whole Milk, Bananas"
            class="w-full"
            :color="duplicateConflict ? 'error' : 'neutral'"
            required
            @input="error = null"
          />
        </UFormField>

        <!-- Category -->
        <UFormField label="Category">
          <template #label>
            <span class="flex items-center space-x-1">
              <UIcon name="i-lucide-tag" class="w-3.5 h-3.5 text-muted" />
              <span>Category</span>
            </span>
          </template>
          <USelect
            v-model="category"
            :items="categorySelectItems"
            value-key="value"
            class="w-full"
          />
          <UInput
            v-if="category === '__custom__'"
            v-model="customCategory"
            placeholder="Enter new category name"
            class="mt-2 w-full"
          />
        </UFormField>

        <!-- Purchase Cadence -->
        <UFormField label="Purchase Cadence (How often to buy)">
          <template #label>
            <span class="flex items-center space-x-1">
              <UIcon name="i-lucide-calendar" class="w-3.5 h-3.5 text-muted" />
              <span>Purchase Cadence (How often to buy)</span>
            </span>
          </template>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            <UButton
              v-for="preset in CADENCE_OPTIONS"
              :key="preset.days"
              type="button"
              size="md"
              class="justify-center"
              :color="!isCustomCadence && frequencyDays === preset.days ? 'primary' : 'neutral'"
              :variant="!isCustomCadence && frequencyDays === preset.days ? 'subtle' : 'outline'"
              @click="() => { isCustomCadence = false; frequencyDays = preset.days; }"
            >
              {{ preset.label }}
            </UButton>
            <UButton
              type="button"
              size="md"
              class="justify-center"
              :color="isCustomCadence ? 'primary' : 'neutral'"
              :variant="isCustomCadence ? 'subtle' : 'outline'"
              @click="isCustomCadence = true"
            >
              Custom Days
            </UButton>
          </div>

          <div v-if="isCustomCadence" class="flex items-center space-x-2 mt-2">
            <span class="text-toned">Buy every:</span>
            <UInput
              v-model="customDays"
              type="number"
              min="1"
              max="365"
              class="w-24"
            />
            <span class="text-toned">days</span>
          </div>
        </UFormField>

        <!-- Stock Status & Quantity -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <!-- In Stock Toggle -->
          <div class="bg-muted p-3 rounded-xl border border-default flex items-center justify-between">
            <USwitch
              v-model="inStock"
              label="In Stock"
              description="Currently in pantry"
              color="primary"
            />
          </div>

          <!-- Quantity and Unit -->
          <div class="flex space-x-2">
            <UFormField label="Quantity" class="w-1/2">
              <UInput
                v-model.number="quantity"
                type="number"
                min="0"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Unit" class="w-1/2">
              <UInput
                v-model="unit"
                placeholder="pack, bottle, kg"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <!-- Notes -->
        <UFormField label="Notes (optional)">
          <template #label>
            <span class="flex items-center space-x-1">
              <UIcon name="i-lucide-file-text" class="w-3.5 h-3.5 text-muted" />
              <span>Notes (optional)</span>
            </span>
          </template>
          <UInput
            v-model="notes"
            placeholder="e.g. Brand preference, aisle location"
            class="w-full"
          />
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex items-center justify-start space-x-2 w-full">
        <!-- Buttons swapped: Add to pantry / Save changes is first, Cancel is second -->
        <UButton
          color="primary"
          icon="i-lucide-check"
          :disabled="isSubmitting || !!duplicateConflict"
          @click="handleSubmit"
        >
          <span>{{ isSubmitting ? 'Saving...' : store.editingItem ? 'Save Changes' : 'Add to Pantry' }}</span>
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          :disabled="isSubmitting"
          @click="store.closeItemModal()"
        >
          Cancel
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
