
import { consola } from "consola";
import { PoolClient } from "pg";
import { pool } from "./db";
import { config, SyncTable } from "./config";
import QueryStream from "pg-query-stream";
import { getSyncMarker, setSyncMarker } from "./syncmarkers";
import { ParquetWriter, ParquetSchema } from "parquetjs";
import { mkdir, readdir } from "fs/promises";
import { join } from "path";
import { LANDING_ZONE_DIR } from "./paths";



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
  consola.success("All syncs completed.");
}


async function syncSingleTable(client: PoolClient, table: SyncTable) {
  if (!table.enabled) {
    consola.info(`Skipping disabled sync: ${table.tableKey}`);
    return;
  }
  consola.info(`Running sync: ${table.tableKey} with query: ${table.query}`);

  let rowCount = 0;

  // Ensure landing zone directory exists
  const tableLandingZone = join(LANDING_ZONE_DIR, table.tableKey);
  await mkdir(tableLandingZone, { recursive: true });

  // Get next file number
  const nextFileNumber = await getNextFileNumber(tableLandingZone);
  const fileName = `${nextFileNumber.toString().padStart(20, '0')}.parquet`;
  const filePath = join(tableLandingZone, fileName);

  consola.info(`Writing to file: ${filePath}`);

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
  let writer: ParquetWriter | null = null;
  let schema: ParquetSchema | null = null;

  try {
    const params: any[] = [];
    if (syncMarker) {
      params.push(syncMarker);
    }
    const finalQuery = `select * from (${table.query}) AS a1 limit ${table.rowsPerSync || 10_000}`
    const query = new QueryStream(finalQuery, params);
    consola.info(`Executing query for table: ${table.tableKey}`, table.query, params);
    const stream = client.query(query);
    now = new Date();

    for await (const row of stream) {
      // Initialize schema and writer on first row
      if (!schema) {
        schema = createSchemaFromRow(row);
        writer = await ParquetWriter.openFile(schema, filePath);
      }

      if (table.syncType === "id_increment") {
        const id = parseInt(row[table.primaryKey]);
        if (id > maxId) {
          maxId = id;
        }
      }

      // Add __rowMarker__ column with value 4 (Upsert) as the last column
      const rowWithMarker = { ...row, __rowMarker__: 4 };

      await writer!.appendRow(rowWithMarker);
      rowCount++;

      if (rowCount % 1000 === 0) {
        consola.info(`Processed ${rowCount} rows for table: ${table.tableKey}`);
      }
    }
  } finally {
    if (writer) {
      await writer.close();
      consola.info(`Wrote ${rowCount} rows to ${filePath}`);
    }
    consola.info(`Completed sync for table: ${table.tableKey}`);
  }

  switch (table.syncType) {
    case "timestamp":
      if (rowCount > 0) {
        const newMarker = now.toISOString();
        consola.info(`Updating sync marker for ${table.tableKey} to ${newMarker}`);
        await setSyncMarker(table.tableKey, newMarker);
      }
      break;
    case "id_increment":
      if (rowCount > 0) {
        const newMarker = maxId.toString();
        consola.info(`Updating sync marker for ${table.tableKey} to ${newMarker}`);
        await setSyncMarker(table.tableKey, newMarker);
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

/**
 * Gets the next file number by reading existing files in the landing zone directory
 */
async function getNextFileNumber(landingZoneDir: string): Promise<number> {
  try {
    const files = await readdir(landingZoneDir);
    const parquetFiles = files.filter(f => f.endsWith('.parquet'));

    if (parquetFiles.length === 0) {
      return 1;
    }

    // Extract numbers from file names and find the max
    const numbers = parquetFiles.map(f => {
      const match = f.match(/^(\d+)\.parquet$/);
      return match ? parseInt(match[0], 10) : 0;
    });

    const maxNumber = Math.max(...numbers);
    return maxNumber + 1;
  } catch (error) {
    consola
    // Directory doesn't exist yet
    return 1;
  }
}

/**
 * Creates a Parquet schema from a sample row
 */
function createSchemaFromRow(row: any): ParquetSchema {
  const fields: Record<string, any> = {};

  // Add fields from the row
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { type: 'INT64', optional: true };
      } else {
        fields[key] = { type: 'DOUBLE', optional: true };
      }
    } else if (typeof value === 'boolean') {
      fields[key] = { type: 'BOOLEAN', optional: true };
    } else if (value instanceof Date) {
      fields[key] = { type: 'TIMESTAMP_MILLIS', optional: true };
    } else {
      fields[key] = { type: 'UTF8', optional: true };
    }
  }

  // Add __rowMarker__ as the last field (required by spec)
  fields.__rowMarker__ = { type: 'INT32' };

  return new ParquetSchema(fields);
}

