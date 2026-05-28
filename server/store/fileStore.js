import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { round } from "../utils/reports.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.resolve(__dirname, "../data/store.json");

const isVercel = process.env.VERCEL === "1";

export class FileStore {
  kind = "local-file";

  async init() {
    try {
      await fs.mkdir(path.dirname(dataPath), { recursive: true });

      try {
        this.db = JSON.parse(await fs.readFile(dataPath, "utf8"));
      } catch {
        this.db = {
          users: [],
          products: [],
          customers: [],
          suppliers: [],
          sales: [],
          sale_items: [],
          purchases: [],
          purchase_items: [],
          payments: [],
          stock_logs: []
        };

        await this.seed();

        if (!isVercel) {
          await this.persist();
        }
      }
    } catch (err) {
      console.error("Store init error:", err);

      this.db = {
        users: [],
        products: [],
        customers: [],
        suppliers: [],
        sales: [],
        sale_items: [],
        purchases: [],
        purchase_items: [],
        payments: [],
        stock_logs: []
      };

      await this.seed();
    }
  }

  async persist() {
    if (isVercel) return;
    await fs.writeFile(dataPath, JSON.stringify(this.db, null, 2));
  }

  async seed() {
    if (this.db.users.length) return;

    this.db.users.push(
      {
        id: randomUUID(),
        name: "Admin",
        username: "admin",
        role: "admin",
        password_hash: await bcrypt.hash("admin123", 10)
      },
      {
        id: randomUUID(),
        name: "Billing Staff",
        username: "staff",
        role: "staff",
        password_hash: await bcrypt.hash("staff123", 10)
      }
    );
  }

  async findUser(username) {
    return this.db.users.find(
      user => user.username === username
    );
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }
}
