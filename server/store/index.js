import bcrypt from "bcryptjs";
import { FileStore } from "./fileStore.js";
import { PostgresStore } from "./postgresStore.js";

export async function createStore() {
  if (process.env.VERCEL === "1" && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required on Vercel so sales, purchases, and stock changes are saved in PostgreSQL.");
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
