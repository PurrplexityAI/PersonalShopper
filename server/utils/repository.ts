import type {
  PantryItem,
  ShoppingSuggestion,
  CreatePantryItemDto,
  UpdatePantryItemDto,
  AddToShoppingListDto,
} from "~~/shared/types";

export interface PantryRepository {
  getAll(): Promise<PantryItem[]>;
  getById(id: string): Promise<PantryItem | null>;
  findByName(name: string): Promise<PantryItem | null>;
  getCategories(): Promise<string[]>;
  create(data: CreatePantryItemDto): Promise<PantryItem>;
  update(id: string, updates: UpdatePantryItemDto): Promise<PantryItem>;
  delete(id: string): Promise<boolean>;
  getShoppingList(): Promise<PantryItem[]>;
  addToShoppingList(
    nameOrId: string,
    options?: AddToShoppingListDto
  ): Promise<{ item: PantryItem; createdInPantry: boolean }>;
  checkOffShoppingItem(id: string): Promise<PantryItem>;
  deleteFromShoppingList(id: string): Promise<PantryItem>;
  updateShoppingQuantity(id: string, quantity: number): Promise<PantryItem>;
  getSuggestions(now?: Date): Promise<ShoppingSuggestion[]>;
  addBulkToShoppingList(itemIds: string[]): Promise<PantryItem[]>;
  markSuggested(itemIds: string[], now?: Date): Promise<void>;
}
