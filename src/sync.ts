
import { consola } from "consola";
import { PoolClient } from "pg";
import { pool } from "./db";
import { config, SyncTable } from "./config";

if (!config) {
  consola.fatal("Config not initialized");
  process.exit(1);
}

export async function runAllSyncs() {
  consola.info("Starting full sync...");

  const client = await pool.connect();
  try {
    // Placeholder: Fetch sync tables from config
    const syncTables = config!.syncTables;

    for (const table of syncTables) {
      const t0 = new Date().getTime();
      consola.info(`Syncing table: ${table.tableKey}`);
      await syncSingleTable(client, table);
      const t1 = new Date().getTime();
      const dt = t1 - t0;
      consola.success(`Finished syncing table: ${table.tableKey} in ${(t1 - t0)}ms`);
    }
  } finally {
    client.release();
  }
}


async function syncSingleTable(client: PoolClient, table: SyncTable) {
  const result = await client.query(table.query, [0]);
  consola.info(`Table ${table.tableKey} synced, rows affected: ${result.rowCount}`);
}

