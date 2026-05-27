import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { Database } from "./server/db";
import authRoutes from "./server/routes/auth";
import inventoryRoutes from "./server/routes/inventory";
import requestRoutes from "./server/routes/requests";
import bookingRoutes from "./server/routes/bookings";
import incidentRoutes from "./server/routes/incidents";
import jobOrderRoutes from "./server/routes/job-orders";
import notificationRoutes from "./server/routes/notifications";
import auditLogRoutes from "./server/routes/logs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  const db = Database.getInstance();
  await db.init();

  // Seed Admin and Faculty if no users exist
  const userCount = db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    const bcrypt = await import('bcryptjs');
    const adminPassword = await bcrypt.default.hash('admin123', 10);
    const facultyPassword = await bcrypt.default.hash('faculty123', 10);
    
    // Seed Admin
    db.run(
      'INSERT INTO users (school_id, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['2024-0001', 'ICT', 'Admin', 'admin@ustp.edu.ph', adminPassword, 'admin']
    );
    // Seed Faculty/Staff
    db.run(
      'INSERT INTO users (school_id, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['2024-0002', 'Maria', 'Santos', 'faculty@ustp.edu.ph', facultyPassword, 'faculty_staff']
    );
    
    console.log('Seeded initial users:');
    console.log('1. Admin: admin@ustp.edu.ph / admin123');
    console.log('2. Faculty: faculty@ustp.edu.ph / faculty123');

    // Seed initial inventory items
    db.run(
      `INSERT INTO inventory (asset_tag, item_name, description, category, status, damage_price, location, property_number, brand, model, serial_number, condition)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['AST-001', 'Dell OptiPlex 3080 Desktop', 'Intel i5, 8GB RAM, 256GB SSD', 'Hardware', 'functional', 25000, 'ComLab 1', 'PROP-2024-1001', 'Dell', 'OptiPlex 3080', 'SN-DELL-98712', 'Good']
    );
    db.run(
      `INSERT INTO inventory (asset_tag, item_name, description, category, status, damage_price, location, property_number, brand, model, serial_number, condition)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['AST-002', 'Epson L3210 InkTank Printer', 'Color Ink Tank Multifunction Printer', 'Hardware', 'defective', 9500, 'AVR', 'PROP-2024-1002', 'Epson', 'L3210', 'SN-EPS-11234', 'Defective']
    );
    db.run(
      `INSERT INTO inventory (asset_tag, item_name, description, category, status, damage_price, location, property_number, brand, model, serial_number, condition)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['AST-003', 'Cisco Catalyst 2960 Switch', '24 Port GigE Switch', 'Network', 'functional', 35000, 'ComLab 3', 'PROP-2024-1003', 'Cisco', '2960', 'SN-CISCO-88123', 'Good']
    );

    // Seed initial requests and bookings
    db.run(
      `INSERT INTO service_requests (user_id, request_type, description, status, category, service_type, tracking_number)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [2, 'Hardware', 'Epson Printer in AVR needs maintenance', 'pending', 'Hardware Services', 'Printer Maintenance', 'REQ-2026-6182']
    );
  }

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/bookings", bookingRoutes);
  app.use("/api/incidents", incidentRoutes);
  app.use("/api/job-orders", jobOrderRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/logs", auditLogRoutes);

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "USTP ICT System API is running" });
  });

  // TODO: Add Auth, Inventory, Bookings routes

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
