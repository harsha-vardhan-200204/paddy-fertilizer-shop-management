import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createStore } from "../store/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.resolve(__dirname, "../data/store.json");

try {
  await fs.rm(storePath);
} catch (_error) {
  // The store may not exist yet.
}

const store = await createStore();
console.log(`Seeded ${store.kind} data store.`);
