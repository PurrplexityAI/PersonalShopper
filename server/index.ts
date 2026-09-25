import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { db } from './db.js';
import { evaluateItemCadence } from './cadence.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(cors());
app.use(express.json());

// Helper to get local network IP addresses for mobile access
function getLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// ----------------------------------------------------
// Pantry API Endpoints
// ----------------------------------------------------

// GET /api/pantry - List pantry items with optional filtering
app.get('/api/pantry', (req: Request, res: Response) => {
  try {
    let items = db.getAll();
    const { q, category, status } = req.query;

    if (q && typeof q === 'string') {
      const query = q.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query) ||
          (item.notes && item.notes.toLowerCase().includes(query))
      );
    }

    if (category && typeof category === 'string' && category !== 'All') {
      items = items.filter((item) => item.category === category);
    }

    if (status && typeof status === 'string') {
      const now = new Date();
      if (status === 'in-stock') {
        items = items.filter((item) => item.inStock);
      } else if (status === 'out-of-stock') {
        items = items.filter((item) => !item.inStock);
      } else if (status === 'due') {
        items = items.filter((item) => evaluateItemCadence(item, now).isDue);
      }
    }

    // Sort by name alphabetically
    items.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/pantry/categories - List existing unique categories
app.get('/api/pantry/categories', (req: Request, res: Response) => {
  try {
    const items = db.getAll();
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
    const itemCategories = items.map((i) => i.category);
    const combined = Array.from(new Set([...defaultCategories, ...itemCategories])).filter(Boolean).sort();
    res.json({ success: true, data: combined });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/pantry/:id - Get single pantry item
app.get('/api/pantry/:id', (req: Request, res: Response) => {
  try {
    const item = db.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/pantry - Create unique pantry item
app.post('/api/pantry', (req: Request, res: Response) => {
  try {
    const newItem = db.create(req.body);
    res.status(201).json({ success: true, data: newItem });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/pantry/:id - Update pantry item
app.put('/api/pantry/:id', (req: Request, res: Response) => {
  try {
    const updated = db.update(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/pantry/:id/toggle-stock - Toggle in-stock status
app.post('/api/pantry/:id/toggle-stock', (req: Request, res: Response) => {
  try {
    const current = db.getById(req.params.id);
    if (!current) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    const updated = db.update(req.params.id, { inStock: !current.inStock });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/pantry/:id - Delete item from pantry completely
app.delete('/api/pantry/:id', (req: Request, res: Response) => {
  try {
    const deleted = db.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, message: 'Item deleted from pantry' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// Shopping List API Endpoints
// ----------------------------------------------------

// GET /api/shopping-list - Retrieve active shopping list
app.get('/api/shopping-list', (req: Request, res: Response) => {
  try {
    const list = db.getShoppingList();
    res.json({ success: true, data: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/shopping-list/add - Add item to shopping list (creates in pantry if missing)
app.post('/api/shopping-list/add', (req: Request, res: Response) => {
  try {
    const { nameOrId, quantity, category, frequencyDays, unit } = req.body;
    if (!nameOrId || typeof nameOrId !== 'string') {
      return res.status(400).json({ success: false, error: 'nameOrId is required' });
    }

    const result = db.addToShoppingList(nameOrId, {
      quantity: Number(quantity) || 1,
      category,
      frequencyDays: Number(frequencyDays) || 7,
      unit,
    });

    res.json({
      success: true,
      data: result.item,
      createdInPantry: result.createdInPantry,
      message: result.createdInPantry
        ? `Added "${result.item.name}" to shopping list and created it in pantry!`
        : `Added "${result.item.name}" to shopping list.`,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/shopping-list/:id/check - Tick off item (mark bought, reset cadence timer, clear from shopping list)
app.post('/api/shopping-list/:id/check', (req: Request, res: Response) => {
  try {
    const updated = db.checkOffShoppingItem(req.params.id);
    res.json({
      success: true,
      data: updated,
      message: `Marked "${updated.name}" as purchased! In stock and cadence timer reset.`,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// DELETE /api/shopping-list/:id - Remove item from shopping list ("didn't buy", no cadence reset)
app.delete('/api/shopping-list/:id', (req: Request, res: Response) => {
  try {
    const updated = db.deleteFromShoppingList(req.params.id);
    res.json({
      success: true,
      data: updated,
      message: `Removed "${updated.name}" from shopping list without marking as purchased.`,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/shopping-list/:id/quantity - Update quantity on shopping list
app.put('/api/shopping-list/:id/quantity', (req: Request, res: Response) => {
  try {
    const quantity = Number(req.body.quantity);
    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, error: 'Valid quantity is required' });
    }
    const updated = db.update(req.params.id, { shoppingListQuantity: quantity });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// GET /api/shopping-list/suggestions - Cadence & stock based suggestions
app.get('/api/shopping-list/suggestions', (req: Request, res: Response) => {
  try {
    const suggestions = db.getSuggestions();
    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/shopping-list/add-bulk - Bulk add suggestions or items to shopping list
app.post('/api/shopping-list/add-bulk', (req: Request, res: Response) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds)) {
      return res.status(400).json({ success: false, error: 'itemIds array is required' });
    }
    const updated = db.addBulkToShoppingList(itemIds);
    res.json({
      success: true,
      data: updated,
      message: `Added ${updated.length} items to shopping list`,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// Data Backup & Management Endpoints
// ----------------------------------------------------

// GET /api/data/export - Export all pantry data
app.get('/api/data/export', (req: Request, res: Response) => {
  try {
    const payload = db.exportData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=pantry-backup-${new Date().toISOString().slice(0, 10)}.json`);
    res.json(payload);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/data/import - Import pantry data
app.post('/api/data/import', (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    const result = db.importData(items);
    res.json({ success: true, message: `Successfully imported ${result.count} pantry items.` });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/data/reset-sample - Reset to realistic starter items
app.post('/api/data/reset-sample', (req: Request, res: Response) => {
  try {
    const resetItems = db.resetSampleData();
    res.json({ success: true, data: resetItems, message: 'Database reset to sample grocery items.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------
// Production Static Serving
// ----------------------------------------------------
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// Fallback to index.html for client-side routing
app.use((req: Request, res: Response, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // In dev mode before build, send a friendly info message
      res.status(200).send('Personal Shopper API is running. Start the Vite dev client with `npm run dev:client`.');
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n Personal Shopper Server running!`);
  console.log(`> Local:   http://localhost:${PORT}`);
  const ips = getLocalIpAddresses();
  if (ips.length > 0) {
    console.log(`> Network (for mobile devices on same Wi-Fi):`);
    ips.forEach((ip) => console.log(`  http://${ip}:${PORT}`));
  }
  console.log('');
});
