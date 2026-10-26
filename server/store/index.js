import bcrypt from "bcryptjs";
import { FileStore } from "./fileStore.js";
import { PostgresStore } from "./postgresStore.js";

export async function createStore() {
  const dbUrl = process.env.PROD_DATABASE_URL || process.env.DATABASE_URL;
  const useDatabase = (process.env.USE_PROD_DATABASE === "1" || process.env.USE_DATABASE === "1") && dbUrl;
  const store = useDatabase
    ? new PostgresStore(dbUrl)
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
