import bcrypt from "bcryptjs";
import { FileStore } from "./fileStore.js";
import { PostgresStore } from "./postgresStore.js";

export async function createStore() {
  const useDatabase = process.env.USE_DATABASE === "1" && process.env.DATABASE_URL;
  const store = useDatabase
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
