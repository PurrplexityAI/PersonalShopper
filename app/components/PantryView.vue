<script setup lang="ts">
import { usePantryStore } from '~~/app/stores/pantry';
import type { StockFilter } from '~~/shared/types';
import { formatRelativeDate, getCategoryColor } from '~~/app/utils/format';

const store = usePantryStore();

const now = new Date();

function getItemCadenceInfo(item: any) {
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
      <div class="relative flex-1">
        <UIcon name="i-lucide-search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          v-model="store.searchQuery"
          type="text"
          placeholder="Search pantry by name, category..."
          class="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all bg-slate-50/50 focus:bg-white"
        />
        <button
          v-if="store.searchQuery"
          type="button"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
          @click="store.searchQuery = ''"
        >
          Clear
        </button>
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
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
          :class="[
            store.stockFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          ]"
          @click="store.stockFilter = 'all'"
        >
          All Items ({{ store.totalCount }})
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
          :class="[
            store.stockFilter === 'in-stock'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          ]"
          @click="store.stockFilter = 'in-stock'"
        >
          In Stock ({{ store.inStockCount }})
        </button>
        <button
          type="button"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
          :class="[
            store.stockFilter === 'out-of-stock'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          ]"
          @click="store.stockFilter = 'out-of-stock'"
        >
          Out of Stock ({{ store.outOfStockCount }})
        </button>
        <button
          type="button"
          class="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
          :class="[
            store.stockFilter === 'due'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          ]"
          @click="store.stockFilter = 'due'"
        >
          <UIcon name="i-lucide-sparkles" class="w-3 h-3" />
          <span>Due for Restock ({{ store.dueCount }})</span>
        </button>
      </div>

      <!-- Category Pills -->
      <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg font-medium transition-colors"
          :class="[
            store.selectedCategory === 'All'
              ? 'bg-slate-200 text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          ]"
          @click="store.selectedCategory = 'All'"
        >
          All Categories
        </button>
        <button
          v-for="cat in store.categories"
          :key="cat"
          type="button"
          class="px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors"
          :class="[
            store.selectedCategory === cat
              ? 'bg-slate-200 text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          ]"
          @click="store.selectedCategory = cat"
        >
          {{ cat }}
        </button>
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
      <button
        type="button"
        class="px-4 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
        @click="() => { store.searchQuery = ''; store.selectedCategory = 'All'; store.stockFilter = 'all'; }"
      >
        Reset Filters
      </button>
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
            <span
              class="px-2 py-0.5 text-[11px] font-semibold rounded-md border"
              :class="[
                getCategoryColor(item.category).bg,
                getCategoryColor(item.category).text,
                getCategoryColor(item.category).border
              ]"
            >
              {{ item.category }}
            </span>

            <div class="flex items-center space-x-1">
              <button
                type="button"
                title="Edit Item"
                class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                @click="store.openEditItemModal(item)"
              >
                <UIcon name="i-lucide-edit-2" class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Delete from Pantry"
                class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                @click="store.deletePantryItem(item)"
              >
                <UIcon name="i-lucide-trash-2" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Title & Quantity -->
          <div class="flex items-start justify-between">
            <div>
              <h4 class="font-bold text-slate-900 text-base leading-snug">{{ item.name }}</h4>
              <p v-if="item.notes" class="text-xs text-slate-400 mt-0.5">{{ item.notes }}</p>
            </div>
            <span class="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg shrink-0 ml-2">
              {{ item.quantity }} {{ item.unit }}
            </span>
          </div>

          <!-- Cadence Info -->
          <div class="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span class="inline-flex items-center space-x-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
              <UIcon name="i-lucide-clock" class="w-3 h-3 text-slate-500" />
              <span>{{ item.frequencyLabel }}</span>
            </span>

            <!-- Due Badge -->
            <span
              v-if="!item.inStock"
              class="inline-flex items-center space-x-1 bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-bold"
            >
              <UIcon name="i-lucide-alert-triangle" class="w-3 h-3 text-rose-600" />
              <span>Out of Stock</span>
            </span>
            <span
              v-else-if="getItemCadenceInfo(item).isOverdue"
              class="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold"
            >
              <UIcon name="i-lucide-alert-triangle" class="w-3 h-3 text-amber-600" />
              <span>Overdue by {{ Math.abs(getItemCadenceInfo(item).daysDiff) }}d</span>
            </span>
            <span
              v-else-if="getItemCadenceInfo(item).daysDiff === 0"
              class="inline-flex items-center space-x-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold"
            >
              <UIcon name="i-lucide-sparkles" class="w-3 h-3 text-amber-600" />
              <span>Due Today</span>
            </span>
            <span
              v-else-if="getItemCadenceInfo(item).isDueSoon"
              class="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-semibold"
            >
              <span>Due Tomorrow</span>
            </span>
            <span
              v-else
              class="inline-flex items-center space-x-1 bg-slate-50 text-slate-500 px-2 py-0.5 rounded-md"
            >
              <span>Due in {{ getItemCadenceInfo(item).daysDiff }}d</span>
            </span>
          </div>

          <div class="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Last bought: {{ formatRelativeDate(item.lastPurchasedAt) }}</span>
            <span v-if="item.nextDueDate">Next due: {{ formatRelativeDate(item.nextDueDate) }}</span>
          </div>
        </div>

        <!-- Bottom Row Actions -->
        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <!-- Stock Toggle Button -->
          <button
            type="button"
            class="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              item.inStock
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            ]"
            @click="store.toggleStock(item.id)"
          >
            <UIcon
              :name="item.inStock ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'"
              class="w-3.5 h-3.5"
              :class="item.inStock ? 'text-emerald-600' : 'text-rose-600'"
            />
            <span>{{ item.inStock ? 'In Stock' : 'Out of Stock' }}</span>
          </button>

          <!-- Add to Shopping List button -->
          <span
            v-if="item.inShoppingList"
            class="flex items-center space-x-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
          >
            <UIcon name="i-lucide-shopping-cart" class="w-3.5 h-3.5" />
            <span>On Shopping List</span>
          </span>
          <button
            v-else
            type="button"
            class="flex items-center space-x-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-600 hover:text-white px-3 py-1.5 rounded-xl transition-all shadow-2xs"
            @click="store.addToShoppingList({ nameOrId: item.id, quantity: 1 })"
          >
            <UIcon name="i-lucide-plus" class="w-3.5 h-3.5" />
            <span>Add to Shop List</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
