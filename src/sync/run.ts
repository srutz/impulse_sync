import { consola } from "consola";
import { mkdir, readdir } from "node:fs/promises";
import { ParquetSchema, ParquetWriter } from "parquetjs";
import { join } from "node:path";
import type { PoolClient } from "pg";
import QueryStream from "pg-query-stream";
import { exit } from "node:process";
import { config, type SyncTable } from "../config";
import { FILES_DIR } from "../paths";
import { pool } from "./db";
import { getSyncMarker, setSyncMarker } from "./syncmarkers";

export async function runAllSyncs() {
  consola.info("starting full sync...");

  const client = await pool!.connect();
  try {
    // Placeholder: Fetch sync tables from config
    const syncTables = config!.syncTables;

    for (const table of syncTables) {
      if (table.enabled) {
        const t0 = Date.now();
        consola.info(`sync "${table.tableKey}"`);
        await syncSingleTable(client, table);
        const t1 = Date.now();
        const dt = t1 - t0;
        consola.success(`completed "${table.tableKey}" in ${dt}ms`);
      } else {
        consola.info(`skip "${table.tableKey}"`);
      }
    }
  } finally {
    client.release();
  }
}

async function syncSingleTable(client: PoolClient, table: SyncTable) {
  if (!table.enabled) {
    consola.info(`skipping disabled sync: "${table.tableKey}"`);
    return;
  }
  //consola.info(`Running sync: ${table.tableKey} with query: ${table.query}`);

  let rowCount = 0;

  // Ensure landing zone directory exists
  const tableFilesDirectory = join(FILES_DIR, table.tableKey);
  await mkdir(tableFilesDirectory, { recursive: true });

  // Get next file number
  const nextFileNumber = await getNextFileNumber(tableFilesDirectory);
  const fileName = `${nextFileNumber.toString().padStart(20, "0")}.parquet`;
  const filePath = join(tableFilesDirectory, fileName);

  //consola.info(`Writing to file: ${filePath}`);

  const params: any[] = [];
  {
    const syncMarker = await getSyncMarker(table.tableKey);
    switch (table.syncType) {
      case "full":
        /* do nothing, sync all rows */
        break;
      case "timestamp": {
        const d = syncMarker ? new Date(syncMarker) : new Date(0);
        params.push(d);
        break;
      }
      case "primarykey": {
        const i = syncMarker ? Number.parseInt(syncMarker) : 0;
        params.push(i);
        break;
      }
      default: {
        const exhaustiveCheck: never = table.syncType;
        throw new Error(`Unhandled sync type: ${exhaustiveCheck}`);
      }
    }
  }

  switch (table.syncType) {
    case "full":
      consola.info(`Full sync`);
      break;
    case "timestamp":
      if (!table.timeStampColumn) {
        throw new Error(
          `timeStampColumn is not defined for table ${table.tableKey}`,
        );
      }
      break;
    case "primarykey":
      if (!table.primaryKey) {
        throw new Error(
          `primaryKey is not defined for table ${table.tableKey}`,
        );
      }
      break;
    default: {
      const exhaustiveCheck: never = table.syncType;
      throw new Error(`Unhandled sync type: ${exhaustiveCheck}`);
    }
  }

  let maxTime = new Date(0);
  let maxId = -1;
  let writer: ParquetWriter | null = null;
  let schema: ParquetSchema | null = null;

  try {
    const finalQuery = `select * from (${table.query}) AS a1 limit ${table.rowsPerSync || 100_000_000}`;
    const query = new QueryStream(finalQuery, params);
    consola.info(`query for "${table.tableKey}": ${finalQuery}, ${params}`);
    const stream = client.query(query);

    for await (const row of stream) {
      // Initialize schema and writer on first row
      if (!schema) {
        schema = createSchemaFromRow(row);
        writer = await ParquetWriter.openFile(schema, filePath);
      }

      if (table.syncType === "primarykey") {
        const id = parseInt(row[table.primaryKey!]);
        if (!Number.isInteger(id)) {
          consola.fail(
            `Expected integer for primary key ${table.primaryKey}, got ${row[table.primaryKey!]}`,
          );
          exit(1);
        }
        if (id > maxId) {
          maxId = id;
        }
      } else if (table.syncType === "timestamp") {
        const ts = row[table.timeStampColumn!];
        if (!(ts instanceof Date)) {
          consola.fail(
            `Expected Date object for timestamp column ${table.timeStampColumn}, got ${typeof ts}`,
          );
          exit(1);
        }
        //console.log("ts =", ts, typeof ts);
        if (ts > maxTime) {
          maxTime = ts;
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
      consola.info(`wrote ${rowCount} rows to ${filePath}`);
    }
  }

  switch (table.syncType) {
    case "timestamp":
      if (rowCount > 0) {
        const newMarker = maxTime.toISOString();
        consola.info(`new syncmarker for "${table.tableKey}" = ${newMarker}`);
        await setSyncMarker(table.tableKey, newMarker);
      }
      break;
    case "primarykey":
      if (rowCount > 0) {
        const newMarker = maxId.toString();
        consola.info(`new syncmarker for "${table.tableKey}" = ${newMarker}`);
        await setSyncMarker(table.tableKey, newMarker);
      }
      break;
    case "full":
      /* no sync marker to update */
      break;
    default: {
      const exhaustiveCheck: never = table.syncType;
      throw new Error(`Unhandled sync type: ${exhaustiveCheck}`);
    }
  }
  //consola.info(`Table ${table.tableKey} synced, total rows: ${rowCount}`);
}

/**
 * Gets the next file number by reading existing files in the local directory
 */
async function getNextFileNumber(tableFilesDirectory: string) {
  try {
    const files = await readdir(tableFilesDirectory);
    const parquetFiles = files.filter((f) => f.endsWith(".parquet"));

    if (parquetFiles.length === 0) {
      return 1;
    }

    // Extract numbers from file names and find the max
    const numbers = parquetFiles.map((f) => {
      const match = f.match(/^(\d+)\.parquet$/);
      return match ? parseInt(match[0], 10) : 0;
    });

    const maxNumber = Math.max(...numbers);
    return maxNumber + 1;
  } catch (error) {
    consola.log(`Error reading directory ${tableFilesDirectory}: ${error}`);
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
    if (typeof value === "number") {
      if (Number.isInteger(value)) {
        fields[key] = { type: "INT64", optional: true };
      } else {
        fields[key] = { type: "DOUBLE", optional: true };
      }
    } else if (typeof value === "boolean") {
      fields[key] = { type: "BOOLEAN", optional: true };
    } else if (value instanceof Date) {
      fields[key] = { type: "TIMESTAMP_MILLIS", optional: true };
    } else {
      fields[key] = { type: "UTF8", optional: true };
    }
  }

  // Add __rowMarker__ as the last field (required by spec)
  fields.__rowMarker__ = { type: "INT32" };

  return new ParquetSchema(fields);
}
