import express from 'express';
import { Database } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance();

// Get system audit logs (Admin only)
router.get('/', authenticate, authorize(['admin']), (req, res) => {
  try {
    const logs = db.all(`
      SELECT al.*, u.first_name, u.last_name, u.email, u.role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT 200
    `);
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

export default router;
