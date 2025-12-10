import { readFile, writeFile, mkdir, access } from "fs/promises";
import { constants } from "fs";
import { homedir } from "os";
import { join } from "path";
import { consola } from "consola";

export type SyncTable = {
  tableKey: string;
  query: string;
}

export type Config = {
  postgres: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  },
  syncTables: SyncTable[]
}

export type SyncMarkers = {
  changedTs: string
  markers: Record<string, string>
}

const CONFIG_DIR = join(homedir(), ".impulse_sync");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
const MARKERS_PATH = join(CONFIG_DIR, "sync_markers.json");

let config: Config | null = null;
let syncMarkers: SyncMarkers | null = null;

export async function bootstrapConfig() {
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
        database: "your_database"
      },
      syncTables: []
    };
    await writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), "utf-8");
    consola.info(`Created default config at ${CONFIG_PATH}. Please update it with your settings.`);
  }

  // Check and create sync_markers.json if it doesn't exist
  try {
    await access(MARKERS_PATH, constants.F_OK);
  } catch {
    const defaultMarkers: SyncMarkers = {
      changedTs: new Date().toISOString(),
      markers: {}
    };
    await writeFile(MARKERS_PATH, JSON.stringify(defaultMarkers, null, 2), "utf-8");
    consola.info(`Created default sync markers at ${MARKERS_PATH}.`);
  }

  config = await loadConfig(CONFIG_PATH);
  syncMarkers = await loadSyncMarkers(MARKERS_PATH);
}

export async function loadConfig(path: string) {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as Config;
}

export async function loadSyncMarkers(path: string) {
  const content = await readFile(path, "utf-8");
  return JSON.parse(content) as SyncMarkers;
}

export { config, syncMarkers };