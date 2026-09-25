import { calculateNextDueDate, evaluateItemCadence, generateSuggestions, getFrequencyLabel } from '../cadence.js';
import { PantryItem } from '../types.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('\n--- Starting Personal Shopper Automated Verification Tests ---\n');

// 1. Cadence Label Tests
assert(getFrequencyLabel(7) === 'Weekly (7d)', 'Frequency label 7 days is Weekly (7d)');
assert(getFrequencyLabel(14) === 'Every 2 weeks (14d)', 'Frequency label 14 days is Every 2 weeks (14d)');
assert(getFrequencyLabel(3) === 'Every 3 days', 'Frequency label 3 days is Every 3 days');

// 2. Next Due Date Calculation Tests
const baseDate = '2026-09-01T12:00:00.000Z';
const next7Days = calculateNextDueDate(baseDate, 7);
assert(next7Days === '2026-09-08T12:00:00.000Z', 'Next due date for 7 days cadence is calculated correctly');
const next14Days = calculateNextDueDate(baseDate, 14);
assert(next14Days === '2026-09-15T12:00:00.000Z', 'Next due date for 14 days cadence is calculated correctly');

// 3. Cadence Evaluation Tests
const mockItem: PantryItem = {
  id: 'test-item-1',
  name: 'Organic Milk',
  category: 'Dairy',
  inStock: true,
  quantity: 1,
  unit: 'bottle',
  frequencyDays: 7,
  frequencyLabel: 'Weekly (7d)',
  lastPurchasedAt: '2026-09-01T12:00:00.000Z',
  nextDueDate: '2026-09-08T12:00:00.000Z',
  inShoppingList: false,
  shoppingListQuantity: 1,
  createdAt: '2026-09-01T12:00:00.000Z',
  updatedAt: '2026-09-01T12:00:00.000Z',
};

// Case A: Checked on Sep 5 (due in 3 days, not due yet)
const evalSep5 = evaluateItemCadence(mockItem, new Date('2026-09-05T12:00:00.000Z'));
assert(!evalSep5.isDue, 'Item is not due on Sep 5');

// Case B: Checked on Sep 8 (due today)
const evalSep8 = evaluateItemCadence(mockItem, new Date('2026-09-08T12:00:00.000Z'));
assert(evalSep8.isDue && evalSep8.urgency === 'high', 'Item is due today on Sep 8');

// Case C: Checked on Sep 10 (overdue by 2 days)
const evalSep10 = evaluateItemCadence(mockItem, new Date('2026-09-10T12:00:00.000Z'));
assert(evalSep10.isDue && evalSep10.reason.includes('Overdue by 2 days'), 'Item is flagged as overdue by 2 days on Sep 10');

// Case D: Out of stock (always due immediately)
const outOfStockItem: PantryItem = {
  ...mockItem,
  inStock: false,
};
const evalOutOfStock = evaluateItemCadence(outOfStockItem, new Date('2026-09-02T12:00:00.000Z'));
assert(evalOutOfStock.isDue && evalOutOfStock.urgency === 'critical', 'Out of stock item is critically due regardless of cadence');

// 4. Suggestions Generation Tests
const suggestions = generateSuggestions([mockItem, outOfStockItem], new Date('2026-09-10T12:00:00.000Z'));
assert(suggestions.length === 2, 'Both items generated suggestions when overdue/out of stock');
assert(suggestions[0].item.name === 'Organic Milk' && suggestions[0].urgency === 'critical', 'Out of stock item ranked highest urgency');

// 5. Database Integration & Semantics Tests
import { db } from '../db.js';

// Clean test item name
const testItemName = `Test Honey ${Date.now()}`;

// Test 5A: Create item in pantry
const created = db.create({
  name: testItemName,
  category: 'Pantry Staples',
  inStock: true,
  frequencyDays: 14,
  quantity: 1,
});
assert(created.name === testItemName, 'Pantry item created with unique name');

// Test 5B: Enforce uniqueness
let duplicateCaught = false;
try {
  db.create({ name: testItemName, category: 'Pantry Staples' });
} catch (e) {
  duplicateCaught = true;
}
assert(duplicateCaught, 'Uniqueness constraint strictly prevents duplicate item creation in pantry');

// Test 5C: Add non-existent item to shopping list -> should create in pantry
const autoCreatedName = `Test Matcha ${Date.now()}`;
const addResult = db.addToShoppingList(autoCreatedName, { frequencyDays: 21 });
assert(addResult.createdInPantry === true, 'Adding non-existent item to shopping list auto-creates it in pantry');
const foundInPantry = db.findByName(autoCreatedName);
assert(foundInPantry !== undefined && foundInPantry.inShoppingList === true, 'Auto-created item is present in pantry and flagged in shopping list');

// Test 5D: Tick off item from shopping list
const oldLastPurchased = foundInPantry!.lastPurchasedAt;
const checkedItem = db.checkOffShoppingItem(foundInPantry!.id);
assert(checkedItem.inStock === true, 'Checked off item is marked in-stock in pantry');
assert(checkedItem.inShoppingList === false, 'Checked off item is removed from active shopping list');
assert(checkedItem.lastPurchasedAt !== oldLastPurchased, 'Checked off item has its cadence timer reset to today');

// Test 5E: Add existing item to shopping list, then delete it without buying
db.addToShoppingList(created.id);
const beforeDeleteCadence = db.getById(created.id)!.lastPurchasedAt;
const beforeDeleteStock = db.getById(created.id)!.inStock;
db.deleteFromShoppingList(created.id);
const afterDelete = db.getById(created.id)!;
assert(afterDelete.inShoppingList === false, 'Deleted from shopping list sets inShoppingList to false');
assert(afterDelete.lastPurchasedAt === beforeDeleteCadence, 'Deleting from shopping list does NOT reset cadence');
assert(afterDelete.inStock === beforeDeleteStock, 'Deleting from shopping list does NOT alter inStock status');

// Test 5F: Delete item from pantry completely
db.delete(created.id);
assert(db.getById(created.id) === undefined, 'Deleted item is completely removed from pantry');
db.delete(foundInPantry!.id);

console.log('\n--- All Automated Verification Tests Passed Successfully! ---\n');
