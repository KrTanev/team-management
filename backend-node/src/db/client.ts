import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import { DATABASE_URL } from "../config.js";

// Counts SQL statements per request. Exposed as the `X-Query-Count` response
// header when BD_DEBUG_QUERIES=1 (always on in test mode) — the checks use it.
export const queryCounter = new AsyncLocalStorage<{ count: number }>();

const sqlite = new DatabaseSync(DATABASE_URL);
sqlite.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");

function counted() {
  const store = queryCounter.getStore();
  if (store) store.count += 1;
}

/**
 * A thin wrapper over Node's built-in SQLite (`node:sqlite`) — plain SQL with
 * bound parameters. Swap in an ORM or query builder if you like; keep the
 * query counting.
 */
export const db = {
  all<T>(sql: string, ...params: SQLInputValue[]): T[] {
    counted();
    return sqlite.prepare(sql).all(...params) as T[];
  },
  get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
    counted();
    return sqlite.prepare(sql).get(...params) as T | undefined;
  },
  run(sql: string, ...params: SQLInputValue[]) {
    counted();
    return sqlite.prepare(sql).run(...params);
  },
  transaction<T>(fn: () => T): T {
    sqlite.exec("BEGIN");
    try {
      const result = fn();
      sqlite.exec("COMMIT");
      return result;
    } catch (err) {
      sqlite.exec("ROLLBACK");
      throw err;
    }
  },
};

const DDL = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

export function createTables(): void {
  sqlite.exec(DDL);
}

export function dropTables(): void {
  const tables = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
    .all() as { name: string }[];
  sqlite.exec("PRAGMA foreign_keys = OFF");
  for (const { name } of tables) sqlite.exec(`DROP TABLE IF EXISTS "${name}"`);
  sqlite.exec("PRAGMA foreign_keys = ON");
}
