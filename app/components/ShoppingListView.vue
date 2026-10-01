<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from "vue";
import { useFocus, useMediaQuery } from "@vueuse/core";
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";
import { sortPantryItems, type PantrySortOption } from "~~/app/utils/sort";
import { CADENCE_OPTIONS, sortSuggestionsSoonestFirst } from "~~/app/utils/cadence";
import AppScreenHeader from "./AppScreenHeader.vue";
import CategorySelect from "./CategorySelect.vue";
import PantrySortSelect from "./PantrySortSelect.vue";
import ShoppingListItemCard from "./ShoppingListItemCard.vue";
import SuggestionListItem from "./SuggestionListItem.vue";
import AnomalyModal from "./AnomalyModal.vue";
import { calculateBurnRatio } from "~~/app/utils/frequency";

const store = usePantryStore();
const toast = useToast();

const isDesktop = useMediaQuery("(min-width: 640px)");
const isDesktopSuggestionsOpen = ref(false);
const isMobileSuggestionsOpen = ref(false);
const isMobileFullScreen = ref(false);
const removingSuggestionIds = ref<Set<string>>(new Set());

// Anomaly modal state
const isAnomalyOpen = ref(false);
const anomalyItem = ref<PantryItem | null>(null);
const anomalyType = ref<"high" | "low" | null>(null);
const anomalyInitialAction = ref<"need" | "still_have">("need");
const anomalyExpectedDays = ref(7);
const anomalyLastedDays = ref(7);
const anomalyAdjustedDays = ref(7);

const selectedCategory = ref<string | null>(null);
const sortBy = ref<PantrySortOption>("alpha-asc");

const orderedSuggestions = computed(() => {
  return sortSuggestionsSoonestFirst(store.suggestions);
});

const displayedSuggestions = computed(() => {
  return orderedSuggestions.value.filter(
    (sug) => !removingSuggestionIds.value.has(sug.item.id)
  );
});

const isSuggestionsDrawerOpen = computed(() => {
  return isDesktop.value ? isDesktopSuggestionsOpen.value : isMobileSuggestionsOpen.value;
});

function checkAndMarkCandidateSuggestions() {
  if (!isSuggestionsDrawerOpen.value) return;
  const toMark: string[] = [];
  for (const sug of displayedSuggestions.value) {
    const it = sug.item;
    if (!it.lastSuggestedAt) {
      toMark.push(it.id);
    } else if (it.lastPurchasedAt && new Date(it.lastSuggestedAt).getTime() < new Date(it.lastPurchasedAt).getTime()) {
      toMark.push(it.id);
    }
  }
  if (toMark.length > 0) {
    store.markSuggestedItems(toMark);
  }
}

watch(
  [isSuggestionsDrawerOpen, () => displayedSuggestions.value.map((s) => s.item.id).join(",")],
  () => {
    checkAndMarkCandidateSuggestions();
  },
  { immediate: true }
);

function handleMobileListScroll(e: Event) {
  const el = e.target as HTMLElement;
  if (el.scrollTop > 10 && !isMobileFullScreen.value) {
    isMobileFullScreen.value = true;
  }
}

function closeMobileSuggestions() {
  isMobileSuggestionsOpen.value = false;
  isMobileFullScreen.value = false;
}

function openMobileSuggestionsDrawer() {
  isMobileFullScreen.value = false;
  isMobileSuggestionsOpen.value = true;
}

function showSuggestionToast(item: PantryItem) {
  if (!isDesktop.value) {
    toast.clear();
    toast.add({
      id: "suggestion-toast",
      title: `${item.name} added to shopping list`,
      actions: [
        {
          label: "Undo",
          onClick: async () => {
            removingSuggestionIds.value.delete(item.id);
            await store.deleteFromShoppingList(item);
          },
        },
      ],
    });
  }
}

async function handleNeedIt(item: PantryItem, isImperative = false) {
  if (item.autoFrequency === false || !item.lastPurchasedAt) {
    if (!isImperative) {
      removingSuggestionIds.value.add(item.id);
    }
    if (selectedCategory.value !== null && selectedCategory.value !== item.category) {
      selectedCategory.value = null;
    }
    await store.updateItemDirect(item.id, {
      inShoppingList: true,
      lastSuggestedAt: null,
    });
    smoothScrollToItem(item.id);
    if (!isImperative) {
      showSuggestionToast(item);
      setTimeout(() => {
        removingSuggestionIds.value.delete(item.id);
      }, 1000);
    }
    return;
  }

  const evalItem = isImperative ? { ...item, lastSuggestedAt: new Date().toISOString() } : item;
  const result = calculateBurnRatio(evalItem, new Date());
  if (result.classification === "normal") {
    if (!isImperative) {
      removingSuggestionIds.value.add(item.id);
    }
    if (selectedCategory.value !== null && selectedCategory.value !== item.category) {
      selectedCategory.value = null;
    }
    await store.updateItemDirect(item.id, {
      inShoppingList: true,
      frequencyDays: result.adjustedFrequencyDays,
      lastSuggestedAt: null,
    });
    smoothScrollToItem(item.id);
    if (!isImperative) {
      showSuggestionToast(item);
      setTimeout(() => {
        removingSuggestionIds.value.delete(item.id);
      }, 1000);
    }
  } else {
    anomalyItem.value = item;
    anomalyType.value = result.classification === "high_anomaly" ? "high" : "low";
    anomalyInitialAction.value = "need";
    anomalyExpectedDays.value = Math.round(item.frequencyDays);
    anomalyLastedDays.value = Math.round(result.elapsedDays);
    anomalyAdjustedDays.value = result.adjustedFrequencyDays;
    isAnomalyOpen.value = true;
  }
}

async function handleStillHave(item: PantryItem) {
  const nowIso = new Date().toISOString();
  if (item.autoFrequency === false || !item.lastPurchasedAt) {
    removingSuggestionIds.value.add(item.id);
    await store.updateItemDirect(item.id, {
      inStock: true,
      lastPurchasedAtPrevious: item.lastPurchasedAt,
      lastPurchasedAt: nowIso,
      lastSuggestedAt: null,
    });
    setTimeout(() => {
      removingSuggestionIds.value.delete(item.id);
    }, 1000);
    return;
  }

  const result = calculateBurnRatio(item, new Date());
  if (result.classification === "normal") {
    removingSuggestionIds.value.add(item.id);
    await store.updateItemDirect(item.id, {
      inStock: true,
      lastPurchasedAtPrevious: item.lastPurchasedAt,
      lastPurchasedAt: nowIso,
      lastSuggestedAt: null,
    });
    setTimeout(() => {
      removingSuggestionIds.value.delete(item.id);
    }, 1000);
  } else {
    anomalyItem.value = item;
    anomalyType.value = result.classification === "high_anomaly" ? "high" : "low";
    anomalyInitialAction.value = "still_have";
    anomalyExpectedDays.value = Math.round(item.frequencyDays);
    anomalyLastedDays.value = Math.round(result.elapsedDays);
    anomalyAdjustedDays.value = result.adjustedFrequencyDays;
    isAnomalyOpen.value = true;
  }
}

async function handleAnomalySelect(option: 1 | 2) {
  const item = anomalyItem.value;
  if (!item) return;

  const initialAction = anomalyInitialAction.value;
  const aType = anomalyType.value;
  const nowIso = new Date().toISOString();

  removingSuggestionIds.value.add(item.id);
  if (initialAction === "need" && selectedCategory.value !== null && selectedCategory.value !== item.category) {
    selectedCategory.value = null;
  }

  if (aType === "high") {
    if (option === 1) {
      if (initialAction === "need") {
        await store.updateItemDirect(item.id, {
          inShoppingList: true,
          frequencyDays: anomalyAdjustedDays.value,
          lastSuggestedAt: null,
        });
      } else {
        await store.updateItemDirect(item.id, {
          inStock: true,
          lastPurchasedAtPrevious: item.lastPurchasedAt,
          lastPurchasedAt: nowIso,
          frequencyDays: anomalyAdjustedDays.value,
          lastSuggestedAt: null,
        });
      }
    } else {
      if (initialAction === "need") {
        await store.updateItemDirect(item.id, {
          inShoppingList: true,
          lastSuggestedAt: null,
        });
      } else {
        await store.updateItemDirect(item.id, {
          inStock: true,
          lastPurchasedAtPrevious: item.lastPurchasedAt,
          lastPurchasedAt: nowIso,
          lastSuggestedAt: null,
        });
      }
    }
  } else if (aType === "low") {
    if (option === 1) {
      if (initialAction === "need") {
        await store.updateItemDirect(item.id, {
          inShoppingList: true,
          frequencyDays: anomalyAdjustedDays.value,
          lastSuggestedAt: null,
        });
      } else {
        await store.updateItemDirect(item.id, {
          inStock: true,
          lastPurchasedAtPrevious: item.lastPurchasedAt,
          lastPurchasedAt: nowIso,
          frequencyDays: anomalyAdjustedDays.value,
          lastSuggestedAt: null,
        });
      }
    } else {
      if (initialAction === "need") {
        await store.updateItemDirect(item.id, {
          inShoppingList: true,
          lastSuggestedAt: null,
        });
      } else {
        await store.updateItemDirect(item.id, {
          inStock: true,
          lastPurchasedAtPrevious: item.lastPurchasedAt,
          lastPurchasedAt: nowIso,
          lastSuggestedAt: null,
        });
      }
    }
  }

  if (initialAction === "need") {
    smoothScrollToItem(item.id);
    // Don't show toast when smart frequency tracking is triggered
  }

  anomalyItem.value = null;

  setTimeout(() => {
    removingSuggestionIds.value.delete(item.id);
  }, 1000);
}


// On mobile, when suggestions list is empty, close the drawer
watch(
  () => displayedSuggestions.value.length,
  (count) => {
    if (!isDesktop.value && isMobileSuggestionsOpen.value && count === 0) {
      setTimeout(() => {
        if (!isDesktop.value && displayedSuggestions.value.length === 0 && isMobileSuggestionsOpen.value) {
          closeMobileSuggestions();
        }
      }, 250);
    }
  }
);

// Session auto-open on first entry to screen (both desktop and mobile)
onMounted(() => {
  if (!store.hasCheckedSuggestionsSession) {
    store.hasCheckedSuggestionsSession = true;
    if (store.suggestions.length > 0) {
      const isDesktopView = typeof window !== "undefined" ? window.innerWidth >= 640 : isDesktop.value;
      if (isDesktopView) {
        isDesktopSuggestionsOpen.value = true;
      } else {
        openMobileSuggestionsDrawer();
      }
    }
  }
});


const filteredShoppingList = computed(() => {
  return store.shoppingList.filter((item) => {
    if (selectedCategory.value !== null && item.category !== selectedCategory.value) {
      return false;
    }
    return true;
  });
});

const displayedShoppingList = computed(() => {
  return sortPantryItems(filteredShoppingList.value, sortBy.value);
});

// Quick Add State
const quickInput = ref("");

const newCategory = ref("General");
const hasChosenNewCategory = ref(false);

const newCadence = ref(30); // Default to Monthly (30d)
const hasChosenNewCadence = ref(false);

const isDesktopInputFocused = ref(false);
const desktopInputRef = ref<{ inputRef?: HTMLInputElement | null; $el?: HTMLElement } | null>(null);

const desktopInputElement = computed(() => {
  return desktopInputRef.value?.inputRef || desktopInputRef.value?.$el?.querySelector("input") || null;
});

function focusDesktopInput() {
  nextTick(() => {
    isDesktopInputFocused.value = true;
    desktopInputElement.value?.focus();
  });
  setTimeout(() => {
    desktopInputElement.value?.focus();
  }, 50);
}

const isMobileDrawerOpen = ref(false);
const mobileInputRef = ref<{ inputRef?: HTMLInputElement | null; $el?: HTMLElement } | null>(null);

const mobileInputElement = computed(() => {
  return mobileInputRef.value?.inputRef || mobileInputRef.value?.$el?.querySelector("input") || null;
});

const { focused: isMobileInputFocused } = useFocus(mobileInputElement);

watch(isMobileDrawerOpen, (isOpen) => {
  if (isOpen) {
    setTimeout(() => {
      isMobileInputFocused.value = true;
      mobileInputElement.value?.focus();
    }, 400);
  }
});

const availableCategories = computed(() => {
  const defaultCats = [
    "General",
    "Produce",
    "Dairy & Eggs",
    "Bakery",
    "Meat & Seafood",
    "Pantry Staples",
    "Beverages",
    "Snacks",
    "Household",
    "Personal Care",
  ];
  return Array.from(new Set([...defaultCats, ...store.categories])).filter(Boolean);
});

const categoryMenuItems = computed(() => [
  availableCategories.value.map((cat) => ({
    label: cat,
    type: "checkbox" as const,
    checked: newCategory.value === cat,
    onSelect: () => {
      newCategory.value = cat;
      hasChosenNewCategory.value = true;
    },
  })),
]);

const cadenceMenuItems = computed(() => [
  CADENCE_OPTIONS.map((opt) => ({
    label: opt.label,
    type: "checkbox" as const,
    checked: newCadence.value === opt.days,
    onSelect: () => {
      newCadence.value = opt.days;
      hasChosenNewCadence.value = true;
    },
  })),
]);

const selectedCadenceLabel = computed(() => {
  const found = CADENCE_OPTIONS.find((opt) => opt.days === newCadence.value);
  return found?.label || `${newCadence.value}d`;
});

function resetInput() {
  quickInput.value = "";
  newCategory.value = "General";
  hasChosenNewCategory.value = false;
  newCadence.value = 30;
  hasChosenNewCadence.value = false;
  isMobileDrawerOpen.value = false;
}

function smoothScrollToItem(itemId: string) {
  // If target item is in a category that's filtered out, clear filter so the card is rendered
  const target = store.shoppingList.find((i) => i.id === itemId);
  if (target && selectedCategory.value !== null && target.category !== selectedCategory.value) {
    selectedCategory.value = null;
  }

  nextTick(() => {
    const el = document.getElementById(`shopping-item-${itemId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "transition-all");
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary");
      }, 1800);
    }
  });
}

async function selectItem(item: PantryItem, e?: Event) {
  e?.preventDefault();
  if (selectedCategory.value !== null && selectedCategory.value !== item.category) {
    selectedCategory.value = null;
  }
  if (item.inShoppingList) {
    smoothScrollToItem(item.id);
  } else {
    await handleNeedIt(item, true);
  }
  nextTick(() => {
    resetInput();
    if (!isAnomalyOpen.value) {
      focusDesktopInput();
    }
  });
  setTimeout(() => {
    resetInput();
    if (!isAnomalyOpen.value) {
      focusDesktopInput();
    }
  }, 50);
}

const autocompleteItems = computed(() => {
  return store.items.map((item) => ({
    label: item.name,
    value: item.name,
    onSelect: (e?: Event) => {
      selectItem(item, e);
    },
  }));
});

async function handleSubmitInput() {
  const trimmed = quickInput.value.trim();
  if (!trimmed) return;

  // 1. If already in shopping list -> smooth scroll to it
  const existingOnShoppingList = store.shoppingList.find(
    (i) => i.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existingOnShoppingList) {
    if (selectedCategory.value !== null && selectedCategory.value !== existingOnShoppingList.category) {
      selectedCategory.value = null;
    }
    smoothScrollToItem(existingOnShoppingList.id);
    resetInput();
    focusDesktopInput();
    return;
  }

  // 2. If exists in pantry (not yet in shopping list) -> add it
  const existingInPantry = store.items.find(
    (i) => i.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existingInPantry) {
    if (selectedCategory.value !== null && selectedCategory.value !== existingInPantry.category) {
      selectedCategory.value = null;
    }
    await handleNeedIt(existingInPantry, true);
    resetInput();
    if (!isAnomalyOpen.value) {
      focusDesktopInput();
    }
    return;
  }

  // 3. Brand new item -> create in pantry & add to shopping list
  if (selectedCategory.value !== null && selectedCategory.value !== newCategory.value) {
    selectedCategory.value = null;
  }
  const added = await store.addToShoppingList({
    nameOrId: trimmed,
    quantity: 1,
    category: newCategory.value,
    frequencyDays: newCadence.value,
  });
  if (added) {
    smoothScrollToItem(added.id);
  }
  resetInput();
  focusDesktopInput();
}

function openMobileDrawer() {
  resetInput();
  isMobileDrawerOpen.value = true;
}

const isPurchasedOpen = ref(true);

const purchasedItems = computed<PantryItem[]>(() => {
  return store.sessionPurchased
    .map((s) => {
      const found = store.items.find((item) => item.id === s.id);
      if (found) {
        return {
          ...found,
          lastPurchasedAtPrevious: found.lastPurchasedAtPrevious ?? s.previousLastPurchasedAt ?? null,
        };
      }
      return {
        id: s.id,
        name: s.name,
        category: "Other",
        inStock: true,
        quantity: 1,
        unit: "item",
        frequencyDays: 7,
        frequencyLabel: "Weekly (7d)",
        lastPurchasedAt: new Date().toISOString(),
        lastPurchasedAtPrevious: s.previousLastPurchasedAt ?? null,
        nextDueDate: null,
        inShoppingList: false,
        shoppingListQuantity: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as PantryItem;
    });
});

async function handleCheckOff(item: PantryItem) {
  if (store.sessionPurchased.length === 0) {
    isPurchasedOpen.value = true;
  }
  await store.checkOffShoppingItem(item);
}

async function handleUncheck(item: PantryItem) {
  await store.uncheckShoppingItem(item);
}

// On desktop, close suggestions drawer when pantry item editor modal opens
watch(
  () => store.isItemModalOpen,
  (isOpen) => {
    if (isOpen && isDesktopSuggestionsOpen.value) {
      isDesktopSuggestionsOpen.value = false;
    }
  }
);
</script>

<template>
  <div class="space-y-4 pb-36 sm:pb-36">
    <!-- Screen Header Component (Desktop Category & Sort in Actions Slot) -->
    <div class="space-y-4">
      <AppScreenHeader title="Shopping list">
        <template #actions>
          <div class="hidden sm:flex items-center gap-2">
            <CategorySelect
              v-model="selectedCategory"
              class="w-48"
            />
            <PantrySortSelect
              v-model="sortBy"
              :show-next-due="false"
              class="w-48"
            />
            <UButton
              :color="isDesktopSuggestionsOpen ? 'secondary' : 'neutral'"
              variant="soft"
              icon="i-lucide-lightbulb"
              size="md"
              aria-label="Suggestions"
              title="Suggestions"
              @click="isDesktopSuggestionsOpen = !isDesktopSuggestionsOpen"
            />
          </div>
        </template>
      </AppScreenHeader>

      <!-- Mobile Category & Sort Beneath Title -->
      <div class="sm:hidden flex items-center gap-2 w-full min-w-0">
        <CategorySelect
          v-model="selectedCategory"
          class="flex-1 min-w-0"
        />
        <PantrySortSelect
          v-model="sortBy"
          :show-next-due="false"
          class="flex-1 min-w-0"
        />
      </div>
    </div>

    <!-- Active Shopping List Items -->
    <div class="space-y-3">
      <!-- Empty State: Entire Shopping List is Empty -->
      <div
        v-if="store.shoppingList.length === 0"
        class="bg-default rounded-2xl border border-default p-8 text-center space-y-3"
      >
        <div class="w-14 h-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <UIcon name="i-lucide-shopping-bag" class="w-7 h-7" />
        </div>
        <div>
          <h3 class="font-bold text-highlighted">Your shopping list is clear!</h3>
          <p class="text-muted mt-1 max-w-sm mx-auto">
            All pantry items are stocked, or you're ready to plan your next shop. Use the input bar below or select from Suggestions.
          </p>
        </div>
        <UButton
          v-if="store.suggestions.length > 0"
          color="warning"
          variant="solid"
          size="md"
          icon="i-lucide-lightbulb"
          @click="isDesktop ? (isDesktopSuggestionsOpen = true) : openMobileSuggestionsDrawer()"
        >
          View {{ store.suggestions.length }} Suggestions
        </UButton>
      </div>

      <!-- Empty State: Filtered Category has No Items -->
      <div
        v-else-if="displayedShoppingList.length === 0"
        class="bg-default rounded-2xl border border-default p-8 text-center space-y-3"
      >
        <div class="w-12 h-12 rounded-full bg-muted text-muted mx-auto flex items-center justify-center">
          <UIcon name="i-lucide-tag" class="w-6 h-6" />
        </div>
        <div>
          <h3 class="font-bold text-highlighted">No shopping items in "{{ selectedCategory }}"</h3>
          <p class="text-muted mt-1">
            You have items on your shopping list, but none match this category filter.
          </p>
        </div>
        <UButton
          color="primary"
          variant="subtle"
          size="md"
          @click="selectedCategory = null"
        >
          Show All Categories
        </UButton>
      </div>

      <!-- Item Rows -->
      <div v-else class="space-y-2">
        <ShoppingListItemCard
          v-for="item in displayedShoppingList"
          :id="`shopping-item-${item.id}`"
          :key="item.id"
          :item="item"
          @toggle-check="handleCheckOff(item)"
        />
      </div>
    </div>

    <!-- Purchased This Trip (Session History) -->
    <div v-if="store.sessionPurchased.length > 0" class="mt-6 space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UButton
            color="secondary"
            variant="solid"
            size="md"
            :trailing-icon="isPurchasedOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            label="Purchased this trip"
            @click="isPurchasedOpen = !isPurchasedOpen"
          />
          <UBadge
            color="neutral"
            variant="soft"
            size="md"
          >
            {{ store.sessionPurchased.length }} item(s)
          </UBadge>
        </div>

        <UButton
          color="neutral"
          variant="link"
          size="md"
          class="text-muted hover:text-highlighted p-0 cursor-pointer"
          @click="store.clearSessionPurchased()"
        >
          Clear
        </UButton>
      </div>

      <UCollapsible v-model:open="isPurchasedOpen">
        <template #content>
          <div class="space-y-2 pt-1">
            <ShoppingListItemCard
              v-for="item in purchasedItems"
              :key="item.id"
              :item="item"
              :checked="true"
              :hide-delete="true"
              @toggle-check="handleUncheck(item)"
            />
          </div>
        </template>
      </UCollapsible>
    </div>

    <!-- Desktop Add Item Fixed Bottom Bar (Fixed to bottom, bg-muted provides clipping, generous top padding) -->
    <div class="hidden sm:block fixed bottom-0 left-0 right-0 z-30 bg-muted pt-4 pb-4">
      <div class="max-w-5xl w-full mx-auto px-4">
        <!-- Unified Input Box with buttons side-by-side inside so input respects space occupied by buttons -->
        <div
          class="flex items-center w-full bg-default rounded-xl ring ring-default focus-within:ring-primary shadow-sm transition-all p-1 gap-2"
          :class="{ 'ring-primary': isDesktopInputFocused }"
        >
          <UInputMenu
            ref="desktopInputRef"
            v-model="quickInput"
            mode="autocomplete"
            type="search"
            autocomplete="off"
            autocorrect="off"
            autocapitalize="sentences"
            spellcheck="false"
            name="desktop-add-shopping-item"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            :items="quickInput.trim() ? autocompleteItems : []"
            value-key="value"
            :content="{ side: 'top', align: 'start', hideWhenEmpty: true }"
            placeholder="Add an item to the shopping list"
            :icon="isDesktopInputFocused ? 'i-lucide-circle' : 'i-lucide-plus'"
            variant="none"
            size="lg"
            class="flex-1 min-w-0"
            @focus="isDesktopInputFocused = true"
            @blur="isDesktopInputFocused = false"
            @keydown.enter.prevent="handleSubmitInput"
          />

          <!-- Action buttons inline inside container, respecting text area -->
          <div v-if="quickInput.trim().length > 0" class="flex items-center gap-1.5 shrink-0 pe-2">
            <!-- Category Dropdown Button -->
            <UDropdownMenu :items="categoryMenuItems">
              <UButton
                color="neutral"
                variant="subtle"
                size="xs"
                icon="i-lucide-tag"
                :label="hasChosenNewCategory ? newCategory : undefined"
                title="Category"
              />
            </UDropdownMenu>

            <!-- Cadence Dropdown Button -->
            <UDropdownMenu :items="cadenceMenuItems">
              <UButton
                color="neutral"
                variant="subtle"
                size="xs"
                icon="i-lucide-repeat"
                :label="hasChosenNewCadence ? selectedCadenceLabel : undefined"
                title="Cadence frequency"
              />
            </UDropdownMenu>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Floating Action Bar (Centred Suggestions button + Right-aligned FAB) -->
    <div
      v-if="!isMobileSuggestionsOpen && !isMobileDrawerOpen"
      class="sm:hidden fixed bottom-20 left-0 right-0 h-14 flex items-center justify-center pointer-events-none z-30 px-4"
    >
      <!-- Suggestions Button: Horizontal Centre Display, Vertically Centre Aligned to FAB -->
      <UButton
        color="neutral"
        variant="solid"
        size="lg"
        icon="i-lucide-lightbulb"
        label="Suggestions"
        class="rounded-full shadow-lg pointer-events-auto px-5 font-semibold text-sm cursor-pointer h-11"
        aria-label="Suggestions"
        @click="openMobileSuggestionsDrawer"
      />

      <!-- FAB: Right 4, Vertically Centred with Container -->
      <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto">
        <UButton
          color="primary"
          variant="solid"
          size="xl"
          icon="i-lucide-plus"
          class="rounded-full shadow-lg h-14 w-14 flex items-center justify-center p-0 cursor-pointer"
          aria-label="Add Shopping Item"
          @click="openMobileDrawer"
        />
      </div>
    </div>

    <!-- Mobile Add Item Bottom Drawer (no handle, useFocus for input, reset on open) -->
    <UDrawer
      v-model:open="isMobileDrawerOpen"
      direction="bottom"
      :handle="false"
      :ui="{ container: 'p-4 gap-3' }"
    >
      <template #body>
        <div class="space-y-3 p-1">
          <!-- Input + Solid Up Arrow Button -->
          <div class="flex items-center gap-2">
            <UInputMenu
              ref="mobileInputRef"
              v-model="quickInput"
              mode="autocomplete"
              type="search"
              autocomplete="off"
              autocorrect="off"
              autocapitalize="sentences"
              spellcheck="false"
              name="mobile-add-shopping-item"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
              :items="quickInput.trim() ? autocompleteItems : []"
              value-key="value"
              :content="{ side: 'top', align: 'start', hideWhenEmpty: true }"
              placeholder="Add an item to the shopping list"
              :icon="isMobileInputFocused ? 'i-lucide-circle' : 'i-lucide-plus'"
              size="lg"
              class="flex-1"
              @keydown.enter.prevent="handleSubmitInput"
            />
            <UButton
              color="primary"
              variant="solid"
              size="lg"
              icon="i-lucide-arrow-up"
              :disabled="!quickInput.trim()"
              aria-label="Add Item"
              class="shrink-0"
              @click="handleSubmitInput"
            />
          </div>

          <!-- Category and Frequency Buttons on their own row beneath input -->
          <div class="flex items-center gap-2">
            <!-- Category Button with initial 'Category' label -->
            <UDropdownMenu :items="categoryMenuItems">
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-tag"
                :label="hasChosenNewCategory ? newCategory : 'Category'"
              />
            </UDropdownMenu>

            <!-- Frequency Button with initial 'Frequency' label -->
            <UDropdownMenu :items="cadenceMenuItems">
              <UButton
                color="neutral"
                variant="outline"
                size="sm"
                icon="i-lucide-repeat"
                :label="hasChosenNewCadence ? selectedCadenceLabel : 'Frequency'"
              />
            </UDropdownMenu>
          </div>
        </div>
      </template>
    </UDrawer>

    <!-- Desktop Suggestions Drawer (Right, Non-modal, Close button, No handle) -->
    <UDrawer
      v-if="isDesktop"
      v-model:open="isDesktopSuggestionsOpen"
      direction="right"
      :modal="false"
      :overlay="false"
      :dismissible="false"
      :handle="false"
      :close="true"
      title="Do you need?"
      :ui="{
        content: 'w-80 sm:w-96 max-w-full h-full shadow-xl border-s border-default flex flex-col bg-default',
        container: 'flex flex-col h-full overflow-hidden p-0',
        header: 'px-4 py-3 border-b border-default shrink-0 flex items-center justify-between bg-default',
        title: 'text-lg font-bold text-highlighted',
        body: 'flex-1 overflow-y-auto p-0'
      }"
    >
      <template #body>
        <div class="h-full overflow-y-auto divide-y divide-default">
          <div v-if="displayedSuggestions.length === 0" class="py-12 px-4 text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <UIcon name="i-lucide-check" class="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 class="font-bold text-highlighted text-base">All caught up!</h4>
            <p class="text-sm text-muted max-w-xs mx-auto">
              No items are currently due for replenishment.
            </p>
          </div>

          <TransitionGroup
            v-else
            name="suggestion-anim"
            tag="div"
            class="relative"
          >
            <SuggestionListItem
              v-for="sug in displayedSuggestions"
              :key="sug.item.id"
              :suggestion="sug"
              @need="handleNeedIt"
              @still-have="handleStillHave"
            />
          </TransitionGroup>
        </div>
      </template>
    </UDrawer>

    <!-- Mobile Suggestions Drawer (Bottom, Modal, Close button, No handle) -->
    <UDrawer
      v-else
      v-model:open="isMobileSuggestionsOpen"
      direction="bottom"
      :handle="false"
      :modal="true"
      :dismissible="false"
      :close="true"
      title="Do you need?"
      :ui="{
        content: [
          'flex flex-col bg-default transition-[height,max-height] duration-300 ease-out',
          isMobileFullScreen ? 'h-full max-h-screen' : 'h-[70vh] max-h-[70vh]'
        ],
        container: 'flex flex-col h-full overflow-hidden p-0',
        header: 'px-4 py-3 border-b border-default shrink-0 flex items-center justify-between bg-default',
        title: 'text-lg font-bold text-highlighted',
        body: 'flex-1 overflow-y-auto p-0'
      }"
      @update:open="(val) => { if (!val) isMobileFullScreen = false; }"
    >
      <template #title>
        <span class="text-lg font-bold text-highlighted">Do you need?</span>
      </template>

      <template #body>
        <div class="h-full overflow-y-auto divide-y divide-default pb-8" @scroll="handleMobileListScroll">
          <div v-if="displayedSuggestions.length === 0" class="py-12 px-4 text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <UIcon name="i-lucide-check" class="w-6 h-6 stroke-[2.5]" />
            </div>
            <h4 class="font-bold text-highlighted text-base">All caught up!</h4>
            <p class="text-sm text-muted max-w-xs mx-auto">
              No items are currently due for replenishment.
            </p>
          </div>

          <TransitionGroup
            v-else
            name="suggestion-anim"
            tag="div"
            class="relative"
          >
            <SuggestionListItem
              v-for="sug in displayedSuggestions"
              :key="sug.item.id"
              :suggestion="sug"
              @need="handleNeedIt"
              @still-have="handleStillHave"
            />
          </TransitionGroup>
        </div>
      </template>
    </UDrawer>

    <!-- Anomaly Modal (Desktop Modal / Mobile Nested Drawer) -->
    <AnomalyModal
      v-model:open="isAnomalyOpen"
      :item="anomalyItem"
      :anomaly-type="anomalyType"
      :expected-days="anomalyExpectedDays"
      :lasted-days="anomalyLastedDays"
      @select="handleAnomalySelect"
    />
  </div>
</template>

<style scoped>
.suggestion-anim-move {
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1);
}

.suggestion-anim-leave-active {
  position: absolute;
  width: 100%;
  pointer-events: none;
  transition: opacity 0.2s ease-out, transform 0.2s ease-out;
}

.suggestion-anim-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.suggestion-anim-enter-active {
  transition: none;
}

.suggestion-anim-enter-from {
  opacity: 1;
}
</style>
