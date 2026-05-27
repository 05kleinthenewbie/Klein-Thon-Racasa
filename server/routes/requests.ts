import express from 'express';
import { Database } from '../db';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance();

// Get all requests
router.get('/', authenticate, (req: any, res) => {
  try {
    let sql = `
      SELECT sr.*, u.first_name, u.last_name, u.email 
      FROM service_requests sr 
      JOIN users u ON sr.user_id = u.id
    `;
    const params: any[] = [];

    if (req.user.role !== 'admin') {
      sql += ' WHERE sr.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY sr.created_at DESC';
    const requests = db.all(sql, params);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Create request with tracking number, category, service_type, description, file_attachment
router.post('/', authenticate, (req: any, res) => {
  const { category, service_type, description, file_attachment } = req.body;
  
  if (!category || !service_type || !description) {
    return res.status(400).json({ error: 'Category, service type, and description are required.' });
  }

  try {
    // Generate simple tracking number: REQ-[CURRENT_YEAR]-[RAND]
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const tracking_number = `REQ-${year}-${rand}`;

    const result = db.run(
      `INSERT INTO service_requests (
        user_id, request_type, description, status, category, service_type, file_attachment, tracking_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id, 
        category, // map request_type to category for backward compatibility
        description, 
        'pending', 
        category, 
        service_type, 
        file_attachment || null, 
        tracking_number
      ]
    );

    // Add unread notification for Admin
    // Find admins to notify
    const admins = db.all("SELECT id FROM users WHERE role = 'admin'");
    admins.forEach((admin: any) => {
      db.run(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [admin.id, 'New ICT Request', `A new service request (${tracking_number}) has been submitted by ${req.user.first_name} ${req.user.last_name}.`]
      );
    });

    // Log action to audit_logs
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'REQUEST_CREATE', `Submitted service request: ${tracking_number} [${category} - ${service_type}]`]
    );

    res.status(201).json({ id: result.lastInsertRowid, tracking_number, message: 'Request submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
});

// Update status and details (Admin only)
router.patch('/:id/status', authenticate, (req: any, res) => {
  const { id } = req.params;
  const { status, remarks, technician_name } = req.body;
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update status' });
  }

  try {
    const request = db.get('SELECT * FROM service_requests WHERE id = ?', [id]);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    db.run(
      'UPDATE service_requests SET status = ?, technician_name = ? WHERE id = ?', 
      [status, technician_name || request.technician_name, id]
    );
    
    // If approved, create a corresponding job order automatically or update it
    if (status === 'approved') {
      const existingJob = db.get('SELECT id FROM job_orders WHERE service_request_id = ?', [id]);
      if (!existingJob) {
        db.run(
          'INSERT INTO job_orders (service_request_id, task_details, assigned_admin_id, status) VALUES (?, ?, ?, ?)',
          [id, `Repair / Support Details: ${request.description}`, req.user.id, 'open']
        );
      }
    }

    // Create notification for the faculty user
    db.run(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [
        request.user_id, 
        'Request Status Updated', 
        `Your request (${request.tracking_number || 'ID ' + id}) is now ${status.toUpperCase()}. ${remarks ? 'remarks: ' + remarks : ''}`
      ]
    );

    // Log to audit log
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'REQUEST_STATUS_UPDATE', `Updated status of request ID ${id} to ${status}. Assigned: ${technician_name || 'None'}`]
    );
    
    res.json({ message: 'Request status and technician updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

export default router;
