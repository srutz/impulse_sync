
import { consola } from "consola";
import { PoolClient } from "pg";
import { pool } from "./db";
import { config, SyncTable } from "./config";
import QueryStream from "pg-query-stream";
import { getSyncMarker, setSyncMarker } from "./syncmarkers";



export async function runAllSyncs() {
  consola.info("Starting full sync...");

  const client = await pool!.connect();
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
  if (!table.enabled) {
    consola.info(`Skipping disabled sync: ${table.tableKey}`);
    return;
  }
  consola.info(`Running sync: ${table.tableKey} with query: ${table.query}`);

  let rowCount = 0;

  let syncMarker = await getSyncMarker(table.tableKey);
  if (!syncMarker) {
    switch (table.syncType) {
      case "full":
        /* do nothing, sync all rows */
        break;
      case "timestamp":
        syncMarker = new Date(0).toISOString(); // 24 hours ago
        break;
      case "id_increment":
        syncMarker = "0"; // Start from ID 0
        break;
      default:
        const exhaustiveCheck: never = table.syncType;
        throw new Error(`Unhandled sync type: ${exhaustiveCheck}`);
    }
  }

  switch (table.syncType) {
    case "full":
      consola.info(`Full sync`);
      break;
    case "timestamp":
      consola.info(`Using sync marker (timestamp): ${syncMarker}`);
      break;
    case "id_increment":
      consola.info(`Using sync marker (id_increment): ${syncMarker}`);
      break;
    default:
      const exhaustiveCheck: never = table.syncType;
      throw new Error(`Unhandled sync type: ${exhaustiveCheck}`);
  }

  let now = new Date();
  let maxId = -1;
  try {
    const params: any[] = [];
    if (syncMarker) {
      params.push(syncMarker);
    }
    const query = new QueryStream(table.query, params);
    consola.info(`Executing query for table: ${table.tableKey}`, table.query, params);
    const stream = client.query(query);
    now = new Date();
    for await (const row of stream) {
      if (table.syncType === "id_increment") {
        const id = parseInt(row[table.primaryKey]);
        if (id > maxId) {
          maxId = id;
        }
      }
      consola.log("Processing row" + JSON.stringify(row));
      rowCount++;
      if (rowCount % 1000 === 0) {
        consola.info(`Processed ${rowCount} rows for table: ${table.tableKey}`);
      }
    }
  } finally {
    consola.info(`Completed sync for table: ${table.tableKey}`);
  }

  switch (table.syncType) {
    case "timestamp":
      if (rowCount > 0) {
        const newMarker = now.toISOString();
        consola.info(`Updating sync marker for ${table.tableKey} to ${newMarker}`);
        setSyncMarker(table.tableKey, newMarker);
      }
      break;
    case "id_increment":
      if (rowCount > 0) {
        const newMarker = maxId.toString();
        consola.info(`Updating sync marker for ${table.tableKey} to ${newMarker}`);
        setSyncMarker(table.tableKey, newMarker);
      }
      break;
    case "full":
      /* no sync marker to update */
      break;
    default:
      const exhaustiveCheck: never = table.syncType;
      throw new Error(`Unhandled sync type: ${exhaustiveCheck}`);
  }

  consola.info(`Table ${table.tableKey} synced, total rows: ${rowCount}`);
}

