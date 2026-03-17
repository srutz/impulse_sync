import { constants } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { consola, initLogger } from "./logger";
import { CONFIG_DIR, CONFIG_PATH, MARKERS_PATH } from "./paths";

export type SyncTable = {
  tableKey: string;
  query: string;
  enabled: boolean;
  syncType: "full" | "timestamp" | "primarykey";
  primaryKey?: string;
  timeStampColumn?: string;
  rowsPerSync?: number;
  singleFileMode?: boolean;
};

export type Config = {
  postgres: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  delaySecondsBetweenSyncs?: number; // default is 300 seconds
  logFilePath?: string; // optional path to log file for persistent logging
  syncTables: SyncTable[];
};

export type SyncMarkers = {
  changedTs: string;
  markers: Record<string, string>;
};

let config: Config | null = null;

async function checkForExistingConfig() {
  try {
    await access(CONFIG_PATH, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function bootstrapConfig() {
  // Ensure directory exists
  await mkdir(CONFIG_DIR, { recursive: true });

  // Check and create config.json if it doesn't exist
  try {
    await access(CONFIG_PATH, constants.F_OK);
  } catch {
    const defaultConfig: Config = {
      postgres: {
        host: "localhost",
        port: 5432,
        user: "postgres",
        password: "your_password",
        database: "your_database",
      },
      delaySecondsBetweenSyncs: 10,
      syncTables: [
        {
          tableKey: "sales1",
          enabled: true,
          query:
            "select id, order_id, date, customer_name, product, category, modified_at from sales",
          syncType: "full",
          primaryKey: "id",
        },
      ],
    };
    await writeFile(
      CONFIG_PATH,
      JSON.stringify(defaultConfig, null, 2),
      "utf-8",
    );
    consola.info(
      `Created default config at ${CONFIG_PATH}. Please update it with your settings.`,
    );
  }

  // Check and create sync_markers.json if it doesn't exist
  try {
    await access(MARKERS_PATH, constants.F_OK);
  } catch {
    const defaultMarkers: SyncMarkers = {
      changedTs: new Date().toISOString(),
      markers: {},
    };
    await writeFile(
      MARKERS_PATH,
      JSON.stringify(defaultMarkers, null, 2),
      "utf-8",
    );
    consola.info(`Created default sync markers at ${MARKERS_PATH}.`);
  }
  config = await loadConfig(CONFIG_PATH);
  initLogger(config);
}

async function loadConfig(path: string) {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as Config;
}

async function showConfig() {
  const content = await loadConfig(CONFIG_PATH);
  consola.info("Current Sync Table Configurations:");
  consola.info(JSON.stringify(content.syncTables, null, 2));
}

export {
  checkForExistingConfig,
  bootstrapConfig,
  config,
  loadConfig,
  showConfig,
};
