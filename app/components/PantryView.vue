<script setup lang="ts">
import { usePantryStore } from "~~/app/stores/pantry";
import type { PantryItem } from "~~/shared/types";
import { formatRelativeDate } from "~~/app/utils/format";

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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-default p-4 rounded-2xl border border-default shadow-xs">
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
              size="md"
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
        size="md"
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
          size="md"
          color="neutral"
          :variant="store.stockFilter === 'all' ? 'solid' : 'subtle'"
          @click="store.stockFilter = 'all'"
        >
          All Items ({{ store.totalCount }})
        </UButton>
        <UButton
          size="md"
          :color="store.stockFilter === 'in-stock' ? 'primary' : 'neutral'"
          :variant="store.stockFilter === 'in-stock' ? 'solid' : 'subtle'"
          @click="store.stockFilter = 'in-stock'"
        >
          In Stock ({{ store.inStockCount }})
        </UButton>
        <UButton
          size="md"
          :color="store.stockFilter === 'out-of-stock' ? 'error' : 'neutral'"
          :variant="store.stockFilter === 'out-of-stock' ? 'solid' : 'subtle'"
          @click="store.stockFilter = 'out-of-stock'"
        >
          Out of Stock ({{ store.outOfStockCount }})
        </UButton>
        <UButton
          size="md"
          :color="store.stockFilter === 'due' ? 'warning' : 'neutral'"
          :variant="store.stockFilter === 'due' ? 'solid' : 'subtle'"
          icon="i-lucide-sparkles"
          @click="store.stockFilter = 'due'"
        >
          Due for Restock ({{ store.dueCount }})
        </UButton>
      </div>

      <!-- Category Pills -->
      <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
        <UButton
          size="md"
          color="neutral"
          :variant="store.selectedCategory === 'All' ? 'subtle' : 'ghost'"
          @click="store.selectedCategory = 'All'"
        >
          All Categories
        </UButton>
        <UButton
          v-for="cat in store.categories"
          :key="cat"
          size="md"
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
      class="bg-default rounded-2xl border border-default p-8 text-center space-y-3"
    >
      <div class="w-12 h-12 rounded-full bg-muted text-muted mx-auto flex items-center justify-center">
        <UIcon name="i-lucide-search" class="w-6 h-6" />
      </div>
      <div>
        <h3 class="font-bold text-highlighted">No items match your filter</h3>
        <p class="text-muted mt-1">
          {{ store.searchQuery ? `No items matching "${store.searchQuery}"` : 'Try changing your category or stock filter.' }}
        </p>
      </div>
      <UButton
        color="primary"
        variant="subtle"
        size="md"
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
        class="rounded-2xl border p-4 shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
        :class="[
          !item.inStock
            ? 'border-error/30 bg-error/5'
            : getItemCadenceInfo(item).isOverdue
            ? 'border-warning/30 bg-warning/5'
            : 'border-default bg-default'
        ]"
      >
        <div>
          <!-- Top row: Category badge & Actions -->
          <div class="flex items-center justify-between mb-2">
            <UBadge
              color="neutral"
              variant="subtle"
              size="md"
            >
              {{ item.category }}
            </UBadge>

            <div class="flex items-center space-x-1">
              <UButton
                color="neutral"
                variant="ghost"
                size="md"
                icon="i-lucide-edit-2"
                title="Edit Item"
                aria-label="Edit Item"
                @click="store.openEditItemModal(item)"
              />
              <UButton
                color="neutral"
                variant="ghost"
                size="md"
                icon="i-lucide-trash-2"
                title="Delete from Pantry"
                aria-label="Delete from Pantry"
                @click="store.deletePantryItem(item)"
              />
            </div>
          </div>

          <!-- Title & Quantity -->
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-bold text-highlighted leading-snug">{{ item.name }}</h4>
              <p v-if="item.notes" class="text-muted mt-0.5">{{ item.notes }}</p>
            </div>
            <UBadge
              color="neutral"
              variant="subtle"
              size="md"
            >
              {{ item.quantity }} {{ item.unit }}
            </UBadge>
          </div>

          <!-- Cadence Info -->
          <div class="mt-3 flex flex-wrap items-center gap-1.5">
            <UBadge
              color="neutral"
              variant="subtle"
              size="md"
              icon="i-lucide-clock"
            >
              {{ item.frequencyLabel }}
            </UBadge>

            <!-- Due Badge -->
            <UBadge
              v-if="!item.inStock"
              color="error"
              variant="subtle"
              size="md"
              icon="i-lucide-alert-triangle"
            >
              Out of Stock
            </UBadge>
            <UBadge
              v-else-if="getItemCadenceInfo(item).isOverdue"
              color="warning"
              variant="subtle"
              size="md"
              icon="i-lucide-alert-triangle"
            >
              Overdue by {{ Math.abs(getItemCadenceInfo(item).daysDiff) }}d
            </UBadge>
            <UBadge
              v-else-if="getItemCadenceInfo(item).daysDiff === 0"
              color="warning"
              variant="subtle"
              size="md"
              icon="i-lucide-sparkles"
            >
              Due Today
            </UBadge>
            <UBadge
              v-else-if="getItemCadenceInfo(item).isDueSoon"
              color="warning"
              variant="subtle"
              size="md"
            >
              Due Tomorrow
            </UBadge>
            <UBadge
              v-else
              color="neutral"
              variant="subtle"
              size="md"
            >
              Due in {{ getItemCadenceInfo(item).daysDiff }}d
            </UBadge>
          </div>

          <div class="mt-2 text-muted flex items-center justify-between">
            <span>Last bought: {{ formatRelativeDate(item.lastPurchasedAt) }}</span>
            <span v-if="item.nextDueDate">Next due: {{ formatRelativeDate(item.nextDueDate) }}</span>
          </div>
        </div>

        <!-- Bottom Row Actions -->
        <div class="mt-4 pt-3 border-t border-default flex items-center justify-between">
          <!-- Stock Toggle Button -->
          <UButton
            :color="item.inStock ? 'success' : 'error'"
            variant="subtle"
            size="md"
            :icon="item.inStock ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'"
            @click="store.toggleStock(item.id)"
          >
            {{ item.inStock ? 'In Stock' : 'Out of Stock' }}
          </UButton>

          <!-- Add to Shopping List button -->
          <UButton
            v-if="item.inShoppingList"
            color="primary"
            variant="subtle"
            size="md"
            icon="i-lucide-shopping-cart"
            title="Remove from Shopping List"
            @click="store.deleteFromShoppingList(item)"
          >
            On Shopping List
          </UButton>
          <UButton
            v-else
            color="neutral"
            variant="subtle"
            size="md"
            icon="i-lucide-plus"
            @click="store.addToShoppingList({ nameOrId: item.id, quantity: 1 })"
          >
            Add to Shop List
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
