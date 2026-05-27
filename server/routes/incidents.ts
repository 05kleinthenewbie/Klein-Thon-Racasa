import express from 'express';
import { Database } from '../db';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance();

// Get all incidents
router.get('/', authenticate, (req: any, res) => {
  try {
    let sql = `
      SELECT i.*, u.first_name, u.last_name, inv.item_name 
      FROM incidents i 
      JOIN users u ON i.liable_user_id = u.id 
      LEFT JOIN inventory inv ON i.inventory_id = inv.id
    `;
    const params: any[] = [];

    if (req.user.role !== 'admin') {
      sql += ' WHERE i.liable_user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY i.created_at DESC';
    const incidents = db.all(sql, params);
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// Record new incident (Admin only)
router.post('/', authenticate, (req: any, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can record incidents' });
  }

  const { liable_user_id, inventory_id, incident_date, description, liability_amount } = req.body;
  try {
    const result = db.run(
      'INSERT INTO incidents (reported_by_admin_id, liable_user_id, inventory_id, incident_date, description, liability_amount) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, liable_user_id, inventory_id, incident_date, description, liability_amount]
    );

    // Also create a notification for the liable user
    db.run(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [liable_user_id, 'New Incident Recorded', `An incident has been recorded that requires your attention. Amount: ₱${liability_amount}`]
    );

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record incident' });
  }
});

export default router;
