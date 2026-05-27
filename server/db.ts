import SQLiteDatabase from 'better-sqlite3';
import path from 'path';

export class Database {
  private db: any;
  private static instance: Database;

  constructor() {
    this.db = new SQLiteDatabase('ustp_ict.db');
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async init() {
    // 1. USERS TABLE
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('student', 'faculty_staff', 'admin')) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. INVENTORY TABLE
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_tag TEXT UNIQUE NOT NULL,
        item_name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        status TEXT CHECK(status IN ('functional', 'defective', 'under_repair', 'disposed')) DEFAULT 'functional',
        damage_price REAL DEFAULT 0.00,
        location TEXT,
        property_number TEXT,
        brand TEXT,
        model TEXT,
        serial_number TEXT,
        condition TEXT DEFAULT 'Good',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Safely apply ALTERS for existing DB schemas (for seamless upgrades)
    const alterTable = (table: string, column: string, definition: string) => {
      try {
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        console.log(`Column ${column} added to ${table} successfully.`);
      } catch (e) {
        // Ignored if column already exists
      }
    };

    alterTable('inventory', 'property_number', 'TEXT');
    alterTable('inventory', 'brand', 'TEXT');
    alterTable('inventory', 'model', 'TEXT');
    alterTable('inventory', 'serial_number', 'TEXT');
    alterTable('inventory', 'condition', "TEXT DEFAULT 'Good'");

    // 3. SERVICE REQUESTS TABLE
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS service_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        request_type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT CHECK(status IN ('pending', 'approved', 'in_progress', 'resolved', 'rejected')) DEFAULT 'pending',
        category TEXT,
        service_type TEXT,
        file_attachment TEXT,
        tracking_number TEXT,
        technician_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    alterTable('service_requests', 'category', 'TEXT');
    alterTable('service_requests', 'service_type', 'TEXT');
    alterTable('service_requests', 'file_attachment', 'TEXT');
    alterTable('service_requests', 'tracking_number', 'TEXT');
    alterTable('service_requests', 'technician_name', 'TEXT');

    // 4. JOB ORDERS TABLE
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS job_orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_request_id INTEGER NOT NULL,
        assigned_admin_id INTEGER,
        task_details TEXT,
        status TEXT CHECK(status IN ('open', 'in_progress', 'completed')) DEFAULT 'open',
        resolution_remarks TEXT,
        completion_date TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_request_id) REFERENCES service_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_admin_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    alterTable('job_orders', 'resolution_remarks', 'TEXT');
    alterTable('job_orders', 'completion_date', 'TEXT');

    // 5. FACILITY BOOKINGS TABLE
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS facility_bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        facility_name TEXT CHECK(facility_name IN ('ComLab 1', 'ComLab 2', 'ComLab 3', 'AVR')) NOT NULL,
        purpose TEXT NOT NULL,
        start_datetime TEXT NOT NULL,
        end_datetime TEXT NOT NULL,
        status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 6. INCIDENTS TABLE
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reported_by_admin_id INTEGER NOT NULL,
        liable_user_id INTEGER NOT NULL,
        inventory_id INTEGER,
        incident_date TEXT NOT NULL,
        description TEXT NOT NULL,
        liability_amount REAL DEFAULT 0.00,
        payment_status TEXT CHECK(payment_status IN ('pending', 'settled', 'not_applicable')) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reported_by_admin_id) REFERENCES users(id),
        FOREIGN KEY (liable_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE SET NULL
      )
    `);

    // 7. NOTIFICATIONS TABLE
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 8. AUDIT LOGS TABLE
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    console.log("Database initialized successfully");
  }

  get(sql: string, params: any[] = []) {
    return this.db.prepare(sql).get(...params);
  }

  all(sql: string, params: any[] = []) {
    return this.db.prepare(sql).all(...params);
  }

  run(sql: string, params: any[] = []) {
    return this.db.prepare(sql).run(...params);
  }
}
