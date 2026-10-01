export interface PantryItem {
  id: string;
  name: string; // Must be unique (case-insensitive)
  category: string;
  inStock: boolean;
  quantity: number;
  unit: string;
  frequencyDays: number; // Purchase cadence in days (e.g., 7 = weekly)
  frequencyLabel: string; // E.g., "Weekly (7d)", "Every 2 weeks", "Monthly"
  autoFrequency: boolean; // Controls automated frequency tracking for this item
  lastSuggestedAt: string | null; // Exact timestamp when this item was last displayed in suggestions drawer
  lastPurchasedAt: string | null; // ISO string of when it was last bought
  lastPurchasedAtPrevious: string | null; // Immediate preceding timestamp for single-step rollbacks
  nextDueDate: string | null; // ISO string: lastPurchasedAt + frequencyDays
  inShoppingList: boolean; // True if item is currently on the shopping list
  shoppingListQuantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type UrgencyLevel = "critical" | "high" | "medium" | "low";

export interface ShoppingSuggestion {
  item: PantryItem;
  reason: string;
  urgency: UrgencyLevel;
  daysRemaining: number; // Negative if overdue, 0 if due today, positive if due soon
}

export type ActiveTab = "shopping" | "pantry";

export type StockFilter = "all" | "in-stock" | "out-of-stock" | "due";

export interface CreatePantryItemDto {
  name: string;
  category?: string;
  inStock?: boolean;
  quantity?: number;
  unit?: string;
  frequencyDays?: number;
  autoFrequency?: boolean;
  lastSuggestedAt?: string | null;
  lastPurchasedAt?: string | null;
  lastPurchasedAtPrevious?: string | null;
  inShoppingList?: boolean;
  shoppingListQuantity?: number;
  notes?: string;
}

export type UpdatePantryItemDto = Partial<CreatePantryItemDto>;

export interface AddToShoppingListDto {
  quantity?: number;
  category?: string;
  frequencyDays?: number;
  unit?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
