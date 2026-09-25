import fs from 'fs';
import path from 'path';
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

export function getInitialSeedData(): PantryItem[] {
  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

  const seed: Array<Omit<PantryItem, 'id' | 'createdAt' | 'updatedAt' | 'frequencyLabel' | 'nextDueDate'>> = [
    {
      name: 'Whole Milk (2L)',
      category: 'Dairy & Eggs',
      inStock: true,
      quantity: 1,
      unit: 'bottle',
      frequencyDays: 7,
      lastPurchasedAt: daysAgo(6),
      inShoppingList: false,
      shoppingListQuantity: 1,
      notes: 'Organic preferred',
    },
    {
      name: 'Free Range Eggs (Dozen)',
      category: 'Dairy & Eggs',
      inStock: true,
      quantity: 1,
      unit: 'carton',
      frequencyDays: 14,
      lastPurchasedAt: daysAgo(5),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Sourdough Sliced Bread',
      category: 'Bakery',
      inStock: false,
      quantity: 0,
      unit: 'loaf',
      frequencyDays: 5,
      lastPurchasedAt: daysAgo(6),
      inShoppingList: true,
      shoppingListQuantity: 1,
    },
    {
      name: 'Bananas',
      category: 'Produce',
      inStock: true,
      quantity: 1,
      unit: 'bunch',
      frequencyDays: 6,
      lastPurchasedAt: daysAgo(6),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Extra Virgin Olive Oil',
      category: 'Pantry Staples',
      inStock: true,
      quantity: 1,
      unit: 'bottle',
      frequencyDays: 30,
      lastPurchasedAt: daysAgo(10),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Ground Espresso Coffee',
      category: 'Beverages',
      inStock: true,
      quantity: 2,
      unit: 'bags',
      frequencyDays: 14,
      lastPurchasedAt: daysAgo(15),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Rolled Oats (1kg)',
      category: 'Pantry Staples',
      inStock: true,
      quantity: 1,
      unit: 'pack',
      frequencyDays: 21,
      lastPurchasedAt: daysAgo(12),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Unsalted Butter',
      category: 'Dairy & Eggs',
      inStock: true,
      quantity: 1,
      unit: 'block',
      frequencyDays: 14,
      lastPurchasedAt: daysAgo(3),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
    {
      name: 'Dishwasher Tablets',
      category: 'Household',
      inStock: true,
      quantity: 1,
      unit: 'pack',
      frequencyDays: 30,
      lastPurchasedAt: daysAgo(28),
      inShoppingList: false,
      shoppingListQuantity: 1,
    },
  ];

  return seed.map((item) => {
    const id = crypto.randomUUID();
    const frequencyLabel = getFrequencyLabel(item.frequencyDays);
    const nextDueDate = calculateNextDueDate(item.lastPurchasedAt, item.frequencyDays);
    const nowIso = now.toISOString();
    return {
      ...item,
      id,
      frequencyLabel,
      nextDueDate,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  });
}

export class JsonFilePantryRepository implements PantryRepository {
  private items: PantryItem[] = [];
  private readonly dbFilePath: string;
  private readonly dataDir: string;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbFilePath = customPath;
      this.dataDir = path.dirname(customPath);
    } else {
      this.dataDir = path.resolve(process.cwd(), 'data');
      this.dbFilePath = path.join(this.dataDir, 'pantry_db.json');
    }
    this.init();
  }

  private init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        this.items = JSON.parse(raw);
      } catch {
        const backupFile = path.join(this.dataDir, `pantry_backup_${Date.now()}.json`);
        fs.renameSync(this.dbFilePath, backupFile);
        this.items = getInitialSeedData();
        this.save();
      }
    } else {
      this.items = getInitialSeedData();
      this.save();
    }
  }

  private save() {
    const tmpFile = `${this.dbFilePath}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(this.items, null, 2), 'utf-8');
    fs.renameSync(tmpFile, this.dbFilePath);
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
    this.save();
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
    this.save();
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    const prevLength = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    if (this.items.length !== prevLength) {
      this.save();
      return true;
    }
    return false;
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
    this.save();
    return { count: this.items.length };
  }

  async resetSampleData(): Promise<PantryItem[]> {
    this.items = getInitialSeedData();
    this.save();
    return [...this.items];
  }
}
