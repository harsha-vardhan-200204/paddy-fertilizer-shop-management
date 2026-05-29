import bcrypt from "bcryptjs";
import { FileStore } from "./fileStore.js";
import { PostgresStore } from "./postgresStore.js";

export async function createStore() {
  if (process.env.VERCEL === "1" && !process.env.DATABASE_URL) {
    const store = new MissingDatabaseStore();
    store.verifyPassword = verifyPassword;
    return store;
  }

  const store = process.env.DATABASE_URL
    ? new PostgresStore(process.env.DATABASE_URL)
    : new FileStore();
  await store.init();
  store.verifyPassword = verifyPassword;
  return store;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

class MissingDatabaseStore {
  kind = "missing-database";

  fail() {
    throw Object.assign(
      new Error("Database is not configured. Add DATABASE_URL in Vercel environment variables so stock and invoices are saved permanently."),
      { status: 503 }
    );
  }

  async init() {}
  async health() {
    return { ok: false, message: "DATABASE_URL is missing in Vercel environment variables." };
  }
  async findUser() { this.fail(); }
  async list() { this.fail(); }
  async getById() { this.fail(); }
  async create() { this.fail(); }
  async update() { this.fail(); }
  async remove() { this.fail(); }
  async adjustStock() { this.fail(); }
  async listSales() { this.fail(); }
  async getSale() { this.fail(); }
  async createSale() { this.fail(); }
  async listPurchases() { this.fail(); }
  async createPurchase() { this.fail(); }
  async createPayment() { this.fail(); }
  async stockLogs() { this.fail(); }
  async dashboard() { this.fail(); }
  async report() { this.fail(); }
}
