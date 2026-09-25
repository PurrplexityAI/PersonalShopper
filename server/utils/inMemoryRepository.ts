import crypto from 'crypto';
import type {
  PantryItem,
  ShoppingSuggestion,
  CreatePantryItemDto,
  UpdatePantryItemDto,
  AddToShoppingListDto,
} from '~~/shared/types';
import type { PantryRepository } from './repository';
import { calculateNextDueDate, getFrequencyLabel, generateSuggestions } from '~~/app/utils/cadence';
import { getInitialSeedData } from './jsonRepository';

export class InMemoryPantryRepository implements PantryRepository {
  private items: PantryItem[] = [];

  constructor(initialItems?: PantryItem[]) {
    if (initialItems) {
      this.items = JSON.parse(JSON.stringify(initialItems));
    }
  }

  public seedWithDefaults(): void {
    this.items = getInitialSeedData();
  }

  public clear(): void {
    this.items = [];
  }

  private normalizeName(name: string): string {
    return name.trim().toLowerCase();
  }

  async getAll(): Promise<PantryItem[]> {
    return [...this.items];
  }

  async getById(id: string): Promise<PantryItem | null> {
    return this.items.find((item) => item.id === id) || null;
  }

  async findByName(name: string): Promise<PantryItem | null> {
    const target = this.normalizeName(name);
    return this.items.find((item) => this.normalizeName(item.name) === target) || null;
  }

  async getCategories(): Promise<string[]> {
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
    const itemCategories = this.items.map((i) => i.category);
    return Array.from(new Set([...defaultCategories, ...itemCategories])).filter(Boolean).sort();
  }

  async create(data: CreatePantryItemDto): Promise<PantryItem> {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      throw new Error('Item name is required');
    }

    const existing = await this.findByName(trimmedName);
    if (existing) {
      throw new Error(`An item named "${trimmedName}" already exists in the pantry.`);
    }

    const now = new Date().toISOString();
    const frequencyDays = data.frequencyDays ?? 7;
    const frequencyLabel = getFrequencyLabel(frequencyDays);
    const lastPurchasedAt = data.lastPurchasedAt !== undefined ? data.lastPurchasedAt : (data.inStock !== false ? now : null);
    const nextDueDate = calculateNextDueDate(lastPurchasedAt, frequencyDays);

    const newItem: PantryItem = {
      id: crypto.randomUUID(),
      name: trimmedName,
      category: data.category?.trim() || 'General',
      inStock: data.inStock ?? true,
      quantity: data.quantity ?? 1,
      unit: data.unit?.trim() || 'items',
      frequencyDays,
      frequencyLabel,
      lastPurchasedAt,
      nextDueDate,
      inShoppingList: data.inShoppingList ?? false,
      shoppingListQuantity: data.shoppingListQuantity ?? 1,
      notes: data.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    };

    this.items.push(newItem);
    return newItem;
  }

  async update(id: string, updates: UpdatePantryItemDto): Promise<PantryItem> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item with id "${id}" not found`);
    }

    const current = this.items[index];

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

    const updatedItem: PantryItem = {
      ...current,
      ...updates,
      frequencyDays,
      frequencyLabel,
      lastPurchasedAt,
      nextDueDate,
      updatedAt: new Date().toISOString(),
    };

    this.items[index] = updatedItem;
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    const prevLength = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    return this.items.length !== prevLength;
  }

  async getShoppingList(): Promise<PantryItem[]> {
    return this.items.filter((item) => item.inShoppingList);
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
      category: options?.category || 'General',
      inStock: false,
      quantity: 0,
      unit: options?.unit || 'items',
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
    const nextDueDate = calculateNextDueDate(now, item.frequencyDays);

    return this.update(id, {
      inStock: true,
      lastPurchasedAt: now,
      nextDueDate,
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
      throw new Error('Valid quantity is required');
    }
    return this.update(id, { shoppingListQuantity: quantity });
  }

  async getSuggestions(now: Date = new Date()): Promise<ShoppingSuggestion[]> {
    return generateSuggestions(this.items, now);
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

  async exportData(): Promise<{ items: PantryItem[]; exportedAt: string }> {
    return {
      items: await this.getAll(),
      exportedAt: new Date().toISOString(),
    };
  }

  async importData(incomingItems: PantryItem[]): Promise<{ count: number }> {
    if (!Array.isArray(incomingItems)) {
      throw new Error('Invalid import data: Expected an array of pantry items.');
    }

    const validItems: PantryItem[] = [];
    const seenNames = new Set<string>();

    for (const raw of incomingItems) {
      if (!raw.name || typeof raw.name !== 'string') continue;
      const normalized = this.normalizeName(raw.name);
      if (seenNames.has(normalized)) continue;
      seenNames.add(normalized);

      const frequencyDays = Number(raw.frequencyDays) || 7;
      const frequencyLabel = getFrequencyLabel(frequencyDays);
      const nextDueDate = calculateNextDueDate(raw.lastPurchasedAt || null, frequencyDays);

      validItems.push({
        id: raw.id || crypto.randomUUID(),
        name: raw.name.trim(),
        category: raw.category?.trim() || 'General',
        inStock: Boolean(raw.inStock),
        quantity: Number(raw.quantity) >= 0 ? Number(raw.quantity) : 1,
        unit: raw.unit?.trim() || 'items',
        frequencyDays,
        frequencyLabel,
        lastPurchasedAt: raw.lastPurchasedAt || null,
        nextDueDate,
        inShoppingList: Boolean(raw.inShoppingList),
        shoppingListQuantity: Number(raw.shoppingListQuantity) > 0 ? Number(raw.shoppingListQuantity) : 1,
        notes: raw.notes || '',
        createdAt: raw.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    this.items = validItems;
    return { count: this.items.length };
  }

  async resetSampleData(): Promise<PantryItem[]> {
    this.items = getInitialSeedData();
    return [...this.items];
  }
}
