import express from 'express';
import { Database } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance();

// Get all job orders
router.get('/', authenticate, (req: any, res) => {
  try {
    let sql = `
      SELECT jo.*, 
             sr.category, sr.service_type, sr.description, sr.tracking_number, sr.technician_name,
             u.first_name as requester_first_name, u.last_name as requester_last_name, u.id as user_id
      FROM job_orders jo
      JOIN service_requests sr ON jo.service_request_id = sr.id
      JOIN users u ON sr.user_id = u.id
    `;
    const params: any[] = [];

    if (req.user.role !== 'admin') {
      sql += ' WHERE sr.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY jo.created_at DESC';
    const jobOrders = db.all(sql, params);
    res.json(jobOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch job orders' });
  }
});

// Update Job Order status, resolution_remarks, completion_date (Admin only)
router.patch('/:id', authenticate, authorize(['admin']), (req: any, res) => {
  const { id } = req.params;
  const { status, resolution_remarks, completion_date } = req.body;

  try {
    const job = db.get('SELECT * FROM job_orders WHERE id = ?', [id]);
    if (!job) {
      return res.status(404).json({ error: 'Job order not found' });
    }

    db.run(
      'UPDATE job_orders SET status = ?, resolution_remarks = ?, completion_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, resolution_remarks || null, completion_date || null, id]
    );

    // Sync status back to the parent service_request if completed
    let requestStatus = 'in_progress';
    if (status === 'completed') {
      requestStatus = 'resolved';
    } else if (status === 'open') {
      requestStatus = 'pending';
    }

    db.run('UPDATE service_requests SET status = ? WHERE id = ?', [requestStatus, job.service_request_id]);
    const request = db.get('SELECT user_id, tracking_number FROM service_requests WHERE id = ?', [job.service_request_id]);

    if (request) {
      // Send notification to the developer/staff requester
      db.run(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [
          request.user_id,
          'Job Order Update',
          `Job order progress for ${request.tracking_number} has been updated to "${status.toUpperCase()}". Remarks: ${resolution_remarks || 'None'}`
        ]
      );
    }

    // Log to audit log
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'JOB_ORDER_UPDATE', `Updated Job Order #${id} to status "${status}"`]
    );

    res.json({ message: 'Job order updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update job order' });
  }
});

export default router;
