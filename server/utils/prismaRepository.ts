import type {
  PantryItem,
  ShoppingSuggestion,
  CreatePantryItemDto,
  UpdatePantryItemDto,
  AddToShoppingListDto,
} from "~~/shared/types";
import type { PantryRepository } from "./repository";
import { calculateNextDueDate, getFrequencyLabel, generateSuggestions } from "~~/app/utils/cadence";
import { getDb, type DbClient } from "./prismaClient";

function toIsoString(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (val instanceof Date) return val.toISOString();
  if (typeof (val as { toISOString?: () => string }).toISOString === "function") {
    return (val as { toISOString: () => string }).toISOString();
  }
  if (typeof (val as { toString?: () => string }).toString === "function") {
    return (val as { toString: () => string }).toString();
  }
  return String(val);
}

export interface PantryItemRow {
  id: string;
  name: string;
  category: string;
  inStock: boolean;
  quantity: number;
  unit: string;
  frequencyDays: number;
  frequencyLabel: string;
  lastPurchasedAt: unknown;
  nextDueDate: unknown;
  inShoppingList: boolean;
  shoppingListQuantity: number;
  notes?: string | null;
  createdAt: unknown;
  updatedAt: unknown;
}

export function toPantryItem(row: PantryItemRow): PantryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    inStock: Boolean(row.inStock),
    quantity: Number(row.quantity),
    unit: row.unit,
    frequencyDays: Number(row.frequencyDays),
    frequencyLabel: row.frequencyLabel,
    lastPurchasedAt: toIsoString(row.lastPurchasedAt),
    nextDueDate: toIsoString(row.nextDueDate),
    inShoppingList: Boolean(row.inShoppingList),
    shoppingListQuantity: Number(row.shoppingListQuantity),
    notes: row.notes || undefined,
    createdAt: toIsoString(row.createdAt) || new Date().toISOString(),
    updatedAt: toIsoString(row.updatedAt) || new Date().toISOString(),
  };
}

export class PrismaPantryRepository implements PantryRepository {
  private client: DbClient;

  constructor(client?: DbClient) {
    this.client = client ?? getDb();
  }

  async getAll(): Promise<PantryItem[]> {
    const rows = await this.client.orm.public.PantryItem.all();
    return rows.map(toPantryItem);
  }

  async getById(id: string): Promise<PantryItem | null> {
    const row = await this.client.orm.public.PantryItem.where({ id }).first();
    return row ? toPantryItem(row) : null;
  }

  async findByName(name: string): Promise<PantryItem | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const row = await this.client.orm.public.PantryItem.where((p) =>
      p.name.ilike(trimmed)
    ).first();
    return row ? toPantryItem(row) : null;
  }

  async getCategories(): Promise<string[]> {
    const defaultCategories = [
      "Dairy & Eggs",
      "Produce",
      "Bakery",
      "Meat & Seafood",
      "Pantry Staples",
      "Beverages",
      "Snacks",
      "Condiments & Spices",
      "Frozen",
      "Household",
      "Personal Care",
      "General",
    ];
    const items = await this.getAll();
    const itemCategories = items.map((i) => i.category);
    return Array.from(new Set([...defaultCategories, ...itemCategories])).filter(Boolean).sort();
  }

  async create(data: CreatePantryItemDto): Promise<PantryItem> {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new Error("Item name is required");
    }

    const existing = await this.findByName(trimmedName);
    if (existing) {
      throw new Error(`An item named "${trimmedName}" already exists in the pantry.`);
    }

    const now = new Date();
    const frequencyDays = data.frequencyDays ?? 7;
    const frequencyLabel = getFrequencyLabel(frequencyDays);
    const lastPurchasedAt = data.lastPurchasedAt !== undefined ? data.lastPurchasedAt : (data.inStock !== false ? now.toISOString() : null);
    const nextDueDate = calculateNextDueDate(lastPurchasedAt, frequencyDays);

    const row = await this.client.orm.public.PantryItem.create({
      name: trimmedName,
      category: data.category?.trim() || "General",
      inStock: data.inStock ?? true,
      quantity: data.quantity ?? 1,
      unit: data.unit?.trim() || "items",
      frequencyDays,
      frequencyLabel,
      lastPurchasedAt: lastPurchasedAt || null,
      nextDueDate: nextDueDate || null,
      inShoppingList: data.inShoppingList ?? false,
      shoppingListQuantity: data.shoppingListQuantity ?? 1,
      notes: data.notes?.trim() || null,
    });

    return toPantryItem(row);
  }

  async update(id: string, updates: UpdatePantryItemDto): Promise<PantryItem> {
    const current = await this.getById(id);
    if (!current) {
      throw new Error(`Item with id "${id}" not found`);
    }

    if (updates.name && updates.name.trim()) {
      const trimmed = updates.name.trim();
      const existing = await this.findByName(trimmed);
      if (existing && existing.id !== id) {
        throw new Error(`Another item named "${trimmed}" already exists in the pantry.`);
      }
      updates.name = trimmed;
    }

    const frequencyDays = updates.frequencyDays !== undefined ? updates.frequencyDays : current.frequencyDays;
    const frequencyLabel = getFrequencyLabel(frequencyDays);
    const lastPurchasedAt = updates.lastPurchasedAt !== undefined ? updates.lastPurchasedAt : current.lastPurchasedAt;
    const nextDueDate = calculateNextDueDate(lastPurchasedAt, frequencyDays);

    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.inStock !== undefined) updateData.inStock = updates.inStock;
    if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
    if (updates.unit !== undefined) updateData.unit = updates.unit;
    if (updates.inShoppingList !== undefined) updateData.inShoppingList = updates.inShoppingList;
    if (updates.shoppingListQuantity !== undefined) updateData.shoppingListQuantity = updates.shoppingListQuantity;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    updateData.frequencyDays = frequencyDays;
    updateData.frequencyLabel = frequencyLabel;
    updateData.lastPurchasedAt = lastPurchasedAt || null;
    updateData.nextDueDate = nextDueDate || null;

    const row = await this.client.orm.public.PantryItem.where({ id }).update(updateData);
    return toPantryItem(row);
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) {
      return false;
    }
    await this.client.orm.public.PantryItem.where({ id }).delete();
    return true;
  }

  async getShoppingList(): Promise<PantryItem[]> {
    const rows = await this.client.orm.public.PantryItem.where({ inShoppingList: true }).all();
    return rows.map(toPantryItem);
  }

  async addToShoppingList(
    nameOrId: string,
    options?: AddToShoppingListDto
  ): Promise<{ item: PantryItem; createdInPantry: boolean }> {
    const existing = (await this.getById(nameOrId)) || (await this.findByName(nameOrId));

    if (existing) {
      const updated = await this.update(existing.id, {
        inShoppingList: true,
        shoppingListQuantity: options?.quantity ?? Math.max(existing.shoppingListQuantity || 1, 1),
      });
      return { item: updated, createdInPantry: false };
    }

    const newItem = await this.create({
      name: nameOrId,
      category: options?.category || "General",
      inStock: false,
      quantity: 0,
      unit: options?.unit || "items",
      frequencyDays: options?.frequencyDays ?? 7,
      inShoppingList: true,
      shoppingListQuantity: options?.quantity ?? 1,
      lastPurchasedAt: null,
    });

    return { item: newItem, createdInPantry: true };
  }

  async checkOffShoppingItem(id: string): Promise<PantryItem> {
    const item = await this.getById(id);
    if (!item) {
      throw new Error(`Item with id "${id}" not found`);
    }

    const now = new Date().toISOString();

    return this.update(id, {
      inStock: true,
      lastPurchasedAt: now,
      inShoppingList: false,
      quantity: item.shoppingListQuantity > 0 ? item.shoppingListQuantity : 1,
    });
  }

  async deleteFromShoppingList(id: string): Promise<PantryItem> {
    const item = await this.getById(id);
    if (!item) {
      throw new Error(`Item with id "${id}" not found`);
    }

    return this.update(id, {
      inShoppingList: false,
    });
  }

  async updateShoppingQuantity(id: string, quantity: number): Promise<PantryItem> {
    if (!quantity || quantity < 1) {
      throw new Error("Valid quantity is required");
    }
    return this.update(id, { shoppingListQuantity: quantity });
  }

  async getSuggestions(now: Date = new Date()): Promise<ShoppingSuggestion[]> {
    const items = await this.getAll();
    return generateSuggestions(items, now);
  }

  async addBulkToShoppingList(itemIds: string[]): Promise<PantryItem[]> {
    const updated: PantryItem[] = [];
    for (const id of itemIds) {
      const item = await this.getById(id);
      if (item && !item.inShoppingList) {
        const res = await this.update(id, { inShoppingList: true, shoppingListQuantity: 1 });
        updated.push(res);
      }
    }
    return updated;
  }
}
