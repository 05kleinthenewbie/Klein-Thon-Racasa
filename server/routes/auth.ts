import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Database } from '../db';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();
const db = Database.getInstance();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(404).json({ error: 'User with this email does not exist.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, user.id]);

    // Log action
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'FORGOT_PASSWORD_RESET', `Password reset initiated for ${email}`]
    );

    res.json({ message: 'Password recovery successful! Your password has been updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Update profile (Self)
router.patch('/profile', authenticate, async (req: any, res) => {
  const { first_name, last_name, email, password } = req.body;
  const userId = req.user.id;

  try {
    let sql = 'UPDATE users SET first_name = ?, last_name = ?, email = ?';
    const params = [first_name, last_name, email];

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      sql += ', password_hash = ?';
      params.push(password_hash);
    }

    sql += ' WHERE id = ?';
    params.push(userId);

    db.run(sql, params);

    // Fetch updated user
    const updatedUser = db.get('SELECT id, school_id, first_name, last_name, email, role FROM users WHERE id = ?', [userId]);

    // Log action
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, 'PROFILE_UPDATE', `User updated their own profile settings.`]
    );

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// User Management: Get all users (Admin only)
router.get('/users', authenticate, authorize(['admin']), (req, res) => {
  try {
    const users = db.all('SELECT id, school_id, first_name, last_name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// User Management: Edit user role or details (Admin only)
router.patch('/users/:id', authenticate, authorize(['admin']), async (req: any, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, role, school_id, password } = req.body;

  try {
    let sql = 'UPDATE users SET first_name = ?, last_name = ?, email = ?, role = ?, school_id = ?';
    const params = [first_name, last_name, email, role, school_id];

    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      sql += ', password_hash = ?';
      params.push(password_hash);
    }

    sql += ' WHERE id = ?';
    params.push(id);

    db.run(sql, params);

    // Log action
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'USER_UPDATED', `Admin updated user with ID ${id} (${email})`]
    );

    res.json({ message: 'User updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// User Management: Delete user (Admin only)
router.delete('/users/:id', authenticate, authorize(['admin']), (req: any, res) => {
  const { id } = req.params;
  try {
    const userToDelete = db.get('SELECT email FROM users WHERE id = ?', [id]);
    db.run('DELETE FROM users WHERE id = ?', [id]);

    // Log action
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'USER_DELETED', `Admin deleted user with ID ${id} (${userToDelete?.email || 'unknown'})`]
    );

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Register
router.post('/register', async (req, res) => {
  const { school_id, first_name, last_name, email, password, role } = req.body;

  try {
    const existingUser = db.get('SELECT * FROM users WHERE school_id = ? OR email = ?', [school_id, email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (school_id, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      [school_id, first_name, last_name, email, password_hash, role]
    );

    // Log action
    db.run(
      'INSERT INTO audit_logs (action, details) VALUES (?, ?)',
      ['USER_REGISTERED', `New account registered: ${email} as ${role}`]
    );

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier can be school_id or email

  try {
    const user = db.get('SELECT * FROM users WHERE school_id = ? OR email = ?', [identifier, identifier]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Log login action
    db.run(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'USER_LOGIN', `Successful sign-in for ${user.email}`]
    );

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
