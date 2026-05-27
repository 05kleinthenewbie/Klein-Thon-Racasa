import express from 'express';
import { Database } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance();

// Get all inventory items
router.get('/', authenticate, (req, res) => {
  try {
    const items = db.all('SELECT * FROM inventory ORDER BY created_at DESC');
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// Add new item (Admin only)
router.post('/', authenticate, authorize(['admin']), (req: any, res) => {
  const { 
    asset_tag, 
    item_name, 
    description, 
    category, 
    status, 
    damage_price, 
    location,
    property_number,
    brand,
    model,
    serial_number,
    condition
  } = req.body;

  try {
    // Check if asset_tag already exists
    const existing = db.get('SELECT id FROM inventory WHERE asset_tag = ?', [asset_tag]);
    if (existing) {
      return res.status(400).json({ error: 'An item with this Asset Tag already exists.' });
    }

    const result = db.run(
      `INSERT INTO inventory (
        asset_tag, item_name, description, category, status, 
        damage_price, location, property_number, brand, model, 
        serial_number, condition
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        asset_tag, 
        item_name, 
        description, 
        category, 
        status || 'functional', 
        damage_price || 0.0, 
        location,
        property_number || asset_tag,
        brand || '',
        model || '',
        serial_number || '',
        condition || 'Good'
      ]
    );

    // Log to audit log
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'INVENTORY_CREATE', `Created item: ${item_name} with tag ${asset_tag}`]
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Item added successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Edit item (Admin only)
router.patch('/:id', authenticate, authorize(['admin']), (req: any, res) => {
  const { id } = req.params;
  const { 
    asset_tag, 
    item_name, 
    description, 
    category, 
    status, 
    damage_price, 
    location,
    property_number,
    brand,
    model,
    serial_number,
    condition
  } = req.body;

  try {
    const item = db.get('SELECT item_name FROM inventory WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    db.run(
      `UPDATE inventory SET 
        asset_tag = ?, item_name = ?, description = ?, category = ?, 
        status = ?, damage_price = ?, location = ?, property_number = ?, 
        brand = ?, model = ?, serial_number = ?, condition = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        asset_tag, 
        item_name, 
        description, 
        category, 
        status, 
        damage_price, 
        location,
        property_number,
        brand,
        model,
        serial_number,
        condition,
        id
      ]
    );

    // Log to audit log
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'INVENTORY_UPDATE', `Updated item ID ${id} (${item_name})`]
    );

    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item (Admin only)
router.delete('/:id', authenticate, authorize(['admin']), (req: any, res) => {
  const { id } = req.params;
  try {
    const item = db.get('SELECT item_name FROM inventory WHERE id = ?', [id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    db.run('DELETE FROM inventory WHERE id = ?', [id]);

    // Log to audit log
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'INVENTORY_DELETE', `Deleted item ID ${id} (${item.item_name})`]
    );

    res.json({ message: 'Item performance deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
