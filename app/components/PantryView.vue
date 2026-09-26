<script setup lang="ts">
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";
import { formatRelativeDate, getCategoryColor } from "~~/app/utils/format";

const store = usePantryStore();

const now = new Date();

function getItemCadenceInfo(item: PantryItem) {
  let isOverdue = false;
  let isDueSoon = false;
  let daysDiff = 0;

  if (item.nextDueDate) {
    const diffMs = new Date(item.nextDueDate).getTime() - now.getTime();
    daysDiff = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    isOverdue = daysDiff < 0;
    isDueSoon = daysDiff <= 1;
  }

  return { isOverdue, isDueSoon, daysDiff };
}
</script>

<template>
  <div class="space-y-4 pb-20 sm:pb-8">
    <!-- Top Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
      <!-- Search -->
      <div class="flex-1">
        <UInput
          v-model="store.searchQuery"
          icon="i-lucide-search"
          placeholder="Search pantry by name, category..."
          class="w-full"
          size="md"
        >
          <template v-if="store.searchQuery" #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="xs"
              icon="i-lucide-x"
              aria-label="Clear search"
              @click="store.searchQuery = ''"
            />
          </template>
        </UInput>
      </div>

      <!-- Add Item Button -->
      <UButton
        color="primary"
        icon="i-lucide-plus"
        @click="store.openAddItemModal()"
      >
        <span>Add Pantry Item</span>
      </UButton>
    </div>

    <!-- Filter Tabs and Categories -->
    <div class="space-y-2">
      <!-- Stock Filter Pills -->
      <div class="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <UButton
          size="xs"
          class="rounded-xl font-semibold whitespace-nowrap"
          color="neutral"
          :variant="store.stockFilter === 'all' ? 'solid' : 'outline'"
          @click="store.stockFilter = 'all'"
        >
          All Items ({{ store.totalCount }})
        </UButton>
        <UButton
          size="xs"
          class="rounded-xl font-semibold whitespace-nowrap"
          :color="store.stockFilter === 'in-stock' ? 'primary' : 'neutral'"
          :variant="store.stockFilter === 'in-stock' ? 'solid' : 'outline'"
          @click="store.stockFilter = 'in-stock'"
        >
          In Stock ({{ store.inStockCount }})
        </UButton>
        <UButton
          size="xs"
          class="rounded-xl font-semibold whitespace-nowrap"
          :color="store.stockFilter === 'out-of-stock' ? 'error' : 'neutral'"
          :variant="store.stockFilter === 'out-of-stock' ? 'solid' : 'outline'"
          @click="store.stockFilter = 'out-of-stock'"
        >
          Out of Stock ({{ store.outOfStockCount }})
        </UButton>
        <UButton
          size="xs"
          class="rounded-xl font-semibold whitespace-nowrap"
          :color="store.stockFilter === 'due' ? 'warning' : 'neutral'"
          :variant="store.stockFilter === 'due' ? 'solid' : 'outline'"
          icon="i-lucide-sparkles"
          @click="store.stockFilter = 'due'"
        >
          Due for Restock ({{ store.dueCount }})
        </UButton>
      </div>

      <!-- Category Pills -->
      <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <UButton
          size="xs"
          class="rounded-lg font-medium"
          color="neutral"
          :variant="store.selectedCategory === 'All' ? 'subtle' : 'ghost'"
          @click="store.selectedCategory = 'All'"
        >
          All Categories
        </UButton>
        <UButton
          v-for="cat in store.categories"
          :key="cat"
          size="xs"
          class="rounded-lg font-medium whitespace-nowrap"
          color="neutral"
          :variant="store.selectedCategory === cat ? 'subtle' : 'ghost'"
          @click="store.selectedCategory = cat"
        >
          {{ cat }}
        </UButton>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="store.filteredItems.length === 0"
      class="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3"
    >
      <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
        <UIcon name="i-lucide-search" class="w-6 h-6" />
      </div>
      <div>
        <h3 class="text-base font-bold text-slate-800">No items match your filter</h3>
        <p class="text-xs text-slate-500 mt-1">
          {{ store.searchQuery ? `No items matching "${store.searchQuery}"` : 'Try changing your category or stock filter.' }}
        </p>
      </div>
      <UButton
        color="primary"
        variant="subtle"
        size="xs"
        @click="() => { store.searchQuery = ''; store.selectedCategory = 'All'; store.stockFilter = 'all'; }"
      >
        Reset Filters
      </UButton>
    </div>

    <!-- Items Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="item in store.filteredItems"
        :key="item.id"
        class="bg-white rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
        :class="[
          !item.inStock
            ? 'border-rose-200 bg-rose-50/10'
            : getItemCadenceInfo(item).isOverdue
            ? 'border-amber-200 bg-amber-50/10'
            : 'border-slate-200'
        ]"
      >
        <div>
          <!-- Top row: Category badge & Actions -->
          <div class="flex items-center justify-between mb-2">
            <UBadge
              color="neutral"
              variant="outline"
              size="xs"
              class="rounded-md font-semibold"
              :class="[
                getCategoryColor(item.category).bg,
                getCategoryColor(item.category).text,
                getCategoryColor(item.category).border
              ]"
            >
              {{ item.category }}
            </UBadge>

            <div class="flex items-center space-x-1">
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-edit-2"
                title="Edit Item"
                aria-label="Edit Item"
                @click="store.openEditItemModal(item)"
              />
              <UButton
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-lucide-trash-2"
                title="Delete from Pantry"
                aria-label="Delete from Pantry"
                class="hover:text-rose-600 hover:bg-rose-50"
                @click="store.deletePantryItem(item)"
              />
            </div>
          </div>

          <!-- Title & Quantity -->
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-bold text-slate-900 text-base leading-snug">{{ item.name }}</h4>
              <p v-if="item.notes" class="text-xs text-slate-400 mt-0.5">{{ item.notes }}</p>
            </div>
            <UBadge
              color="neutral"
              variant="subtle"
              size="sm"
              class="font-semibold text-slate-600 shrink-0 ml-2"
            >
              {{ item.quantity }} {{ item.unit }}
            </UBadge>
          </div>

          <!-- Cadence Info -->
          <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <UBadge
              color="neutral"
              variant="subtle"
              size="xs"
              icon="i-lucide-clock"
              class="font-medium"
            >
              {{ item.frequencyLabel }}
            </UBadge>

            <!-- Due Badge -->
            <UBadge
              v-if="!item.inStock"
              color="error"
              variant="subtle"
              size="xs"
              icon="i-lucide-alert-triangle"
              class="font-bold"
            >
              Out of Stock
            </UBadge>
            <UBadge
              v-else-if="getItemCadenceInfo(item).isOverdue"
              color="warning"
              variant="subtle"
              size="xs"
              icon="i-lucide-alert-triangle"
              class="font-bold"
            >
              Overdue by {{ Math.abs(getItemCadenceInfo(item).daysDiff) }}d
            </UBadge>
            <UBadge
              v-else-if="getItemCadenceInfo(item).daysDiff === 0"
              color="warning"
              variant="subtle"
              size="xs"
              icon="i-lucide-sparkles"
              class="font-bold"
            >
              Due Today
            </UBadge>
            <UBadge
              v-else-if="getItemCadenceInfo(item).isDueSoon"
              color="warning"
              variant="subtle"
              size="xs"
              class="font-semibold"
            >
              Due Tomorrow
            </UBadge>
            <UBadge
              v-else
              color="neutral"
              variant="subtle"
              size="xs"
              class="text-slate-500 font-normal"
            >
              Due in {{ getItemCadenceInfo(item).daysDiff }}d
            </UBadge>
          </div>

          <div class="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Last bought: {{ formatRelativeDate(item.lastPurchasedAt) }}</span>
            <span v-if="item.nextDueDate">Next due: {{ formatRelativeDate(item.nextDueDate) }}</span>
          </div>
        </div>

        <!-- Bottom Row Actions -->
        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <!-- Stock Toggle Button -->
          <UButton
            :color="item.inStock ? 'success' : 'error'"
            variant="subtle"
            size="xs"
            class="rounded-xl font-semibold"
            :icon="item.inStock ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'"
            @click="store.toggleStock(item.id)"
          >
            {{ item.inStock ? 'In Stock' : 'Out of Stock' }}
          </UButton>

          <!-- Add to Shopping List button -->
          <UBadge
            v-if="item.inShoppingList"
            color="success"
            variant="subtle"
            size="sm"
            icon="i-lucide-shopping-cart"
            class="font-semibold rounded-xl"
          >
            On Shopping List
          </UBadge>
          <UButton
            v-else
            color="neutral"
            variant="subtle"
            size="xs"
            icon="i-lucide-plus"
            class="rounded-xl font-semibold shadow-2xs hover:bg-emerald-600 hover:text-white"
            @click="store.addToShoppingList({ nameOrId: item.id, quantity: 1 })"
          >
            Add to Shop List
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
