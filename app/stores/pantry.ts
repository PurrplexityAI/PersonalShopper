import { defineStore } from 'pinia';
import type {
  PantryItem,
  ShoppingSuggestion,
  ActiveTab,
  StockFilter,
  CreatePantryItemDto,
  AddToShoppingListDto,
} from '~~/shared/types';
import { generateSuggestions, evaluateItemCadence } from '~~/app/utils/cadence';
import { soundEffects } from '~~/app/utils/audio';
import { fireShoppingConfetti } from '~~/app/utils/confetti';

const STORAGE_KEY = 'personal_shopper_pantry_v1';

export const usePantryStore = defineStore('pantry', {
  state: () => ({
    items: [] as PantryItem[],
    categories: [] as string[],
    activeTab: 'shopping' as ActiveTab,
    searchQuery: '',
    selectedCategory: 'All',
    stockFilter: 'all' as StockFilter,
    isLoading: true,
    isRefreshing: false,
    sessionPurchased: [] as Array<{ id: string; name: string; timestamp: string }>,
    isItemModalOpen: false,
    editingItem: null as PantryItem | null,
    isDataModalOpen: false,
  }),

  getters: {
    shoppingList(state): PantryItem[] {
      return state.items.filter((item) => item.inShoppingList);
    },

    suggestions(state): ShoppingSuggestion[] {
      return generateSuggestions(state.items);
    },

    totalCount(state): number {
      return state.items.length;
    },

    inStockCount(state): number {
      return state.items.filter((i) => i.inStock).length;
    },

    outOfStockCount(state): number {
      return state.items.filter((i) => !i.inStock).length;
    },

    dueCount(state): number {
      const now = new Date();
      return state.items.filter((i) => {
        if (!i.inStock) return true;
        if (!i.nextDueDate) return false;
        const due = new Date(i.nextDueDate);
        const diff = (due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000);
        return diff <= 1;
      }).length;
    },

    filteredItems(state): PantryItem[] {
      const now = new Date();
      return state.items.filter((item) => {
        if (state.searchQuery.trim()) {
          const q = state.searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchCategory = item.category.toLowerCase().includes(q);
          const matchNotes = item.notes?.toLowerCase().includes(q);
          if (!matchName && !matchCategory && !matchNotes) return false;
        }

        if (state.selectedCategory !== 'All' && item.category !== state.selectedCategory) {
          return false;
        }

        if (state.stockFilter === 'in-stock') return item.inStock;
        if (state.stockFilter === 'out-of-stock') return !item.inStock;
        if (state.stockFilter === 'due') {
          return evaluateItemCadence(item, now).isDue;
        }

        return true;
      });
    },
  },

  actions: {
    notify(title: string, description?: string, color: 'success' | 'error' | 'info' = 'success') {
      try {
        const toast = useToast();
        toast.add({
          title,
          description,
          color: color === 'error' ? 'error' : color === 'info' ? 'neutral' : 'success',
        });
      } catch {
        // Fallback if toast context is not initialized (e.g. testing)
      }
    },

    async loadData(isSilent = false) {
      if (!isSilent) this.isRefreshing = true;
      try {
        const [pantryRes, catRes] = await Promise.all([
          $fetch<{ success: boolean; data: PantryItem[] }>('/api/pantry'),
          $fetch<{ success: boolean; data: string[] }>('/api/pantry/categories'),
        ]);

        if (pantryRes && pantryRes.data) {
          this.items = pantryRes.data;
          // Sync to localStorage for offline / Capacitor readiness
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
            } catch {
              // ignore storage errors
            }
          }
        }
        if (catRes && catRes.data) {
          this.categories = catRes.data;
        }
      } catch (err: any) {
        // Fallback to localStorage if offline or in Capacitor without backend
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            try {
              this.items = JSON.parse(cached);
              const defaultCategories = [
                'Dairy & Eggs',
                'Produce',
                'Bakery',
                'Meat & Seafood',
                'Pantry Staples',
                'Beverages',
                'Snacks',
                'Condiments & Spices',
                'Frozen',
                'Household',
                'Personal Care',
                'General',
              ];
              const itemCats = this.items.map((i) => i.category);
              this.categories = Array.from(new Set([...defaultCategories, ...itemCats])).filter(Boolean).sort();
              return;
            } catch {
              // ignore
            }
          }
        }
        this.notify('Error connecting to pantry server', err.message, 'error');
      } finally {
        this.isLoading = false;
        this.isRefreshing = false;
      }
    },

    openAddItemModal() {
      this.editingItem = null;
      this.isItemModalOpen = true;
    },

    openEditItemModal(item: PantryItem) {
      this.editingItem = item;
      this.isItemModalOpen = true;
    },

    closeItemModal() {
      this.isItemModalOpen = false;
      this.editingItem = null;
    },

    openDataModal() {
      this.isDataModalOpen = true;
    },

    closeDataModal() {
      this.isDataModalOpen = false;
    },

    clearSessionPurchased() {
      this.sessionPurchased = [];
    },

    async toggleStock(id: string) {
      try {
        const res = await $fetch<{ success: boolean; data: PantryItem }>(`/api/pantry/${id}/toggle-stock`, {
          method: 'POST',
        });
        const updated = res.data;
        this.notify(
          `"${updated.name}" is now ${updated.inStock ? 'In Stock' : 'Out of Stock'}`,
          undefined,
          updated.inStock ? 'success' : 'info'
        );
        await this.loadData(true);
      } catch (err: any) {
        this.notify('Failed to toggle stock', err.message, 'error');
      }
    },

    async savePantryItem(data: CreatePantryItemDto) {
      try {
        if (this.editingItem) {
          await $fetch(`/api/pantry/${this.editingItem.id}`, {
            method: 'PUT',
            body: data,
          });
          this.notify(`Updated "${data.name || this.editingItem.name}"`, undefined, 'success');
        } else {
          await $fetch('/api/pantry', {
            method: 'POST',
            body: data,
          });
          this.notify(`Added "${data.name}" to pantry inventory`, undefined, 'success');
        }
        this.closeItemModal();
        await this.loadData(true);
      } catch (err: any) {
        this.notify('Failed to save item', err.message, 'error');
        throw err;
      }
    },

    async deletePantryItem(item: PantryItem) {
      if (!window.confirm(`Are you sure you want to permanently delete "${item.name}" from your pantry inventory?`)) {
        return;
      }
      try {
        await $fetch(`/api/pantry/${item.id}`, {
          method: 'DELETE',
        });
        this.notify(`Deleted "${item.name}" from pantry`, undefined, 'info');
        await this.loadData(true);
      } catch (err: any) {
        this.notify('Failed to delete item', err.message, 'error');
      }
    },

    async addToShoppingList(payload: {
      nameOrId: string;
      quantity?: number;
      category?: string;
      frequencyDays?: number;
      unit?: string;
    }) {
      try {
        const res = await $fetch<{ success: boolean; data: PantryItem; message: string; createdInPantry: boolean }>(
          '/api/shopping-list/add',
          {
            method: 'POST',
            body: payload,
          }
        );
        this.notify(res.message, undefined, 'success');
        await this.loadData(true);
      } catch (err: any) {
        this.notify('Failed to add item', err.message, 'error');
      }
    },

    async checkOffShoppingItem(item: PantryItem) {
      try {
        soundEffects.playCheckSuccess();
        fireShoppingConfetti();

        this.sessionPurchased.unshift({
          id: item.id,
          name: item.name,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        await $fetch(`/api/shopping-list/${item.id}/check`, {
          method: 'POST',
        });
        this.notify(`Bought "${item.name}"! In stock & cadence timer reset.`, undefined, 'success');
        await this.loadData(true);
      } catch (err: any) {
        this.notify('Failed to tick off item', err.message, 'error');
      }
    },

    async deleteFromShoppingList(item: PantryItem) {
      try {
        await $fetch(`/api/shopping-list/${item.id}`, {
          method: 'DELETE',
        });
        this.notify(`Removed "${item.name}" from shopping list (didn't buy).`, undefined, 'info');
        await this.loadData(true);
      } catch (err: any) {
        this.notify('Failed to remove item', err.message, 'error');
      }
    },

    async updateShoppingQuantity(id: string, quantity: number) {
      try {
        // Optimistic UI update
        const item = this.items.find((i) => i.id === id);
        if (item) item.shoppingListQuantity = quantity;

        await $fetch(`/api/shopping-list/${id}/quantity`, {
          method: 'PUT',
          body: { quantity },
        });
        await this.loadData(true);
      } catch (err: any) {
        this.notify('Failed to update quantity', err.message, 'error');
      }
    },

    async addBulkToShoppingList(itemIds: string[]) {
      try {
        const res = await $fetch<{ success: boolean; data: PantryItem[]; message: string }>(
          '/api/shopping-list/add-bulk',
          {
            method: 'POST',
            body: { itemIds },
          }
        );
        this.notify(res.message || `Added ${itemIds.length} items to shopping list`, undefined, 'success');
        await this.loadData(true);
      } catch (err: any) {
        this.notify('Failed to add items', err.message, 'error');
      }
    },

    async exportData() {
      try {
        const data = await $fetch<{ items: PantryItem[]; exportedAt: string }>('/api/data/export');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `personal-shopper-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.notify('Pantry inventory exported successfully!');
      } catch (err: any) {
        this.notify('Export failed', err.message, 'error');
        throw err;
      }
    },

    async importData(incomingItems: PantryItem[]) {
      try {
        const res = await $fetch<{ success: boolean; message: string }>('/api/data/import', {
          method: 'POST',
          body: { items: incomingItems },
        });
        this.notify(res.message, undefined, 'success');
        await this.loadData(true);
        return res.message;
      } catch (err: any) {
        this.notify('Import failed', err.message, 'error');
        throw err;
      }
    },

    async resetSampleData() {
      if (!window.confirm('Reset pantry to sample grocery items? Your current entries will be replaced.')) {
        return;
      }
      try {
        const res = await $fetch<{ success: boolean; message: string }>('/api/data/reset-sample', {
          method: 'POST',
        });
        this.notify(res.message, undefined, 'success');
        await this.loadData(true);
      } catch (err: any) {
        this.notify('Failed to reset data', err.message, 'error');
        throw err;
      }
    },
  },
});
