import { consola } from "consola";
import { loadConfig } from "./config";
import { getSyncMarker, setSyncMarker } from "./syncmarkers";
import { readdir } from "fs/promises";
import { join } from "path";
import { unlink } from "fs/promises";
import { CONFIG_PATH, FILES_DIR } from "./paths";
import { isDirectory } from "./util";



export async function tableReset(tableName: string) {
  const tableFilesDirectory = join(FILES_DIR, tableName);
  const config = await loadConfig(CONFIG_PATH);
  const table = config!.syncTables.find(t => t.tableKey === tableName);
  if (!table) {
    consola.error(`Table "${tableName}" not found in config.`);
    return;
  }
  try {
    if (await isDirectory(tableFilesDirectory)) {
      const files = await readdir(tableFilesDirectory);
      const parquetFiles = files.filter(f => f.endsWith('.parquet'));
      for (const file of parquetFiles) {
        const filePath = join(tableFilesDirectory, file);
        await unlink(filePath);
        consola.info(`Deleted file: ${filePath}`);
      }
    }
    consola.success(`Reset completed for table: ${tableName}`);
    await setSyncMarker(tableName, null);
  } catch (error) {
    consola.error(`Error resetting table ${tableName}: ${error}`);
  }
}

export async function tableShow(tableName: string) {
  const tableFilesDirectory = join(FILES_DIR, tableName);
  const config = await loadConfig(CONFIG_PATH);
  const table = config!.syncTables.find(t => t.tableKey === tableName);
  if (!table) {
    consola.error(`table "${tableName}" not found in config.`);
    return;
  }
  const marker = await getSyncMarker(tableName)
  consola.info(`table: "${table.tableKey}", storage: ${tableFilesDirectory}`);
  consola.info(`  syncmarker = ${marker ? marker : "<none>"}`);
  let files: string[] = [];
  if (await isDirectory(tableFilesDirectory)) {
    files = await readdir(tableFilesDirectory);
  }
  const parquetFiles = files.filter(f => f.endsWith('.parquet'));
  if (parquetFiles.length === 0) {
    consola.info("  no parquet files found.");
  } else {
    consola.info(`  files:`);
    for (const file of parquetFiles) {
      const filePath = join(tableFilesDirectory, file);
      consola.info(`    ${filePath}`);
    }
  }
  consola.log("");
}
