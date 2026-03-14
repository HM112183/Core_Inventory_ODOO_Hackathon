// Frontend\server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("Backend/inventory.db");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    role TEXT,
    avatarUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS otps (
    email TEXT,
    code TEXT,
    expires_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT,
    sku TEXT UNIQUE,
    category TEXT,
    uom TEXT,
    reorderLevel INTEGER,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT PRIMARY KEY,
    name TEXT,
    location TEXT,
    parentId TEXT,
    type TEXT DEFAULT 'Warehouse'
  );

  CREATE TABLE IF NOT EXISTS stock (
    productId TEXT,
    warehouseId TEXT,
    quantity INTEGER,
    PRIMARY KEY (productId, warehouseId)
  );

  CREATE TABLE IF NOT EXISTS operations (
    id TEXT PRIMARY KEY,
    type TEXT,
    status TEXT,
    date TEXT,
    fromWarehouseId TEXT,
    toWarehouseId TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS operation_items (
    operationId TEXT,
    productId TEXT,
    quantity INTEGER
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: "Authentication token required" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        console.error("JWT Verification Error:", err.message);
        return res.status(403).json({ error: "Invalid or expired session" });
      }
      req.user = user;
      next();
    });
  };

  const authorizeRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }
      next();
    };
  };

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const id = uuidv4();
      db.prepare("INSERT INTO users (id, email, password, name, role) VALUES (?, ?, ?, ?, ?)").run(id, email, hashedPassword, name, role || "Staff");
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "User already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name, avatarUrl: user.avatarUrl }, JWT_SECRET);
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name, avatarUrl: user.avatarUrl } });
  });

  app.post("/api/auth/reset-request", (req, res) => {
    const { email } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    
    if (!user) {
      return res.status(404).json({ error: "No account found with this email address" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare("DELETE FROM otps WHERE email = ?").run(email);
    db.prepare("INSERT INTO otps (email, code, expires_at) VALUES (?, ?, ?)").run(email, code, expires);
    
    console.log("\n" + "=".repeat(40));
    console.log(`🔑 PASSWORD RESET CODE FOR: ${email}`);
    console.log(`👉 CODE: ${code}`);
    console.log("=".repeat(40) + "\n");

    res.json({ success: true, message: "Verification code generated. Check your server terminal/console to see the code." });
  });

  app.post("/api/auth/reset-verify", async (req, res) => {
    const { email, code, newPassword } = req.body;
    const otp = db.prepare("SELECT * FROM otps WHERE email = ? AND code = ?").get(email, code) as any;
    
    if (!otp) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    if (new Date(otp.expires_at) < new Date()) {
      return res.status(400).json({ error: "Verification code has expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashedPassword, email);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    db.prepare("DELETE FROM otps WHERE email = ?").run(email);
    res.json({ success: true });
  });

  // IMS Routes (Protected)
  app.get("/api/dashboard", authenticateToken, (req, res) => {
    try {
      const totalProducts = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
      const totalStock = db.prepare("SELECT SUM(quantity) as count FROM stock").get() as any;
      const lowStockItems = db.prepare(`
        SELECT COUNT(*) as count FROM products p
        LEFT JOIN (SELECT productId, SUM(quantity) as total FROM stock GROUP BY productId) s ON p.id = s.productId
        WHERE COALESCE(s.total, 0) <= p.reorderLevel
      `).get() as any;
      const pendingReceipts = db.prepare("SELECT COUNT(*) as count FROM operations WHERE type = 'Receipt' AND status = 'Waiting'").get() as any;
      const pendingDeliveries = db.prepare("SELECT COUNT(*) as count FROM operations WHERE type = 'Delivery' AND status = 'Waiting'").get() as any;

      res.json({
        totalProducts: totalProducts?.count || 0,
        totalStock: totalStock?.count || 0,
        lowStockItems: lowStockItems?.count || 0,
        pendingReceipts: pendingReceipts?.count || 0,
        pendingDeliveries: pendingDeliveries?.count || 0
      });
    } catch (error) {
      console.error("Dashboard API Error:", error);
      res.status(500).json({ error: "Internal server error fetching dashboard data" });
    }
  });

  app.get("/api/products", authenticateToken, (req, res) => {
    res.json(db.prepare("SELECT * FROM products").all());
  });

  app.post("/api/products", authenticateToken, authorizeRole(["Admin", "Manager"]), (req, res) => {
    const { name, sku, category, uom, reorderLevel, description } = req.body;
    const id = uuidv4();
    db.prepare("INSERT INTO products (id, name, sku, category, uom, reorderLevel, description) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, name, sku, category, uom, reorderLevel, description);
    res.json({ id, name, sku });
  });

  app.get("/api/stock", authenticateToken, (req, res) => {
    const stocks = db.prepare(`
      SELECT s.*, p.name as productName, p.sku as productSku, w.name as warehouseName 
      FROM stock s
      JOIN products p ON s.productId = p.id
      JOIN warehouses w ON s.warehouseId = w.id
    `).all() as any[];
    
    res.json(stocks.map(s => ({
      productId: s.productId,
      warehouseId: s.warehouseId,
      quantity: s.quantity,
      product: { name: s.productName, sku: s.productSku },
      warehouse: { name: s.warehouseName }
    })));
  });

  app.get("/api/operations", authenticateToken, (req, res) => {
    const ops = db.prepare("SELECT * FROM operations ORDER BY date DESC").all() as any[];
    const opsWithItems = ops.map(op => {
      const items = db.prepare("SELECT * FROM operation_items WHERE operationId = ?").all(op.id);
      return { ...op, items };
    });
    res.json(opsWithItems);
  });

  app.post("/api/operations", authenticateToken, (req, res) => {
    const { type, status, fromWarehouseId, toWarehouseId, items, description } = req.body;
    
    if (type === "Adjustment" && !["Admin", "Manager"].includes((req as any).user.role)) {
      return res.status(403).json({ error: "Insufficient permissions for adjustments" });
    }

    const id = uuidv4();
    const date = new Date().toISOString();

    db.transaction(() => {
      db.prepare("INSERT INTO operations (id, type, status, date, fromWarehouseId, toWarehouseId, description) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, type, status, date, fromWarehouseId, toWarehouseId, description);
      
      for (const item of items) {
        db.prepare("INSERT INTO operation_items (operationId, productId, quantity) VALUES (?, ?, ?)").run(id, item.productId, item.quantity);
        
        if (status === "Done") {
          if (type === "Receipt") {
            db.prepare("INSERT INTO stock (productId, warehouseId, quantity) VALUES (?, ?, ?) ON CONFLICT(productId, warehouseId) DO UPDATE SET quantity = quantity + ?").run(item.productId, toWarehouseId, item.quantity, item.quantity);
          } else if (type === "Delivery") {
            db.prepare("UPDATE stock SET quantity = quantity - ? WHERE productId = ? AND warehouseId = ?").run(item.quantity, item.productId, fromWarehouseId);
          } else if (type === "Internal") {
            db.prepare("UPDATE stock SET quantity = quantity - ? WHERE productId = ? AND warehouseId = ?").run(item.quantity, item.productId, fromWarehouseId);
            db.prepare("INSERT INTO stock (productId, warehouseId, quantity) VALUES (?, ?, ?) ON CONFLICT(productId, warehouseId) DO UPDATE SET quantity = quantity + ?").run(item.productId, toWarehouseId, item.quantity, item.quantity);
          } else if (type === "Adjustment") {
            db.prepare("INSERT INTO stock (productId, warehouseId, quantity) VALUES (?, ?, ?) ON CONFLICT(productId, warehouseId) DO UPDATE SET quantity = ?").run(item.productId, toWarehouseId, item.quantity, item.quantity);
          }
        }
      }
    })();

    res.json({ id });
  });

  app.get("/api/warehouses", authenticateToken, (req, res) => {
    res.json(db.prepare("SELECT * FROM warehouses").all());
  });

  app.post("/api/warehouses", authenticateToken, authorizeRole(["Admin"]), (req, res) => {
    const { name, location, parentId, type } = req.body;
    const id = uuidv4();
    db.prepare("INSERT INTO warehouses (id, name, location, parentId, type) VALUES (?, ?, ?, ?, ?)").run(id, name, location, parentId || null, type || 'Warehouse');
    res.json({ id, name, location, parentId, type });
  });

  app.delete("/api/warehouses/:id", authenticateToken, authorizeRole(["Admin"]), (req, res) => {
    // Check if it has children
    const children = db.prepare("SELECT COUNT(*) as count FROM warehouses WHERE parentId = ?").get(req.params.id) as any;
    if (children.count > 0) {
      return res.status(400).json({ error: "Cannot delete warehouse with sub-locations. Delete children first." });
    }
    db.prepare("DELETE FROM warehouses WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/alerts", authenticateToken, (req, res) => {
    const lowStock = db.prepare(`
      SELECT p.name, p.sku, SUM(s.quantity) as total, p.reorderLevel
      FROM products p
      JOIN stock s ON p.id = s.productId
      GROUP BY p.id
      HAVING total <= p.reorderLevel
    `).all() as any[];

    const pendingOps = db.prepare(`
      SELECT id, type, date, description
      FROM operations
      WHERE status = 'Waiting'
      ORDER BY date ASC
    `).all() as any[];

    res.json({ lowStock, pendingOps });
  });

  app.get("/api/users", authenticateToken, authorizeRole(["Admin"]), (req, res) => {
    res.json(db.prepare("SELECT id, email, name, role, avatarUrl FROM users").all());
  });

  app.patch("/api/profile", authenticateToken, (req, res) => {
    const { name, avatarUrl } = req.body;
    const userId = (req as any).user.id;
    db.prepare("UPDATE users SET name = ?, avatarUrl = ? WHERE id = ?").run(name, avatarUrl, userId);
    const user = db.prepare("SELECT id, email, name, role, avatarUrl FROM users WHERE id = ?").get(userId);
    res.json(user);
  });

  app.patch("/api/users/:id/role", authenticateToken, authorizeRole(["Admin"]), (req, res) => {
    const { role } = req.body;
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/auth/change-password", authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ error: "Current password incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(hashedNewPassword, userId);
    res.json({ success: true });
  });

  app.delete("/api/users/:id", authenticateToken, authorizeRole(["Admin"]), (req, res) => {
    // Prevent self-deletion
    if (req.params.id === (req as any).user.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Seed initial data if empty
  const whCount = db.prepare("SELECT COUNT(*) as count FROM warehouses").get() as any;
  const prodCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
  
  if (whCount.count === 0) {
    db.prepare("INSERT INTO warehouses (id, name, location) VALUES (?, ?, ?)").run("w1", "Main Warehouse", "North Wing");
    db.prepare("INSERT INTO warehouses (id, name, location) VALUES (?, ?, ?)").run("w2", "Production Floor", "East Wing");
  }

  if (prodCount.count === 0) {
    // Seed some products
    const p1 = uuidv4();
    const p2 = uuidv4();
    db.prepare("INSERT INTO products (id, name, sku, category, uom, reorderLevel, description) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      p1, "Steel Beam I-Section", "SB-001", "Raw Materials", "Units", 10, "Standard industrial steel beam"
    );
    db.prepare("INSERT INTO products (id, name, sku, category, uom, reorderLevel, description) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      p2, "Copper Wiring 10m", "CW-010", "Electronics", "Rolls", 5, "High conductivity copper wire"
    );

    // Seed some stock
    db.prepare("INSERT INTO stock (productId, warehouseId, quantity) VALUES (?, ?, ?)").run(p1, "w1", 25);
    db.prepare("INSERT INTO stock (productId, warehouseId, quantity) VALUES (?, ?, ?)").run(p2, "w1", 3); // Low stock
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "Frontend", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
