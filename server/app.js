import "dotenv/config";
import express from "express";
import cors from "cors";
import { createStore } from "./store/index.js";
import { requireAuth, signToken } from "./middleware/auth.js";
import { calculateInvoice, exportCsv, exportExcelBase64 } from "./utils/reports.js";
import { randomUUID } from "crypto";

const app = express();
const store = await createStore();

let seedError = null;
let seedStatus = "not-run";
try {
  const maruthiUser = await store.findUser("maruthi");
  if (!maruthiUser) {
    seedStatus = "attempting-seed";
    const passwordHash = "$2b$10$CcNhjNItY/2KVDM.P.Rv8ulmM9nLnJrxu80cY6NEwdNkRAGMyn5Su";
    if (store.kind === "postgres") {
      await store.pool.query(
        "insert into users (id, name, username, role, password_hash) values ($1, $2, $3, $4, $5)",
        [randomUUID(), "Maruthi", "maruthi", "admin", passwordHash]
      );
      seedStatus = "seeded-postgres";
      console.log("Seeded default 'maruthi' user to postgres.");
    }
  } else {
    seedStatus = "user-exists";
  }
} catch (err) {
  seedError = err.message;
  seedStatus = "error";
  console.error("Error seeding default user:", err);
}

const allowedOrigins = (process.env.CLIENT_URL || process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return callback(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/i.test(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked request from ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

app.get("/api/health", asyncRoute(async (_req, res) => {
  const database = await store.health?.();
  res.json({
    ok: true,
    database: store.kind,
    databaseStatus: database?.ok ? "connected" : "not-connected",
    databaseError: database?.ok ? undefined : database?.message,
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
}));

app.get("/api/debug-users", asyncRoute(async (_req, res) => {
  try {
    if (store.kind === "local-file") {
      res.json({ users: (store.db?.users || []).map(u => ({ username: u.username, role: u.role })), seedStatus, seedError });
    } else {
      const list = await store.many("select username, role from users");
      res.json({ users: list, seedStatus, seedError });
    }
  } catch (err) {
    res.status(500).json({ error: err.message, seedStatus, seedError });
  }
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "").trim();

  const user = await store.findUser(username);

  if (!user || !(await store.verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role
  };

  res.json({
    token: signToken(safeUser),
    user: safeUser
  });
}));

app.use("/api", requireAuth);

app.get("/api/shop", (_req, res) => {
  res.json({
    name: process.env.SHOP_NAME || "SRI ANJANEYA AGRO AGENCIES",
    legalName: process.env.SHOP_LEGAL_NAME || "JUNJI MARUTHI",
    address: process.env.SHOP_ADDRESS || "Shri Shiva nilaya Hale kunduvada Davangere\nHale kunduvada\nDAVANAGERE, KARNATAKA 577566\nIndia",
    gstin: process.env.SHOP_GSTIN || "29ANHPM1365Q1ZA",
    phone: process.env.SHOP_PHONE || "9900389992"
  });
});

app.get("/api/dashboard", asyncRoute(async (_req, res) => {
  res.json(await store.dashboard());
}));

for (const resource of ["products", "customers", "suppliers"]) {
  app.get(`/api/${resource}`, asyncRoute(async (req, res) => {
    res.json(await store.list(resource, req.query));
  }));

  app.post(`/api/${resource}`, asyncRoute(async (req, res) => {
    res.status(201).json(await store.create(resource, req.body, req.user));
  }));

  app.put(`/api/${resource}/:id`, asyncRoute(async (req, res) => {
    res.json(await store.update(resource, req.params.id, req.body, req.user));
  }));

  app.delete(`/api/${resource}/:id`, asyncRoute(async (req, res) => {
    await store.remove(resource, req.params.id);
    res.status(204).end();
  }));
}

app.post("/api/products/:id/adjust-stock", asyncRoute(async (req, res) => {
  res.json(await store.adjustStock(req.params.id, req.body, req.user));
}));

app.get("/api/sales", asyncRoute(async (req, res) => {
  res.json(await store.listSales(req.query));
}));

app.get("/api/sales/:id", asyncRoute(async (req, res) => {
  const sale = await store.getSale(req.params.id);
  if (!sale) return res.status(404).json({ message: "Invoice not found" });
  res.json(sale);
}));

app.post("/api/sales", asyncRoute(async (req, res) => {
  const preview = await calculateInvoice(req.body.items || [], store);
  res.status(201).json(await store.createSale({ ...req.body, ...preview }, req.user));
}));

app.get("/api/purchases", asyncRoute(async (req, res) => {
  res.json(await store.listPurchases(req.query));
}));

app.post("/api/purchases", asyncRoute(async (req, res) => {
  res.status(201).json(await store.createPurchase(req.body, req.user));
}));

app.get("/api/payments", asyncRoute(async (req, res) => {
  res.json(await store.list("payments", req.query));
}));

app.post("/api/payments", asyncRoute(async (req, res) => {
  res.status(201).json(await store.createPayment(req.body, req.user));
}));

app.get("/api/stock/logs", asyncRoute(async (req, res) => {
  res.json(await store.stockLogs(req.query));
}));

app.get("/api/reports/:type", asyncRoute(async (req, res) => {
  const report = await store.report(req.params.type, req.query);
  if (req.query.format === "csv") {
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${req.params.type}.csv`);
    return res.send(exportCsv(report.rows));
  }
  if (req.query.format === "excel") {
    return res.json({ filename: `${req.params.type}.xlsx`, content: exportExcelBase64(report.rows) });
  }
  res.json(report);
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Something went wrong" });
});

export default app;
