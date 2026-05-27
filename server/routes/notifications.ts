import express from 'express';
import { Database } from '../db';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance();

// Get recent notifications for authenticated user
router.get('/', authenticate, (req: any, res) => {
  try {
    const notifications = db.all(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark all as read
router.post('/mark-all-read', authenticate, (req: any, res) => {
  try {
    db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
});

// Mark single as read
router.patch('/:id/read', authenticate, (req: any, res) => {
  const { id } = req.params;
  try {
    db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
