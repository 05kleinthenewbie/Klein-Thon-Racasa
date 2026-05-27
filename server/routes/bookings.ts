import express from 'express';
import { Database } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance();

// Get all bookings (role-based)
router.get('/', authenticate, (req: any, res) => {
  try {
    let sql = `
      SELECT fb.*, u.first_name, u.last_name, u.email 
      FROM facility_bookings fb 
      JOIN users u ON fb.user_id = u.id 
    `;
    const params: any[] = [];

    if (req.user.role !== 'admin') {
      sql += ' WHERE fb.user_id = ?';
      params.push(req.user.id);
    }

    sql += ' ORDER BY fb.start_datetime ASC';
    const bookings = db.all(sql, params);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create a booking with conflict checking
router.post('/', authenticate, (req: any, res) => {
  const { facility_name, purpose, start_datetime, end_datetime } = req.body;
  
  if (!facility_name || !purpose || !start_datetime || !end_datetime) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Conflict check (only approved or pending bookings can conflict)
    const conflict = db.get(`
      SELECT * FROM facility_bookings 
      WHERE facility_name = ? 
      AND status IN ('approved', 'pending')
      AND (
        (start_datetime < ? AND end_datetime > ?)
      )
    `, [facility_name, end_datetime, start_datetime]);

    if (conflict) {
      return res.status(400).json({ error: `${facility_name} is already reserved or has a pending request during this time slot.` });
    }

    const result = db.run(
      'INSERT INTO facility_bookings (user_id, facility_name, purpose, start_datetime, end_datetime) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, facility_name, purpose, start_datetime, end_datetime]
    );

    // Notify admins
    const admins = db.all("SELECT id FROM users WHERE role = 'admin'");
    admins.forEach((admin: any) => {
      db.run(
        'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
        [admin.id, 'New Facility Reservation', `${req.user.first_name} requested ${facility_name} on ${start_datetime.replace('T', ' ')}.`]
      );
    });

    // Log to audit logs
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'FACILITY_RESERVE', `Requested reservation for ${facility_name} from ${start_datetime} to ${end_datetime}`]
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Facility reservation requested!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to book facility' });
  }
});

// Update status (Admin only)
router.patch('/:id/status', authenticate, (req: any, res) => {
  const { id } = req.params;
  const { status, remarks } = req.body;

  if (!['approved', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const booking = db.get('SELECT * FROM facility_bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking reservation not found' });
    }

    // Faculty can only cancel their own bookings
    if (req.user.role !== 'admin' && booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    db.run('UPDATE facility_bookings SET status = ? WHERE id = ?', [status, id]);

    // Create notifications for faculty/staff
    db.run(
      'INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)',
      [
        booking.user_id, 
        'Reservation Update', 
        `Your reservation for ${booking.facility_name} has been ${status.toUpperCase()}. ${remarks ? 'Remarks: ' + remarks : ''}`
      ]
    );

    // Log action to audit_logs
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'FACILITY_STATUS_UPDATE', `Changed reservation status for ${booking.facility_name} to ${status}`]
    );

    res.json({ message: `Reservation has been successfully ${status}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reservation status' });
  }
});

// Delete booking (Admin only)
router.delete('/:id', authenticate, authorize(['admin']), (req: any, res) => {
  const { id } = req.params;
  try {
    const booking = db.get('SELECT * FROM facility_bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    db.run('DELETE FROM facility_bookings WHERE id = ?', [id]);

    // Log action
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'FACILITY_DELETE', `Deleted facility booking record for ID ${id} (${booking.facility_name})`]
    );

    res.json({ message: 'Booking record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

export default router;
