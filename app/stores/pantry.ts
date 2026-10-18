import { defineStore } from "pinia";
import type {
  PantryItem,
  ShoppingSuggestion,
  ActiveTab,
  StockFilter,
  CreatePantryItemDto,
  UpdatePantryItemDto,
} from "~~/shared/types";
import { generateSuggestions, evaluateItemCadence } from "~~/app/utils/cadence";
import { calculateBurnRatio } from "~~/app/utils/frequency";
import { soundEffects } from "~~/app/utils/audio";
import { fireShoppingConfetti } from "~~/app/utils/confetti";

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export const usePantryStore = defineStore("pantry", {
  state: () => ({
    items: [] as PantryItem[],
    categories: [] as string[],
    activeTab: "shopping" as ActiveTab,
    searchQuery: "",
    selectedCategory: null as string | null,
    stockFilter: "all" as StockFilter,
    isLoading: true,
    isRefreshing: false,
    loadError: null as string | null,
    sessionPurchased: [] as Array<{ id: string; name: string; timestamp: string; previousLastPurchasedAt?: string | null }>,
    isItemModalOpen: false,
    editingItem: null as PantryItem | null,
    hasCheckedSuggestionsSession: false,
    isAnomalyOpen: false,
    anomalyItem: null as PantryItem | null,
    anomalyType: null as "high" | "low" | null,
    anomalyInitialAction: "need" as "need" | "still_have",
    anomalyExpectedDays: 7,
    anomalyLastedDays: 7,
    anomalyAdjustedDays: 7,
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

        if (state.selectedCategory !== null && state.selectedCategory !== "All" && item.category !== state.selectedCategory) {
          return false;
        }

        if (state.stockFilter === "in-stock") return item.inStock;
        if (state.stockFilter === "out-of-stock") return !item.inStock;
        if (state.stockFilter === "due") {
          return evaluateItemCadence(item, now).isDue;
        }

        return true;
      });
    },
  },

  actions: {
    notify(title: string, description?: string, color: "success" | "error" | "info" = "success") {
      // Only error toasts are enabled per specification
      if (color !== "error") return;
      try {
        console.error(`[App Error] ${title}:`, description || "");
        const nuxtApp = useNuxtApp();
        if (nuxtApp?.runWithContext) {
          nuxtApp.runWithContext(() => {
            const toast = useToast();
            toast?.add?.({
              title,
              description,
              color: "error",
              icon: "i-lucide-alert-circle",
            });
          });
          return;
        }
        const toast = useToast();
        toast?.add?.({
          title,
          description,
          color: "error",
          icon: "i-lucide-alert-circle",
        });
      } catch {
        // In SSR / headless test environments where useToast may not be available
      }
    },

    async loadData(isSilent = false) {
      if (!isSilent) this.isRefreshing = true;

      // Purge any legacy localStorage cache if present
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("personal_shopper_pantry_v1");
        } catch {
          // ignore
        }
      }

      try {
        const [pantryRes, catRes] = await Promise.all([
          $fetch<{ success: boolean; data: PantryItem[] }>("/api/pantry"),
          $fetch<{ success: boolean; data: string[] }>("/api/pantry/categories"),
        ]);

        if (pantryRes && pantryRes.data) {
          this.items = pantryRes.data;
          this.loadError = null;
        }
        if (catRes && catRes.data) {
          this.categories = catRes.data;
        }
      } catch (err) {
        const errMsg = getErrorMessage(err);
        this.loadError = errMsg;
        this.notify("Error connecting to pantry server", errMsg, "error");
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

    clearSessionPurchased() {
      this.sessionPurchased = [];
    },

    async toggleStock(id: string) {
      try {
        const res = await $fetch<{ success: boolean; data: PantryItem }>(`/api/pantry/${id}/toggle-stock`, {
          method: "POST",
        });
        const updated = res.data;
        this.notify(
          `"${updated.name}" is now ${updated.inStock ? "In Stock" : "Out of Stock"}`,
          undefined,
          updated.inStock ? "success" : "info"
        );
        await this.loadData(true);
      } catch (err) {
        this.notify("Failed to toggle stock", getErrorMessage(err), "error");
      }
    },

    async setStock(id: string, inStock: boolean) {
      const item = this.items.find((i) => i.id === id);
      if (item && item.inStock === inStock) {
        return;
      }
      await this.toggleStock(id);
    },

    async savePantryItem(data: CreatePantryItemDto) {
      try {
        if (this.editingItem) {
          await $fetch("/api/pantry/" + this.editingItem.id, {
            method: "PUT",
            body: data,
          },);
          this.notify(`Updated "${data.name || this.editingItem.name}"`, undefined, "success");
        } else {
          await $fetch("/api/pantry", {
            method: "POST",
            body: data,
          });
          this.notify(`Added "${data.name}" to pantry inventory`, undefined, "success");
        }
        this.closeItemModal();
        await this.loadData(true);
      } catch (err) {
        this.notify("Failed to save item", getErrorMessage(err), "error");
        throw err;
      }
    },

    async deletePantryItem(item: PantryItem) {
      if (!window.confirm(`Are you sure you want to permanently delete "${item.name}" from your pantry inventory?`)) {
        return;
      }
      try {
        await $fetch("/api/pantry/" + item.id, {
          method: "DELETE",
        });
        this.notify(`Deleted "${item.name}" from pantry`, undefined, "info");
        await this.loadData(true);
      } catch (err) {
        this.notify("Failed to delete item", getErrorMessage(err), "error");
      }
    },

    async addToShoppingList(payload: {
      nameOrId: string;
      quantity?: number;
      category?: string;
      frequencyDays?: number;
      unit?: string;
    }): Promise<PantryItem | null> {
      try {
        const res = await $fetch<{ success: boolean; data: PantryItem; message: string; createdInPantry: boolean }>(
          "/api/shopping-list/add",
          {
            method: "POST",
            body: payload,
          }
        );
        await this.loadData(true);
        return res.data;
      } catch (err) {
        console.error("Failed to add item", err);
        this.notify("Failed to add item", getErrorMessage(err), "error");
        return null;
      }
    },

    async checkOffShoppingItem(item: PantryItem) {
      try {
        soundEffects.playCheckSuccess();
        fireShoppingConfetti();

        const previousLastPurchasedAt = item.lastPurchasedAt;
        this.sessionPurchased = this.sessionPurchased.filter((s) => s.id !== item.id);
        this.sessionPurchased.unshift({
          id: item.id,
          name: item.name,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          previousLastPurchasedAt,
        });

        const found = this.items.find((i) => i.id === item.id);
        if (found) {
          found.lastPurchasedAtPrevious = previousLastPurchasedAt;
          found.lastPurchasedAt = new Date().toISOString();
          found.inStock = true;
          found.inShoppingList = false;
        }

        const res = await $fetch<{ success: boolean; data: PantryItem }>(`/api/shopping-list/${item.id}/check`, {
          method: "POST",
        });
        if (res?.data?.id) {
          const idx = this.items.findIndex((i) => i.id === item.id);
          if (idx !== -1) {
            this.items[idx] = res.data;
          }
        }
        await this.loadData(true);
      } catch (err) {
        console.error("Failed to tick off item", err);
        this.notify("Failed to tick off item", getErrorMessage(err), "error");
      }
    },

    async uncheckShoppingItem(item: PantryItem) {
      try {
        const sessionEntry = this.sessionPurchased.find((s) => s.id === item.id);
        this.sessionPurchased = this.sessionPurchased.filter((s) => s.id !== item.id);
        const found = this.items.find((i) => i.id === item.id);
        const rollbackDate = item.lastPurchasedAtPrevious ?? sessionEntry?.previousLastPurchasedAt ?? found?.lastPurchasedAtPrevious ?? null;

        if (found) {
          found.lastPurchasedAt = rollbackDate;
          found.inShoppingList = true;
          found.inStock = false;
          found.lastPurchasedAtPrevious = null;
        }

        await $fetch(("/api/pantry/" + item.id) as string, {
          method: "PUT",
          body: {
            lastPurchasedAt: rollbackDate,
            inShoppingList: true,
            inStock: false,
            lastPurchasedAtPrevious: null,
          },
        });
        await this.loadData(true);
      } catch (err) {
        console.error("Failed to move item back to shopping list", err);
        this.notify("Failed to move item back to shopping list", getErrorMessage(err), "error");
      }
    },

    async deleteFromShoppingList(item: PantryItem) {
      try {
        const currentScroll = typeof window !== "undefined" ? window.scrollY : 0;
        // Optimistic UI update so scroll doesn't snap and UI is instant
        const found = this.items.find((i) => i.id === item.id);
        if (found) found.inShoppingList = false;

        await $fetch(("/api/pantry/" + item.id) as string, {
          method: "PUT",
          body: { inShoppingList: false },
        });
        await this.loadData(true);
        if (typeof window !== "undefined" && window.scrollY !== currentScroll) {
          window.scrollTo({ top: currentScroll, behavior: "instant" });
        }
      } catch (err) {
        console.error("Failed to remove item", err);
        this.notify("Failed to remove item", getErrorMessage(err), "error");
      }
    },

    async markSuggestedItems(itemIds: string[]) {
      if (!itemIds || itemIds.length === 0) return;
      const nowIso = new Date().toISOString();
      for (const id of itemIds) {
        const item = this.items.find((i) => i.id === id);
        if (item) {
          item.lastSuggestedAt = nowIso;
        }
      }
      try {
        await $fetch("/api/shopping-list/suggestions/mark-suggested", {
          method: "POST",
          body: { itemIds },
        });
      } catch (err) {
        console.error("Failed to mark suggestions", err);
      }
    },

    async updateItemDirect(id: string, updates: UpdatePantryItemDto) {
      try {
        const found = this.items.find((i) => i.id === id);
        if (found) {
          Object.assign(found, updates);
        }
        await $fetch(("/api/pantry/" + id) as string, {
          method: "PUT",
          body: updates,
        });
        await this.loadData(true);
      } catch (err) {
        console.error("Failed to update item", err);
        this.notify("Failed to update item", getErrorMessage(err), "error");
      }
    },

    async updateShoppingQuantity(id: string, quantity: number) {
      try {
        // Optimistic UI update
        const item = this.items.find((i) => i.id === id);
        if (item) item.shoppingListQuantity = quantity;

        await $fetch(`/api/shopping-list/${id}/quantity`, {
          method: "PUT",
          body: { quantity },
        });
        await this.loadData(true);
      } catch (err) {
        this.notify("Failed to update quantity", getErrorMessage(err), "error");
      }
    },

    async addBulkToShoppingList(itemIds: string[]) {
      try {
        const res = await $fetch<{ success: boolean; data: PantryItem[]; message: string }>(
          "/api/shopping-list/add-bulk",
          {
            method: "POST",
            body: { itemIds },
          }
        );
        this.notify(res.message || `Added ${itemIds.length} items to shopping list`, undefined, "success");
        await this.loadData(true);
      } catch (err) {
        this.notify("Failed to add items", getErrorMessage(err), "error");
      }
    },

    async handleNeedIt(item: PantryItem) {
      if (item.autoFrequency === false || !item.lastPurchasedAt) {
        await this.updateItemDirect(item.id, {
          inShoppingList: true,
          lastSuggestedAt: null,
        });
        return;
      }

      // When adding to the shopping list from the pantry item (pantry inventory screen) only,
      // substitute the suggestedAt for now() rather than the database value,
      // on the basis that the user is making an imperative action.
      const evalItem = { ...item, lastSuggestedAt: new Date().toISOString() };
      const result = calculateBurnRatio(evalItem, new Date());
      if (result.classification === "normal") {
        await this.updateItemDirect(item.id, {
          inShoppingList: true,
          frequencyDays: result.adjustedFrequencyDays,
          lastSuggestedAt: null,
        });
      } else {
        this.anomalyItem = item;
        this.anomalyType = result.classification === "high_anomaly" ? "high" : "low";
        this.anomalyInitialAction = "need";
        this.anomalyExpectedDays = Math.round(item.frequencyDays);
        this.anomalyLastedDays = Math.round(result.elapsedDays);
        this.anomalyAdjustedDays = result.adjustedFrequencyDays;
        this.isAnomalyOpen = true;
      }
    },

    async handleStillHave(item: PantryItem) {
      const nowIso = new Date().toISOString();
      if (item.autoFrequency === false || !item.lastPurchasedAt) {
        await this.updateItemDirect(item.id, {
          inStock: true,
          lastPurchasedAtPrevious: item.lastPurchasedAt,
          lastPurchasedAt: nowIso,
          lastSuggestedAt: null,
        });
        return;
      }

      const result = calculateBurnRatio(item, new Date());
      if (result.classification === "normal") {
        await this.updateItemDirect(item.id, {
          inStock: true,
          lastPurchasedAtPrevious: item.lastPurchasedAt,
          lastPurchasedAt: nowIso,
          lastSuggestedAt: null,
        });
      } else {
        this.anomalyItem = item;
        this.anomalyType = result.classification === "high_anomaly" ? "high" : "low";
        this.anomalyInitialAction = "still_have";
        this.anomalyExpectedDays = Math.round(item.frequencyDays);
        this.anomalyLastedDays = Math.round(result.elapsedDays);
        this.anomalyAdjustedDays = result.adjustedFrequencyDays;
        this.isAnomalyOpen = true;
      }
    },

    async confirmAnomaly(option: 1 | 2) {
      const item = this.anomalyItem;
      if (!item) return;

      const initialAction = this.anomalyInitialAction;
      const aType = this.anomalyType;
      const nowIso = new Date().toISOString();

      if (aType === "high") {
        if (option === 1) {
          if (initialAction === "need") {
            await this.updateItemDirect(item.id, {
              inShoppingList: true,
              frequencyDays: this.anomalyAdjustedDays,
              lastSuggestedAt: null,
            });
          } else {
            await this.updateItemDirect(item.id, {
              inStock: true,
              lastPurchasedAtPrevious: item.lastPurchasedAt,
              lastPurchasedAt: nowIso,
              frequencyDays: this.anomalyAdjustedDays,
              lastSuggestedAt: null,
            });
          }
        } else {
          if (initialAction === "need") {
            await this.updateItemDirect(item.id, {
              inShoppingList: true,
              lastSuggestedAt: null,
            });
          } else {
            await this.updateItemDirect(item.id, {
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
            await this.updateItemDirect(item.id, {
              inShoppingList: true,
              frequencyDays: this.anomalyAdjustedDays,
              lastSuggestedAt: null,
            });
          } else {
            await this.updateItemDirect(item.id, {
              inStock: true,
              lastPurchasedAtPrevious: item.lastPurchasedAt,
              lastPurchasedAt: nowIso,
              frequencyDays: this.anomalyAdjustedDays,
              lastSuggestedAt: null,
            });
          }
        } else {
          if (initialAction === "need") {
            await this.updateItemDirect(item.id, {
              inShoppingList: true,
              lastSuggestedAt: null,
            });
          } else {
            await this.updateItemDirect(item.id, {
              inStock: true,
              lastPurchasedAtPrevious: item.lastPurchasedAt,
              lastPurchasedAt: nowIso,
              lastSuggestedAt: null,
            });
          }
        }
      }

      this.isAnomalyOpen = false;
      this.anomalyItem = null;
    },
  },
});
